import React, { ReactElement } from "react";
import "./TransformerSubmitButton.css";

interface TransformerSubmitButtonProps {
  onCreate: () => void;
  label?: string;
}

export default function TransformerSubmitButton({
  onCreate,
  label = "Apply Transformer",
}: TransformerSubmitButtonProps): ReactElement {
  return (
    <>
      <button id="applyTransformer" onClick={onCreate}>
        {label}
      </button>
    </>
  );
}
