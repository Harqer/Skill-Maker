import os
from langsmith import Client, evaluate
import uuid


client = Client()

def test_eval():
    dataset_name = f"test_ds_{uuid.uuid4().hex[:4]}"
    dataset = client.create_dataset(dataset_name)
    client.create_examples(
        inputs=[{"question": "Hi"}],
        outputs=[{"answer": "Hello"}],
        dataset_id=dataset.id
    )
    
    def my_app(inputs):
        return {"output": "Hello there", "tokens": 10}
        
    def my_evaluator(run, example):
        return {"key": "correctness", "score": 1.0, "comment": "good"}
        
    results = evaluate(my_app, data=dataset_name, evaluators=[my_evaluator], experiment_prefix="test")
    results_list = list(results)
    
    # Check structure
    res = results_list[0]
    print(res.keys() if isinstance(res, dict) else dir(res))
    
    # In latest langsmith, it's a dict. Let's try dict access:
    try:
        print("RUN outputs:", res["run"].outputs)
        evals = res["evaluation_results"]["results"]
        print("EVAL results:", evals)
    except Exception as e:
        print("Error accessing as dict:", e)
        print("Trying as object...")
        print("RUN outputs:", res.run.outputs)
        print("EVAL results:", res.evaluation_results["results"])
        
    client.delete_dataset(dataset_id=dataset.id)

if __name__ == "__main__":
    test_eval()
