"""Development demo for the packaged Streamlit widgets."""
from base64 import b64decode, b64encode
from hashlib import sha256
import json
import mimetypes
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Mapping

import duckdb
import streamlit as st

from streamlit_portable_ui_sample import (
    SampleRecordGridWidget,
    SampleTableInspectorWidget,
)


def _asset_metadata(asset: Mapping[str, Any]) -> dict[str, str]:
    name = asset.get("name")
    href = asset.get("href")
    if not isinstance(name, str):
        raise ValueError("Saved assets must include a string name.")
    if not isinstance(href, str) or not href.startswith("data:"):
        raise ValueError("Saved assets must include a data URL.")
    _, encoded = href.split(",", 1)
    return {"name": name, "hash": sha256(b64decode(encoded)).hexdigest()}


def _file_asset(path: Path) -> dict[str, str]:
    mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return {
        "name": path.name,
        "href": f"data:{mime_type};base64,{b64encode(path.read_bytes()).decode('ascii')}",
    }


def _decode_asset(asset: Mapping[str, Any]) -> tuple[str, str, bytes]:
    name = asset.get("name")
    href = asset.get("href")
    if not isinstance(name, str):
        raise ValueError("Assets must include a string name.")
    if not isinstance(href, str) or not href.startswith("data:"):
        raise ValueError("Assets must include a data URL.")
    header, encoded = href.split(",", 1)
    mime_type = header[5:].split(";", 1)[0] or "application/octet-stream"
    return name, mime_type, b64decode(encoded)


def _browser_compatible_rows(rows: list[Mapping[str, Any]]) -> tuple[list[tuple[str, str]], dict[str, bytes]]:
    """Translate Streamlit assets into Browser `records` and CAS `assets` rows."""
    records: list[tuple[str, str]] = []
    assets: dict[str, bytes] = {}
    for row in rows:
        key = row.get("key")
        if not isinstance(key, str):
            raise ValueError("Records must include a string key.")
        data = {
            field: value
            for field, value in row.items()
            if field not in {"key", "images", "attachments"}
        }
        images = row.get("images", [])
        if isinstance(images, list) and images:
            _, mime_type, content = _decode_asset(images[0])
            image_hash = sha256(content).hexdigest()
            assets[image_hash] = content
            data["imageHash"] = image_hash
            data["imageType"] = mime_type
        attachments = row.get("attachments", [])
        if not isinstance(attachments, list):
            raise ValueError("Record attachments must be a list.")
        browser_attachments = []
        for attachment in attachments:
            name, mime_type, content = _decode_asset(attachment)
            content_hash = sha256(content).hexdigest()
            assets[content_hash] = content
            browser_attachments.append({"hash": content_hash, "name": name, "type": mime_type})
        if browser_attachments:
            data["attachments"] = browser_attachments
        records.append((key, json.dumps(data, ensure_ascii=False)))
    return records, assets


def _export_browser_compatible_duckdb(rows: list[Mapping[str, Any]]) -> bytes:
    """Create a `.duckdb` file compatible with the Browser OPFS implementation."""
    records, assets = _browser_compatible_rows(rows)
    with TemporaryDirectory() as directory:
        database_path = Path(directory) / "portable-ui.duckdb"
        connection = duckdb.connect(str(database_path))
        try:
            connection.execute("CREATE TABLE records (key TEXT NOT NULL PRIMARY KEY, data JSON)")
            connection.execute(
                "CREATE TABLE assets (hash TEXT NOT NULL PRIMARY KEY, content BLOB NOT NULL, size INTEGER NOT NULL)"
            )
            connection.executemany("INSERT INTO records VALUES (?, ?)", records)
            connection.executemany(
                "INSERT INTO assets VALUES (?, ?, ?)",
                [(content_hash, content, len(content)) for content_hash, content in assets.items()],
            )
        finally:
            connection.close()
        return database_path.read_bytes()


def _data_url(content: bytes, mime_type: str) -> str:
    return f"data:{mime_type};base64,{b64encode(content).decode('ascii')}"


def _json_object(value: Any) -> dict[str, Any]:
    if isinstance(value, str):
        value = json.loads(value)
    if not isinstance(value, Mapping):
        raise ValueError("Record data must be a JSON object.")
    return dict(value)


def _import_browser_compatible_duckdb(content: bytes) -> list[dict[str, Any]]:
    """Load Browser `records` and CAS `assets` rows into Streamlit widget rows."""
    with TemporaryDirectory() as directory:
        database_path = Path(directory) / "portable-ui-import.duckdb"
        database_path.write_bytes(content)
        connection = duckdb.connect(str(database_path), read_only=True)
        try:
            table_names = {
                name
                for (name,) in connection.execute(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'"
                ).fetchall()
            }
            if not {"records", "assets"}.issubset(table_names):
                raise ValueError("The imported file must contain Browser-compatible records and assets tables.")
            assets = {
                content_hash: bytes(asset_content)
                for content_hash, asset_content in connection.execute(
                    "SELECT hash, content FROM assets"
                ).fetchall()
            }
            records = connection.execute("SELECT key, data FROM records ORDER BY key").fetchall()
        finally:
            connection.close()

    widget_rows = []
    for key, data_json in records:
        data = _json_object(data_json)
        image_hash = data.pop("imageHash", None)
        image_type = data.pop("imageType", "image/png")
        images = []
        if image_hash is not None:
            if not isinstance(image_hash, str) or image_hash not in assets:
                raise ValueError(f"Image asset {image_hash!r} is missing from assets.")
            images.append({
                "name": "image",
                "href": _data_url(assets[image_hash], str(image_type)),
            })

        attachments = []
        for attachment in data.pop("attachments", []):
            if not isinstance(attachment, Mapping):
                raise ValueError("Record attachments must be objects.")
            content_hash = attachment.get("hash")
            name = attachment.get("name")
            mime_type = attachment.get("type")
            if not all(isinstance(value, str) for value in (content_hash, name, mime_type)):
                raise ValueError("Record attachment metadata is invalid.")
            if content_hash not in assets:
                raise ValueError(f"Attachment asset {content_hash!r} is missing from assets.")
            attachments.append({
                "name": name,
                "href": _data_url(assets[content_hash], mime_type),
            })
        widget_rows.append({"key": str(key), **data, "images": images, "attachments": attachments})
    return widget_rows


def _inspector_row(row: Mapping[str, Any]) -> dict[str, Any]:
    key = row.get("key")
    if not isinstance(key, str):
        raise ValueError("Saved records must include a string key.")
    data = {
        field: value
        for field, value in row.items()
        if field not in {"key", "images", "attachments"}
    }
    for field in ("images", "attachments"):
        assets = row.get(field)
        if isinstance(assets, list):
            data[field] = [_asset_metadata(asset) for asset in assets]
        elif assets is None:
            data[field] = []
        else:
            raise ValueError(f"Saved record {field!r} must be a list.")
    return {"key": key, "data": data}


st.set_page_config(page_title="portable-ui-template Streamlit demo", layout="wide")
st.title("portable-ui-template - Streamlit demo")
st.caption("Save returns record data to Python; the inspector renders the normalized record metadata.")

image_path = Path(__file__).parent / "demo-assets" / "spreadsheet.svg"
attachment_path = Path(__file__).parent / "demo-assets" / "instructions.txt"
initial_rows = [
    {"key": "row-1", "title": "Hello from Streamlit", "note": "Edit this row"},
    {"key": "row-2", "title": "Another row", "note": "Add, reorder, or delete rows"},
]
initial_widget_rows = [
    {
        **row,
        **({"images": [_file_asset(image_path)], "attachments": [_file_asset(attachment_path)]} if index == 0 else {}),
    }
    for index, row in enumerate(initial_rows)
]

grid_rows = st.session_state.get("imported_grid_rows", initial_widget_rows)
grid_revision = st.session_state.get("grid_revision", 0)
st.subheader("Editable record grid")
saved_value = SampleRecordGridWidget(
    columns=["title", "note"],
    rows=grid_rows,
    revision=grid_revision,
    key="spreadsheet-widget",
)
if saved_value is not None:
    st.success("Saved data was received by Python and is shown below as normalized metadata.")

saved_rows = saved_value["rows"] if saved_value is not None else grid_rows
inspector_rows = [_inspector_row(row) for row in saved_rows]
st.subheader("Table inspector")
SampleTableInspectorWidget(rows=inspector_rows, key="table-inspector")

st.subheader("Browser-compatible DuckDB import and export")
st.caption("Uses the same records(key, data JSON) and assets(hash, content BLOB, size) schema as the Browser app.")
import_file = st.file_uploader("Import portable-ui.duckdb", type="duckdb")
if st.button("Load imported database", disabled=import_file is None):
    try:
        st.session_state["imported_grid_rows"] = _import_browser_compatible_duckdb(import_file.getvalue())
    except (duckdb.Error, ValueError) as error:
        st.error(f"Could not import portable-ui.duckdb: {error}")
    else:
        st.session_state["grid_revision"] = st.session_state.get("grid_revision", 0) + 1
        st.rerun()
st.download_button(
    "Download portable-ui.duckdb",
    data=_export_browser_compatible_duckdb(saved_rows),
    file_name="portable-ui.duckdb",
    mime="application/vnd.duckdb",
)
