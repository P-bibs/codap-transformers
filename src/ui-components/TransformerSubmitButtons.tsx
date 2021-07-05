import React, { ReactElement } from "react";
import "./TransformerSubmitButtons.css";

interface TransformerSubmitButtonsProps {
  onCreate: () => void;
  label?: string;
}

export default function TransformerSubmitButtons({
  onCreate,
  label = "Apply Transformer",
}: TransformerSubmitButtonsProps): ReactElement {
  return (
    <>
      <button id="applyTransformer" onClick={onCreate}>
        {label}
      </button>
    </>
  );
}
