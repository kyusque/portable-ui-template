"""Sample Streamlit app demonstrating streamlit_portable_ui_sample usage."""
import streamlit as st
from streamlit_portable_ui_sample import SampleWidget, NoteListWidget

st.title("portable-ui-template — Streamlit Sample")

st.write(
    """
This page embeds React components from `streamlit_portable_ui_sample` as
Streamlit custom components. Each widget maps 1:1 to a React component
built from `src/components/`.

Build the frontends first:

```bash
pnpm build:streamlit
```
"""
)

st.subheader("SampleWidget")
initial = {"title": "Hello from Streamlit", "count": 42}
result = SampleWidget(data=initial, key="sample")
if result:
    st.subheader("SampleWidget returned:")
    st.json(result)

st.subheader("NoteListWidget")
note_result = NoteListWidget(initial_body="", key="notes")
if note_result:
    st.subheader("NoteListWidget returned:")
    st.json(note_result)
