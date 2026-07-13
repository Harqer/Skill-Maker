import json

def generate_mcp_server(skill_name: str, description: str, folder_name: str) -> str:
    """
    Generates a functional mcp-server.json or python MCP scaffolding script for the created subagent.
    This enables the subagent to be exposed as a native MCP tool in Claude Desktop, Cursor, etc.
    """
    
    # We will scaffold a lightweight Python MCP Server using the Model Context Protocol
    mcp_script = f"""import os
import json
import subprocess
from mcp.server.fastmcp import FastMCP

# Define the FastMCP server for {skill_name}
mcp = FastMCP("{skill_name}")

SKILL_DIR = os.path.dirname(os.path.abspath(__file__))

@mcp.tool()
def execute_{folder_name.replace("-", "_")}_validation() -> str:
    \"\"\"Execute the {skill_name} subagent to validate constraints against the codebase.\"\"\"
    script_path = os.path.join(SKILL_DIR, "scripts", "validate.js")
    
    if not os.path.exists(script_path):
        return "Validation script not found. Subagent is not fully implemented."
        
    try:
        result = subprocess.run(["node", script_path], capture_output=True, text=True)
        if result.returncode == 0:
            return f"Validation Passed: {{result.stdout}}"
        else:
            return f"Validation Failed: {{result.stderr}}"
    except Exception as e:
        return f"Execution Error: {{str(e)}}"

# Note: The Redis Context Retriever tools can be injected here automatically by 
# the AI Builder if the subagent requires operational data access.

if __name__ == "__main__":
    mcp.run()
"""

    return mcp_script

def generate_mcp_config(skill_name: str, folder_name: str) -> str:
    """Generates the MCP configuration JSON for Claude Desktop / Cursor."""
    config = {
        "mcpServers": {
            skill_name.lower().replace(" ", "-"): {
                "command": "python",
                "args": [
                    f".agents/skills/{folder_name}/mcp_server.py"
                ]
            }
        }
    }
    return json.dumps(config, indent=2)
