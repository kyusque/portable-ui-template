"""SampleRecordGridWidget — a DuckDB-free Streamlit record grid."""
from __future__ import annotations

from base64 import b64encode
import mimetypes
from pathlib import Path
from typing import Any, Mapping

import streamlit.components.v1 as components

_FRONTEND_DIR = Path(__file__).parent / "frontend" / "SampleRecordGridWidget"
_component = components.declare_component("sample_record_grid_widget", path=str(_FRONTEND_DIR))
_MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024


def _serialize_file(path: str | Path | Mapping[str, str]) -> dict[str, str]:
    """Read an explicitly supplied server file without exposing its path."""
    if isinstance(path, Mapping):
        name = path.get("name")
        href = path.get("href")
        if isinstance(name, str) and isinstance(href, str) and href.startswith("data:"):
            return {"name": name, "href": href}
        raise ValueError("Asset mappings must contain a name and a data URL.")
    source = Path(path).expanduser().resolve(strict=True)
    size = source.stat().st_size
    if size > _MAX_ATTACHMENT_BYTES:
        raise ValueError(
            f"Attachment {source.name!r} is {size} bytes; "
            f"the Streamlit widget limit is {_MAX_ATTACHMENT_BYTES} bytes."
        )
    mime_type = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
    encoded = b64encode(source.read_bytes()).decode("ascii")
    return {
        "name": source.name,
        "href": f"data:{mime_type};base64,{encoded}",
    }


def SampleRecordGridWidget(
    rows: list[dict[str, str]] | None = None,
    columns: list[str] | None = None,
    images: list[str | Path | Mapping[str, str]] | None = None,
    attachments: list[str | Path | Mapping[str, str]] | None = None,
    revision: int = 0,
    key: str | None = None,
) -> dict[str, Any] | None:
    """Render an editable record grid and return its current state.

    ``images`` and ``attachments`` are server-side file paths. They are read by
    Python and sent as bounded browser-safe URLs; browser code never receives
    local paths.
    """
    return _component(
        rows=rows or [],
        columns=columns or [],
        images=[_serialize_file(path) for path in images or []],
        attachments=[_serialize_file(path) for path in attachments or []],
        revision=revision,
        key=key,
        default=None,
    )
