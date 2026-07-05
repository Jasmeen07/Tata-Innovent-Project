"""Digital checklist automation for maintenance verification."""

from __future__ import annotations

from datetime import datetime, timezone

from backend.models.schemas import ChecklistItem, ToolRecord, ToolStatus


class MaintenanceChecklist:
    """Track maintenance steps and complete them from observed tool states."""

    def __init__(self) -> None:
        """Create the default aircraft maintenance checklist."""

        self.items = [
            ChecklistItem(id=1, name="Remove Panel", required_tools=["screwdriver"]),
            ChecklistItem(id=2, name="Use Screwdriver", required_tools=["screwdriver"]),
            ChecklistItem(id=3, name="Use Wrench", required_tools=["spanner", "adjustable_wrench", "socket_wrench"]),
            ChecklistItem(id=4, name="Install Component", required_tools=["human_hand"]),
            ChecklistItem(id=5, name="Return Tools", required_tools=[]),
            ChecklistItem(id=6, name="Close Panel", required_tools=["aircraft_panel"]),
            ChecklistItem(id=7, name="Verify Workspace", required_tools=[]),
        ]

    def update(self, tools: dict[int, ToolRecord]) -> None:
        """Update checklist completion from current tool accountability state."""

        seen_names = {tool.tool_name for tool in tools.values()}
        all_returned = bool(tools) and all(tool.status in {ToolStatus.RETURNED, ToolStatus.AVAILABLE} for tool in tools.values())
        for item in self.items:
            if item.completed:
                continue
            if item.name == "Return Tools" and all_returned:
                self._complete(item)
            elif item.name == "Verify Workspace" and all_returned:
                self._complete(item)
            elif item.required_tools and any(name in seen_names for name in item.required_tools):
                self._complete(item)

    def as_dicts(self) -> list[dict]:
        """Return checklist items as JSON-ready dictionaries."""

        return [item.model_dump(mode="json") for item in self.items]

    def _complete(self, item: ChecklistItem) -> None:
        """Mark one checklist item complete."""

        item.completed = True
        item.completed_at = datetime.now(timezone.utc)

