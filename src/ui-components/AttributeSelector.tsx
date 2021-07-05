import React, { ReactElement, useEffect } from "react";
import Select from "./Select";
import { useAttributes } from "../utils/hooks";

interface AttributeSelectorProps {
  context: string | null;
  value: string | null;
  disabled?: boolean;
  onChange: (s: string | null) => void;
}

export default function AttributeSelector({
  context,
  value,
  onChange,
  disabled,
}: AttributeSelectorProps): ReactElement {
  const attributes = useAttributes(context);

  useEffect(() => {
    if (disabled) {
      return;
    }
    if (value && !attributes.map((a) => a.name).includes(value)) {
      onChange(null);
    }
  }, [value, onChange, attributes, disabled]);

  return (
    <Select
      onChange={(e) => onChange(e.target.value)}
      options={
        disabled && value !== null
          ? [{ value: value, title: value }]
          : attributes
              // filter out hidden attrs (keep attrs that have hidden undefined)
              .filter((attr) => !attr.hidden)
              .map((attribute) => ({
                value: attribute.name,
                title: attribute.title || attribute.name,
              }))
      }
      value={value}
      defaultValue="Select an attribute"
      disabled={disabled}
    />
  );
}
