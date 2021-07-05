import React, { ReactElement, ChangeEvent } from "react";
import Select from "./Select";
import { useDataContexts } from "../utils/hooks";

interface ContextSelectorProps {
  value: string | null;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export default function ContextSelector({
  value,
  onChange,
}: ContextSelectorProps): ReactElement {
  const dataContexts = useDataContexts();

  return (
    <Select
      onChange={onChange}
      options={dataContexts.map((dataContext) => ({
        value: dataContext.name,
        title: dataContext.title,
      }))}
      value={value}
      defaultValue="Select a Dataset"
    />
  );
}
