import React, { ReactElement } from "react";

interface CodapFlowTextAreaProps {
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  value: string;
  disabled?: boolean;
}

export default function CodapFlowTextArea({
  onChange,
  value,
  disabled,
}: CodapFlowTextAreaProps): ReactElement {
  return <textarea onChange={onChange} value={value} disabled={disabled} />;
}
