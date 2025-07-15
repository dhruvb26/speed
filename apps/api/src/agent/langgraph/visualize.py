from agent import create_langgraph_workflow

def visualize_workflow():
    """Visualize the LangGraph workflow"""
    graph = create_langgraph_workflow()
    
    try:
        # Try to save as PNG file
        png_data = graph.get_graph().draw_mermaid_png()
        with open("workflow_diagram.png", "wb") as f:
            f.write(png_data)
        print("✅ Workflow diagram saved as 'workflow_diagram.png'")
    except Exception as e:
        print(f"⚠️  Could not generate PNG: {e}")
    
    try:
        # Print the Mermaid diagram text
        mermaid_text = graph.get_graph().draw_mermaid()
        print("\n📊 Mermaid Diagram:")
        print("=" * 50)
        print(mermaid_text)
        print("=" * 50)
        print("\n💡 You can copy the above Mermaid code and paste it into:")
        print("   - https://mermaid.live/")
        print("   - Any Markdown file that supports Mermaid")
        print("   - VS Code with Mermaid extension")
    except Exception as e:
        print(f"❌ Could not generate Mermaid text: {e}")

if __name__ == "__main__":
    visualize_workflow()