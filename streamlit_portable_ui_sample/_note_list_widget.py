"""NoteListWidget — wraps the React NoteList component."""
from __future__ import annotations

from pathlib import Path

import streamlit.components.v1 as components

_FRONTEND_DIR = Path(__file__).parent / "frontend" / "NoteList"

_component = components.declare_component(
    "note_list_widget",
    path=str(_FRONTEND_DIR),
)


def NoteListWidget(
    initial_body: str = "",
    key: str | None = None,
) -> dict | None:
    """Render the React NoteList component inside Streamlit.

    Parameters
    ----------
    initial_body:
        Pre-filled text for the note input.
    key:
        Unique key for this component instance.

    Returns
    -------
    dict | None
        Value returned by the component.
    """
    return _component(initialBody=initial_body, key=key, default=None)
