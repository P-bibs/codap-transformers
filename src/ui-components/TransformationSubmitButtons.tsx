import React, { ReactElement } from "react";

interface TransformationSubmitButtonsProps {
  onCreate: () => void;
  onUpdate: () => void;
  updateDisabled: boolean;
}

export function TransformationSubmitButtons({
  onCreate,
  onUpdate,
  updateDisabled,
}: TransformationSubmitButtonsProps): ReactElement {
  return (
    <>
      <button onClick={onCreate}>Create table with transformation</button>
      <button onClick={onUpdate} disabled={updateDisabled}>
        Update previous table with transformation
      </button>
    </>
  );
}
