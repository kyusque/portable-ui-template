"""
streamlit_sample
================
Sample Streamlit integration for portable-ui-template components.

Usage
-----
    streamlit run app.py
"""

from __future__ import annotations

import json
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

# Path to the built component frontend assets (output of `pnpm build:static`)
_FRONTEND_DIR = Path(__file__).parent / "frontend"

# Declare the custom component
_sample_component = components.declare_component(
    "sample_component",
    path=str(_FRONTEND_DIR),
)


def sample_component(
    data: dict | None = None,
    key: str | None = None,
) -> dict | None:
    """Render the SampleComponent inside Streamlit.

    Parameters
    ----------
    data:
        Initial data to pass to the component as ``initialData``.
    key:
        An optional key to uniquely identify this component instance.

    Returns
    -------
    dict | None
        The value returned by the component (e.g. the current items list).
    """
    props = {"initialData": data or {}}
    return _sample_component(**props, key=key, default=None)
