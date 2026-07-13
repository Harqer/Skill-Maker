import os
from context_surfaces.context_model import ContextField, ContextModel


class AgentSkill(ContextModel):
    redis_key_template = "skill:{name}"
    
    name: str = ContextField(description="The name of the skill", is_key_component=True, index="text")
    description: str = ContextField(description="A brief description of what the skill does", index="text")
    markdown_content: str = ContextField(description="The full SKILL.md markdown content", index="text")
    source_url: str = ContextField(description="The URL the skill was scraped from", index="text")
    created_at: str = ContextField(description="Timestamp of when the skill was created", index="text")

if __name__ == "__main__":
    print("AgentSkill model defined.")
