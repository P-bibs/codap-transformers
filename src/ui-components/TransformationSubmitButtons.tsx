import React, { ReactElement } from "react";

interface TransformationSubmitButtonsProps {
  onCreate: () => void;
}

export default function TransformationSubmitButtons({
  onCreate,
}: TransformationSubmitButtonsProps): ReactElement {
  return (
    <>
      <button onClick={onCreate}>Create table with transformation</button>
    </>
  );
}
