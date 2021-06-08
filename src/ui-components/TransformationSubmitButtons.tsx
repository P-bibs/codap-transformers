import React, { ReactElement } from "react";
import "./TransformationSubmitButtons.css";

interface TransformationSubmitButtonsProps {
  onCreate: () => void;
}

export default function TransformationSubmitButtons({
  onCreate,
}: TransformationSubmitButtonsProps): ReactElement {
  return (
    <>
      <button id="applyTransformation" onClick={onCreate}>
        Apply Transformation
      </button>
    </>
  );
}
