import React, { ReactElement, ChangeEvent, useEffect } from "react";
import Select from "./Select";
import { useDataContexts } from "../../lib/utils/hooks";

interface ContextSelectorProps {
  value: string | null;
  onChange: (context: string | null) => void;
}

export default function ContextSelector({
  value,
  onChange,
}: ContextSelectorProps): ReactElement {
  const dataContexts = useDataContexts();

  // Check if selected context still exists. If not, reset the selection.
  useEffect(() => {
    if (value !== null && !dataContexts.map((d) => d.name).includes(value)) {
      onChange(null);
    }
  }, [value, dataContexts, onChange]);

  // If there is only one available context, select it
  useEffect(() => {
    if (value === null && dataContexts.length === 1) {
      onChange(dataContexts[0].name);
    }
  }, [value, dataContexts, onChange]);

  function onSelectChange(e: ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value);
  }

  return (
    <Select
      onChange={onSelectChange}
      options={dataContexts.map((dataContext) => ({
        value: dataContext.name,
        title: dataContext.title,
      }))}
      value={value}
      defaultValue="Select a Dataset"
    />
  );
}
