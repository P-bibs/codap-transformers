import React, { ReactElement } from "react";

interface TransformationSubmitButtonsProps {
  onCreate: () => void;
  label?: string;
}

export default function TransformationSubmitButtons({
  onCreate,
  label = "Create table with transformation",
}: TransformationSubmitButtonsProps): ReactElement {
  return (
    <>
      <button onClick={onCreate}>{label}</button>
    </>
  );
}
