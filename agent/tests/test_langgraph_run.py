import uuid
import os
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
import operator
from langchain_core.callbacks import collect_runs


class State(TypedDict):
    messages: Annotated[list, operator.add]

def dummy_node(state):
    return {"messages": [HumanMessage(content="Hello!")]}

workflow = StateGraph(State)
workflow.add_node("dummy", dummy_node)
workflow.add_edge(START, "dummy")
workflow.add_edge("dummy", END)
app = workflow.compile()

with collect_runs() as cb:
    for event in app.stream({"messages": []}, config={"configurable": {"thread_id": "123"}}):
        pass
    print("Traced runs:", cb.traced_runs)
    if cb.traced_runs:
        print("Run ID:", cb.traced_runs[0].id)
