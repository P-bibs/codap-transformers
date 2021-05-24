import React, { ReactElement } from "react";

interface CodapFlowTextAreaProps {
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  value: string;
}

export function CodapFlowTextArea({
  onChange,
  value,
}: CodapFlowTextAreaProps): ReactElement {
  return <textarea onChange={onChange} value={value} />;
}
