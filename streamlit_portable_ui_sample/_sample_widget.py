"""SampleWidget — wraps the React SampleComponent."""
from __future__ import annotations

from pathlib import Path

import streamlit.components.v1 as components

_FRONTEND_DIR = Path(__file__).parent / "frontend" / "SampleComponent"

_component = components.declare_component(
    "sample_widget",
    path=str(_FRONTEND_DIR),
)


def SampleWidget(
    data: dict | None = None,
    key: str | None = None,
) -> dict | None:
    """Render the React SampleComponent inside Streamlit.

    Parameters
    ----------
    data:
        Initial data to pass as ``initialData`` prop.
    key:
        Unique key for this component instance.

    Returns
    -------
    dict | None
        Value returned by the component.
    """
    return _component(initialData=data or {}, key=key, default=None)
