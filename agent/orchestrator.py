"""
orchestrator.py — LangGraph skill-generation pipeline.

Graph topology (with correct fan-in synchronization):
  START
    └─► scrape_and_analyze
          ├─► generate_skill_card ─┐
          └─► scaffold_mcp_server ─┴─► join_artifacts
                                            └─► sandbox_and_sanitize
                                                    └─► ingest_skill
                                                            └─► reflect_and_evolve
                                                                    └─► END

Key fixes vs. previous version:
  • All secrets sourced from config.py (Infisical-injected env).
  • Fan-in race condition resolved with an explicit join_artifacts node.
  • ingest_skill node added: chunks the generated SKILL.md and stores
    embeddings in Redis so skills are immediately semantically searchable.
  • LangSmith tracing enabled via LANGCHAIN_TRACING_V2 (set in config.py).
"""
import os
import uuid
import json
import operator
from typing import TypedDict, Annotated, Optional

from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.redis import RedisSaver
from langgraph.checkpoint.memory import InMemorySaver  # renamed from MemorySaver in 2026
from tenacity import retry, stop_after_attempt, wait_exponential
from redis import Redis

from langchain_community.cache import RedisCache
from langchain_core.globals import set_llm_cache

import config  # noqa — sets LANGCHAIN_TRACING_V2, GOOGLE_API_KEY, etc.
from config import REDIS_URI
from memory_client import RedisAgentMemoryClient
from context_retriever import get_context_tools
from context_surfaces import SkillVectorStore
from scraper import scrape_docs
from mcp_generator import generate_mcp_config
from security_sandbox import sanitize_mcp_script, sanitize_skill_content
from databricks_store import SkillRecord, get_store as get_databricks_store

# ── Redis & LLM setup ────────────────────────────────────────────────────────

redis_client = Redis.from_url(REDIS_URI)
try:
    set_llm_cache(RedisCache(redis_=redis_client))
except Exception as e:
    print(f"Warning: Failed to set Redis LLM cache: {e}")

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0)
agent_memory = RedisAgentMemoryClient()
skill_store = SkillVectorStore()


# ── State ────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages:    Annotated[list[AnyMessage], operator.add]
    skill_content: str
    target_url:  str
    include_mcp: bool
    folder_name: str
    mcp_script:  Optional[str]
    mcp_config:  Optional[str]
    scraped_text: str
    analysis:    str
    db_id:       Optional[int]   # set externally by worker so ingest can tag by skill id


# ── Nodes ────────────────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def scrape_and_analyze(state: AgentState):
    """Fetch and summarise the documentation at target_url."""
    url = state["target_url"]
    scraped_text = scrape_docs(url)

    context_tools = get_context_tools()
    llm_with_tools = llm.bind_tools(context_tools)

    sys_msg = SystemMessage(
        content=(
            "You are an expert documentation analyzer. "
            "Summarize the overall capabilities of the skill based on the provided API documentation. "
            "Extract any specific API endpoints, required parameters, and authentication methods. "
            "If the extracted text contains pre-written Agent Skills (e.g. SKILL.md format), "
            "output them clearly so they can be preserved verbatim."
        )
    )
    analysis_prompt = HumanMessage(content=f"Documentation from {url}:\n\n{scraped_text}")
    response = llm_with_tools.invoke([sys_msg] + state["messages"] + [analysis_prompt])
    return {"messages": [response], "scraped_text": scraped_text, "analysis": response.content}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def generate_skill_card(state: AgentState):
    """Generate the SKILL.md content following the skill_creator_prompt standards."""
    prompt_path = os.path.join(os.path.dirname(__file__), "skill_creator_prompt.txt")
    with open(prompt_path) as f:
        skill_creator_prompt = f.read()

    sys_msg = SystemMessage(
        content=(
            "You are an expert skill creator agent. Based on the scraped URL analysis, "
            "generate the final SKILL.md output.\n"
            "CRITICAL: If the analysis contains pre-written Agent Skills provided by the "
            "documentation, you MUST use those as the basis for your output. Preserve their "
            "core instructions and only adapt them to fit the required SKILL.md YAML frontmatter format.\n"
            "OUTPUT FORMAT: Output ONLY the raw markdown content. Do not use ```md wrappers.\n\n"
            "FOLLOW THESE EXPERT INSTRUCTIONS FOR HOW A SKILL SHOULD BE WRITTEN:\n\n"
            f"{skill_creator_prompt}"
        )
    )
    response = llm.invoke(
        [sys_msg] + state["messages"] + [HumanMessage(content=f"Analysis:\n{state.get('analysis', '')}")]
    )
    folder_name = (state["target_url"].split("/")[-1] or "custom-skill").replace(".", "-").lower()
    return {"messages": [response], "skill_content": response.content, "folder_name": folder_name}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def scaffold_mcp_server(state: AgentState):
    """Generate MCP server Python code — only runs when include_mcp is True."""
    if not state.get("include_mcp", False):
        return {}

    folder_name = (state["target_url"].split("/")[-1] or "custom-skill").replace(".", "-").lower()
    skill_name = folder_name.replace("-", " ").title()
    analysis = state.get("analysis", "")

    sys_msg = SystemMessage(
        content=(
            f"You are an expert Python MCP developer. "
            f"Generate a fully functional Python script using `mcp.server.fastmcp.FastMCP`.\n"
            f"The server is named \"{skill_name}\".\n"
            "Create distinct `@mcp.tool()` functions for each API endpoint identified in the analysis.\n"
            "Output ONLY the raw Python code (no markdown code blocks)."
        )
    )
    response = llm.invoke([sys_msg, HumanMessage(content=f"Generate the MCP server based on:\n\n{analysis}")])

    mcp_script = response.content.strip()
    for prefix in ("```python", "```"):
        if mcp_script.startswith(prefix):
            mcp_script = mcp_script[len(prefix):]
    if mcp_script.endswith("```"):
        mcp_script = mcp_script[:-3]

    return {
        "mcp_script": mcp_script.strip(),
        "mcp_config": generate_mcp_config(skill_name, folder_name),
        "folder_name": folder_name,
    }


def join_artifacts(state: AgentState):
    """
    Fan-in synchronization node.
    Both generate_skill_card and scaffold_mcp_server merge into here.
    LangGraph accumulates state from both branches before this node runs,
    so no explicit logic is needed — the node just passes state through.
    """
    return {}


def sandbox_and_sanitize(state: AgentState):
    """AST-scan MCP script and regex-scan SKILL.md for malicious patterns."""
    sanitized_skill = sanitize_skill_content(state.get("skill_content", ""))
    mcp_script = state.get("mcp_script")
    sanitized_mcp = sanitize_mcp_script(mcp_script) if mcp_script else None
    return {"skill_content": sanitized_skill, "mcp_script": sanitized_mcp}


def ingest_skill(state: AgentState):
    """
    Chunk the generated SKILL.md by headers and store embeddings in Redis.
    This makes skills semantically searchable immediately after generation.
    The skill_id tag is the db_id (set by the RQ worker before invoking the graph).
    """
    skill_content = state.get("skill_content", "")
    db_id = state.get("db_id")
    if not skill_content:
        return {}

    skill_id = str(db_id) if db_id is not None else str(uuid.uuid4())
    try:
        n = skill_store.ingest(skill_id=skill_id, markdown=skill_content)
        print(f"[ingest_skill] Stored {n} chunks for skill_id={skill_id}")
    except Exception as e:
        # Non-fatal — skill generation still succeeds even if indexing fails
        print(f"[ingest_skill] Warning: Failed to index skill in Redis: {e}")
    return {}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def reflect_and_evolve(state: AgentState):
    """
    Self-Evolution Harness: Analyze generated artifacts for weaknesses.
    Stores reflection in Redis Agent Memory for future runs.
    """
    skill_content = state.get("skill_content", "")
    mcp_script = state.get("mcp_script", "")
    url = state.get("target_url", "")

    sys_msg = SystemMessage(
        content=(
            "You are an expert self-reflection AI. Analyze the generated skill and MCP server "
            "for weaknesses, missing best practices, or potential improvements. "
            "Provide a concise reflection that can be used to improve future generations. "
            "Focus on harness-level improvements (tools, prompts, execution logic) "
            "rather than model weights."
        )
    )
    response = llm.invoke([
        sys_msg,
        HumanMessage(content=f"Analyze artifacts for {url}:\n\nSKILL:\n{skill_content}\n\nMCP:\n{mcp_script}"),
    ])

    agent_memory.add_session_event(
        session_id="global_evolution_harness",
        role="SYSTEM_REFLECTION",
        text=f"Reflection on {url}:\n{response.content}",
    )
    return {}


# ── Graph assembly ────────────────────────────────────────────────────────────

workflow = StateGraph(AgentState)

workflow.add_node("scrape_and_analyze",  scrape_and_analyze)
workflow.add_node("generate_skill_card", generate_skill_card)
workflow.add_node("scaffold_mcp_server", scaffold_mcp_server)
workflow.add_node("join_artifacts",      join_artifacts)       # fan-in gate
workflow.add_node("sandbox_and_sanitize", sandbox_and_sanitize)
workflow.add_node("ingest_skill",        ingest_skill)
workflow.add_node("reflect_and_evolve",  reflect_and_evolve)

workflow.add_edge(START,                  "scrape_and_analyze")
# Parallel fan-out
workflow.add_edge("scrape_and_analyze",   "generate_skill_card")
workflow.add_edge("scrape_and_analyze",   "scaffold_mcp_server")
# Fan-in: both branches must complete before join_artifacts fires
workflow.add_edge("generate_skill_card",  "join_artifacts")
workflow.add_edge("scaffold_mcp_server",  "join_artifacts")
# Linear pipeline after join
workflow.add_edge("join_artifacts",       "sandbox_and_sanitize")
workflow.add_edge("sandbox_and_sanitize", "ingest_skill")
workflow.add_edge("ingest_skill",         "reflect_and_evolve")
workflow.add_edge("reflect_and_evolve",   END)

# ── Checkpointer ─────────────────────────────────────────────────────────────
# 2026 API: RedisSaver.from_conn_string() is the canonical constructor.
# It returns a context manager; call checkpointer.setup() once on first use.
# Falls back to InMemorySaver (renamed from MemorySaver) if Redis is unavailable.

def _build_app():
    """
    Compile the LangGraph workflow with an appropriate checkpointer.

    RedisSaver.from_conn_string() is opened as a context manager and kept alive
    for the lifetime of the process by assigning the __enter__ result to a
    module-level variable.  This matches the pattern in the official 2026 docs.
    """
    try:
        saver_ctx = RedisSaver.from_conn_string(REDIS_URI)
        checkpointer = saver_ctx.__enter__()
        checkpointer.setup()  # idempotent after first run
        print("LangGraph checkpointer: RedisSaver (production)")
    except Exception as e:
        print(f"Warning: RedisSaver failed, falling back to InMemorySaver: {e}")
        saver_ctx = None
        checkpointer = InMemorySaver()
    return workflow.compile(checkpointer=checkpointer), saver_ctx

app, _redis_saver_ctx = _build_app()


# ── Public entrypoint ─────────────────────────────────────────────────────────

def run_orchestrator(
    url: str,
    prompt: str,
    include_mcp: bool = False,
    user_id: str = "anonymous",
    thread_id: str = None,
    db_id: int = None,
) -> dict:
    if not thread_id:
        thread_id = str(uuid.uuid4())
    run_id = str(uuid.uuid4())

    config_dict = {
        "run_id": run_id,
        "configurable": {"thread_id": thread_id},
        "tags": [f"user_id:{user_id}"],
    }

    agent_memory.add_session_event(
        session_id=thread_id,
        role="USER",
        text=f"Create a skill for {url}. Task: {prompt}. Include MCP: {include_mcp}",
    )

    initial_state = {
        "messages":    [HumanMessage(content=f"Target URL: {url}\nTask: {prompt}")],
        "target_url":  url,
        "skill_content": "",
        "include_mcp": include_mcp,
        "folder_name": "",
        "mcp_script":  None,
        "mcp_config":  None,
        "scraped_text": "",
        "analysis":    "",
        "db_id":       db_id,
    }

    print(f"[orchestrator] Starting graph — thread={thread_id}, run={run_id}")
    for event in app.stream(initial_state, config_dict):
        for node_name in event:
            print(f"[orchestrator] Node completed: {node_name}")

    final_state = app.get_state(config_dict)
    skill_content = final_state.values.get("skill_content", "")
    mcp_script    = final_state.values.get("mcp_script")

    agent_memory.add_session_event(
        session_id=thread_id,
        role="AGENT",
        text="Generated skill content and MCP Server (if requested).",
    )

    trace_url = None
    try:
        from langsmith import Client
        ls_client = Client()
        trace_url = ls_client.share_run(run_id)
        print(f"[orchestrator] LangSmith trace: {trace_url}")
    except Exception as e:
        print(f"[orchestrator] Failed to generate LangSmith trace URL: {e}")

    # ── Persist to Databricks lakehouse (non-fatal) ───────────────────────────
    folder_name = final_state.values.get("folder_name", "")
    try:
        db = get_databricks_store()
        db.write_skill(SkillRecord(
            skill_id=run_id,
            folder_name=folder_name,
            target_url=url,
            skill_content=skill_content,
            mcp_script=mcp_script,
            mcp_config=final_state.values.get("mcp_config"),
            langsmith_trace_url=trace_url,
            thread_id=thread_id,
            user_id=user_id,
        ))
        db.write_trace(
            run_id=run_id,
            thread_id=thread_id,
            user_id=user_id,
            trace_url=trace_url,
            target_url=url,
        )
    except Exception as e:
        print(f"[orchestrator] Databricks write skipped: {e}")

    return {
        "thread_id":    thread_id,
        "skill_content": skill_content,
        "mcp_script":   mcp_script,
        "mcp_config":   final_state.values.get("mcp_config"),
        "trace_url":    trace_url,
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
