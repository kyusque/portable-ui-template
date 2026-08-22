"""
streamlit_portable_ui_sample
=============================
Streamlit custom components for portable-ui-template.

Each React component maps to one Python widget:

    from streamlit_portable_ui_sample import SampleWidget, NoteListWidget

The ``frontend/<ComponentName>/`` directories contain the Vite build output
for each component.  They are NOT managed by Python — they are populated by
running the corresponding build script:

    pnpm build:streamlit:sample_component   → frontend/SampleComponent/
    pnpm build:streamlit:note_list          → frontend/NoteList/
"""

from ._sample_widget import SampleWidget
from ._note_list_widget import NoteListWidget

__all__ = ["SampleWidget", "NoteListWidget"]
