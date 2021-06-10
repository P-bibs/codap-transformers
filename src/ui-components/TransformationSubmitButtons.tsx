import React, { ReactElement } from "react";
import "./TransformationSubmitButtons.css";

interface TransformationSubmitButtonsProps {
  onCreate: () => void;
  label?: string;
}

export default function TransformationSubmitButtons({
  onCreate,
  label = "Apply Transformation",
}: TransformationSubmitButtonsProps): ReactElement {
  return (
    <>
      <button id="applyTransformation" onClick={onCreate}>
        {label}
      </button>
    </>
  );
}
