import os
import sys
import json
import uuid
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langsmith import Client, evaluate


ls_client = Client()

def evaluate_skill(prompt: str, skill_content: str, assertions: list):
    dataset_name = f"eval_{uuid.uuid4().hex[:8]}"
    dataset = ls_client.create_dataset(dataset_name, description="Dynamic eval dataset")
    
    ls_client.create_examples(
        inputs=[{"prompt": prompt}],
        outputs=[{"assertions": assertions}],
        dataset_id=dataset.id
    )
    
    def baseline_app(inputs: dict) -> dict:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
        p = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful AI assistant."),
            ("user", "{prompt}")
        ])
        chain = p | llm
        response = chain.invoke({"prompt": inputs["prompt"]})
        
        tokens = 0
        if hasattr(response, "response_metadata"):
            tokens = response.response_metadata.get("token_usage", {}).get("total_tokens", 0)
            
        return {"output": response.content, "tokens": tokens}

    def guided_app(inputs: dict) -> dict:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
        p = ChatPromptTemplate.from_messages([
            ("system", "You are an expert agent. Follow these strict skill guidelines:\n\n{skill_content}"),
            ("user", "{prompt}")
        ])
        chain = p | llm
        response = chain.invoke({"prompt": inputs["prompt"], "skill_content": skill_content})
        
        tokens = 0
        if hasattr(response, "response_metadata"):
            tokens = response.response_metadata.get("token_usage", {}).get("total_tokens", 0)
            
        return {"output": response.content, "tokens": tokens}
        
    def llm_judge(run, example) -> dict:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
        output = run.outputs["output"]
        assertions_list = example.outputs["assertions"]
        
        grader_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an objective expert agent evaluator acting as a skill-testing grader."),
            ("user", "Output to grade:\n{output}\n\nAssertions:\n{assertions_text}\n\nFor each assertion, determine if the Output passed it, and provide evidence. Your output MUST be a JSON array of objects with keys 'assertion' (string), 'passed' (boolean), and 'evidence' (string) corresponding to each assertion in order.")
        ])
        
        assertions_text = "\n".join([f"{i+1}. {a}" for i, a in enumerate(assertions_list)])
        chain = grader_prompt | llm
        response = chain.invoke({"output": output, "assertions_text": assertions_text})
        
        try:
            text = response.content.replace("```json", "").replace("```", "").strip()
            result = json.loads(text)
        except Exception:
            result = [{"assertion": a, "passed": False, "evidence": "Failed to parse grader JSON"} for a in assertions_list]
            
        all_passed = all(r.get("passed", False) for r in result)
        return {"key": "llm_judge", "score": 1.0 if all_passed else 0.0, "comment": json.dumps(result)}

    baseline_results = evaluate(
        baseline_app,
        data=dataset_name,
        evaluators=[llm_judge],
        experiment_prefix="baseline"
    )
    
    guided_results = evaluate(
        guided_app,
        data=dataset_name,
        evaluators=[llm_judge],
        experiment_prefix="guided"
    )
    
    def extract_metrics(eval_results_iter):
        results_list = list(eval_results_iter)
        if not results_list:
            return {"output": "", "total_tokens": 0, "latency": 0, "grades": []}
            
        res = results_list[0]
        run_obj = res["run"]
        output_text = run_obj.outputs.get("output", "")
        tokens = run_obj.outputs.get("tokens", 0)
        
        latency = 0
        if run_obj.end_time and run_obj.start_time:
            latency = (run_obj.end_time - run_obj.start_time).total_seconds()
            
        evals = res["evaluation_results"]["results"]
        grades = []
        for e in evals:
            if getattr(e, "key", "") == "llm_judge" and getattr(e, "comment", ""):
                grades = json.loads(e.comment)
                break
                
        return {
            "output": output_text,
            "total_tokens": tokens,
            "latency": latency,
            "grades": grades
        }
        
    final_baseline = extract_metrics(baseline_results)
    final_guided = extract_metrics(guided_results)
    
    all_guided_passed = all(g.get("passed", False) for g in final_guided.get("grades", []))
    if all_guided_passed:
        ls_client.delete_dataset(dataset_id=dataset.id)
        
    return {
        "baseline": final_baseline,
        "withSkill": final_guided
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python evaluate_skill.py '<json_input>'")
        sys.exit(1)
        
    try:
        input_data = json.loads(sys.argv[1])
        results = evaluate_skill(
            input_data["prompt"],
            input_data.get("skill_content", ""),
            input_data.get("assertions", [])
        )
        print(json.dumps(results))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
