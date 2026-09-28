"""Terminal helpers shared by the Week 4 lessons."""


def confirm(description: str) -> bool:
    """Ask the human before doing something with side effects. Only "y" means yes."""
    reply = input(f"\n✋ {description}\n   Go ahead? (y/n) ")
    return reply.strip().lower() == "y"
