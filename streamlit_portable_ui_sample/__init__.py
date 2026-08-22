"""
streamlit_portable_ui_sample
=============================
Streamlit custom components for portable-ui-template.

The sample React components map to Python widgets:

    from streamlit_portable_ui_sample import (
        SampleRecordGridWidget,
        SampleTableInspectorWidget,
    )

The ``frontend/`` directories contain the Vite build outputs. They are populated
by the corresponding build script:

    pnpm build:streamlit → frontend/SampleRecordGridWidget/
                              frontend/SampleTableInspectorWidget/
"""

from ._sample_record_grid_widget import SampleRecordGridWidget
from ._sample_table_inspector_widget import SampleTableInspectorWidget

__all__ = ["SampleRecordGridWidget", "SampleTableInspectorWidget"]
