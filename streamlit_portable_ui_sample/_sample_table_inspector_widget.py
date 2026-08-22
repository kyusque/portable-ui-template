"""SampleTableInspectorWidget — a read-only Streamlit table inspector."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping

import streamlit.components.v1 as components

_FRONTEND_DIR = Path(__file__).parent / "frontend" / "SampleTableInspectorWidget"
_component = components.declare_component(
    "sample_table_inspector_widget",
    path=str(_FRONTEND_DIR),
)


def _serialize_row(row: Mapping[str, Any]) -> dict[str, str]:
    """Convert Python data to the serializable table-inspector contract."""
    key = row.get("key")
    if not isinstance(key, str):
        raise ValueError("Each inspector row must contain a string 'key'.")
    data = row.get("data")
    return {
        "key": key,
        "data": data if isinstance(data, str) else json.dumps(data, ensure_ascii=False),
    }


def SampleTableInspectorWidget(
    rows: list[Mapping[str, Any]] | None = None,
    key: str | None = None,
) -> None:
    """Render rows supplied by Python without returning widget state."""
    _component(
        rows=[_serialize_row(row) for row in rows or []],
        key=key,
        default=None,
    )
