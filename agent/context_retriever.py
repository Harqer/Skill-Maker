import asyncio
from typing import List, Any
from langchain_core.tools import tool
from context_surfaces import UnifiedClient, ContextModel, ContextField
from config import CTX_AGENT_KEY

class WorkspaceContext(ContextModel):
    """Governed access to API specs, code guidelines, and past subagent skills."""
    __redis_key_template__ = "workspace:{id}"
    
    id: str = ContextField(description="Unique ID", is_key_component=True)
    title: str = ContextField(description="Title", index="text")
    content: str = ContextField(description="Content", index="text")
    embedding: list[float] = ContextField(
        description="Vector embedding", 
        index="vector", 
        vector_dim=768, 
        distance_metric="cosine", 
        default_factory=list
    )
    metadata: str = ContextField(description="JSON metadata", index="text", default="")

def get_context_tools() -> List[Any]:
    """Get the LangChain tools exposed by the Redis Context Retriever."""
    
    @tool
    def query_business_context(query: str) -> str:
        """Retrieve operational business context, API documentation, or code guidelines from Redis."""
        # This uses the Context Surfaces UnifiedClient to invoke the MCP tools deployed in production.
        # It relies on CTX_AGENT_KEY, CTX_API_URL, and CTX_MCP_URL environment variables.
        async def run_query():
            try:
                # In production, ensure CTX_AGENT_KEY is set in Infisical.
                if not CTX_AGENT_KEY:
                    return "Error: CTX_AGENT_KEY is not configured in Infisical."

                async with UnifiedClient() as client:
                    result = await client.query_tool(
                        agent_key=CTX_AGENT_KEY,
                        tool_name="search_workspacecontext_by_text",
                        arguments={"query": query, "limit": 5}
                    )
                    return str(result)
            except Exception as e:
                return f"Failed to retrieve context from Redis Context Retriever: {e}"

        return asyncio.run(run_query())

    return [query_business_context]
