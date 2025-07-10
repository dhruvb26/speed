from IPython.display import Image, display
from agent import create_langgraph_workflow

graph = create_langgraph_workflow()
try:
    display(Image(graph.get_graph().draw_mermaid_png()))
except Exception:
    # This requires some extra dependencies and is optional
    pass