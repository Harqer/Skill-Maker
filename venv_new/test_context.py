import asyncio
import os
from context_surfaces import UnifiedClient

async def main():
    token = os.getenv("AGENT_MEMORY_TOKEN")
    async with UnifiedClient() as client:
        print("Connected")
        try:
            tools = await client.list_tools(token)
            print("Tools:", tools)
        except Exception as e:
            print("Error:", e)

asyncio.run(main())
