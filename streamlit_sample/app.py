"""Sample Streamlit app demonstrating streamlit_sample usage."""
import streamlit as st
from streamlit_sample import sample_component

st.title("portable-ui-template — Streamlit Sample")

st.write(
    """
This page embeds the React `SampleComponent` as a Streamlit custom component.
Data is exchanged via the component's props and return value.
"""
)

initial = {"title": "Hello from Streamlit", "count": 42}
result = sample_component(data=initial, key="demo")

if result:
    st.subheader("Component returned:")
    st.json(result)
