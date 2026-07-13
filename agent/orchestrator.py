import os
import uuid
import json
from typing import TypedDict, Annotated, List, Optional

from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage
import operator
from tenacity import retry, stop_after_attempt, wait_exponential


from langgraph.checkpoint.redis import RedisSaver
from memory_client import RedisAgentMemoryClient
from context_retriever import get_context_tools
from scraper import scrape_docs
from mcp_generator import generate_mcp_config

class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    skill_content: str
    target_url: str
    include_mcp: bool
    folder_name: str
    mcp_script: Optional[str]
    mcp_config: Optional[str]
    scraped_text: str
    analysis: str

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
agent_memory = RedisAgentMemoryClient()

from langchain_text_splitters import RecursiveCharacterTextSplitter

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def scrape_and_analyze(state: AgentState):
    """Subagent expert: scrapes the URL and analyzes the content"""
    url = state['target_url']
    scraped_text = scrape_docs(url)
    
    messages = state['messages']
    
    context_tools = get_context_tools()
    llm_with_tools = llm.bind_tools(context_tools)
    
    sys_msg = SystemMessage(content="You are an expert documentation analyzer. Summarize the overall capabilities of the skill based on the provided API documentation. Extract any specific API endpoints, required parameters, and authentication methods. If the extracted text contains pre-written Agent Skills (e.g. SKILL.md format, instructions for an AI agent), output them clearly so they can be preserved verbatim.")
    
    analysis_prompt = HumanMessage(content=f"Documentation from {url}:\n\n{scraped_text}")
    
    response = llm_with_tools.invoke([sys_msg] + messages + [analysis_prompt])
    
    return {"messages": [response], "scraped_text": scraped_text, "analysis": response.content}

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def generate_skill_card(state: AgentState):
    """Subagent expert: generates the skill definitions enforcing 'Great Skill' standards"""
    messages = state['messages']
    analysis = state.get('analysis', '')
    
    import os
    prompt_path = os.path.join(os.path.dirname(__file__), "skill_creator_prompt.txt")
    with open(prompt_path, "r") as f:
        skill_creator_prompt = f.read()

    sys_msg = SystemMessage(content=f"""You are an expert skill creator agent. Based on the scraped URL analysis, generate the final SKILL.md output.
CRITICAL: If the analysis contains pre-written Agent Skills provided by the documentation, you MUST use those as the basis for your output. Preserve their core instructions and only adapt them to fit the required SKILL.md YAML frontmatter format.
OUTPUT FORMAT: Output ONLY the raw markdown content. Do not use ```md wrappers.

FOLLOW THESE EXACT EXPERT INSTRUCTIONS FOR HOW A SKILL SHOULD BE WRITTEN AND STRUCTURED:

{skill_creator_prompt}
""")
    
    response = llm.invoke([sys_msg] + messages + [HumanMessage(content=f"Analysis:\n{analysis}")])
    
    folder_name = state['target_url'].split("/")[-1] or "custom-skill"
    folder_name = folder_name.replace(".", "-").lower()
    
    return {"messages": [response], "skill_content": response.content, "folder_name": folder_name}

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def scaffold_mcp_server(state: AgentState):
    """Dynamically generates the MCP server code based on API analysis"""
    if not state.get("include_mcp", False):
        return {}
        
    folder_name = state.get("folder_name", "custom-skill")
    skill_name = folder_name.replace("-", " ").title()
    analysis = state.get("analysis", "")
    
    sys_msg = SystemMessage(content=f"""You are an expert Python MCP developer. 
Generate a fully functional Python script using `mcp.server.fastmcp.FastMCP`.
The server is named "{skill_name}".
Create distinct `@mcp.tool()` functions for each API endpoint identified in the analysis.
Output ONLY the raw Python code (no markdown code blocks, just raw text).""")
    
    prompt = HumanMessage(content=f"Generate the MCP server based on this API analysis:\n\n{analysis}")
    response = llm.invoke([sys_msg, prompt])
    
    # Strip markdown if present
    mcp_script = response.content.strip()
    if mcp_script.startswith("```python"):
        mcp_script = mcp_script[9:]
    if mcp_script.startswith("```"):
        mcp_script = mcp_script[3:]
    if mcp_script.endswith("```"):
        mcp_script = mcp_script[:-3]
        
    mcp_config = generate_mcp_config(skill_name, folder_name)
    
    return {"mcp_script": mcp_script.strip(), "mcp_config": mcp_config}

workflow = StateGraph(AgentState)
workflow.add_node("scrape_and_analyze", scrape_and_analyze)
workflow.add_node("generate_skill_card", generate_skill_card)
workflow.add_node("scaffold_mcp_server", scaffold_mcp_server)

workflow.add_edge(START, "scrape_and_analyze")
workflow.add_edge("scrape_and_analyze", "generate_skill_card")
workflow.add_edge("generate_skill_card", "scaffold_mcp_server")
workflow.add_edge("scaffold_mcp_server", END)

from redis import Redis
redis_uri = os.getenv("REDIS_URI", "redis://localhost:6379")
redis_client = Redis.from_url(redis_uri)
memory = RedisSaver(redis_client=redis_client)
try:
    memory.setup()
except Exception as e:
    print(f"Warning: memory.setup() failed: {e}")
app = workflow.compile(checkpointer=memory)

def run_orchestrator(url: str, prompt: str, include_mcp: bool = False, user_id: str = "anonymous", thread_id: str = None):
    if not thread_id:
        thread_id = str(uuid.uuid4())
    run_id = str(uuid.uuid4())
    config = {
        "run_id": run_id, 
        "configurable": {"thread_id": thread_id},
        "tags": [f"user_id:{user_id}"]
    }
    
    agent_memory.add_session_event(
        session_id=thread_id,
        role="USER",
        text=f"Create a skill for {url}. Task: {prompt}. Include MCP: {include_mcp}"
    )

    initial_state = {
        "messages": [HumanMessage(content=f"Target URL: {url}\nTask: {prompt}")],
        "target_url": url,
        "skill_content": "",
        "include_mcp": include_mcp,
        "folder_name": "",
        "mcp_script": None,
        "mcp_config": None,
        "scraped_text": "",
        "analysis": ""
    }
    
    print(f"Starting LangGraph Orchestrator for thread: {thread_id} with Run ID: {run_id}")
    
    for event in app.stream(initial_state, config):
        for k, v in event.items():
            print(f"Node completed: {k}")
            
    final_state = app.get_state(config)
    skill_content = final_state.values.get("skill_content", "")
    mcp_script = final_state.values.get("mcp_script")
    
    agent_memory.add_session_event(
        session_id=thread_id,
        role="AGENT",
        text=f"Generated skill content and MCP Server (if requested)."
    )
    
    # Try to generate public LangSmith trace URL
    trace_url = None
    try:
        from langsmith import Client
        ls_client = Client()
        trace_url = ls_client.share_run(run_id)
        print(f"Generated public LangSmith trace URL: {trace_url}")
    except Exception as e:
        print(f"Failed to generate LangSmith trace URL: {e}")
    
    return {
        "thread_id": thread_id,
        "skill_content": skill_content,
        "mcp_script": mcp_script,
        "mcp_config": final_state.values.get("mcp_config"),
        "trace_url": trace_url
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        mcp_flag = "--mcp" in sys.argv
        res = run_orchestrator(sys.argv[1], sys.argv[2], include_mcp=mcp_flag)
        print("Final Result SKILL.md:")
        print(res["skill_content"])
        if mcp_flag:
            print("\nMCP Server Script:")
            print(res["mcp_script"])
    else:
        print("Usage: python orchestrator.py <url> <prompt> [--mcp]")
