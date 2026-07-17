import uuid
import os
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
import operator
from langsmith import Client
import time


class State(TypedDict):
    messages: Annotated[list, operator.add]

def dummy_node(state):
    return {"messages": [HumanMessage(content="Hello!")]}

workflow = StateGraph(State)
workflow.add_node("dummy", dummy_node)
workflow.add_edge(START, "dummy")
workflow.add_edge("dummy", END)
app = workflow.compile()

os.environ["LANGCHAIN_TRACING_V2"] = "true"
client = Client()

run_id = uuid.uuid4()
print("Run ID generated:", run_id)
for event in app.stream({"messages": []}, config={"run_id": run_id, "configurable": {"thread_id": "123"}}):
    pass

time.sleep(2)
try:
    public_url = client.share_run(run_id)
    print("Public URL:", public_url)
except Exception as e:
    print("Error:", e)
