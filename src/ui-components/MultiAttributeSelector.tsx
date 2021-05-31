import React, { ReactElement, useState, useEffect } from "react";
import CodapFlowSelect from "./CodapFlowSelect";
import { useAttributes } from "../utils/hooks";

interface MultiAttributeSelectorProps {
  context: string | null;
  onChange: (selected: string[]) => void;
}

export default function MultiAttributeSelector({
  context,
  onChange,
}: MultiAttributeSelectorProps): ReactElement {
  const attributes = useAttributes(context);
  const [selected, setSelected] = useState<string[]>([]);

  // If selected contains an outdated value (attribute name that has been)
  // deleted, then start over with selection
  useEffect(() => {
    const attrNames = attributes.map((a) => a.name);
    setSelected(selected.filter((a) => attrNames.includes(a)));
  }, [attributes, selected]);

  // Call `onChange` whenever selected updates
  useEffect(() => {
    onChange(selected);
  }, [onChange, selected]);

  return (
    <>
      {[...Array(selected.length + 1).keys()].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <CodapFlowSelect
            onChange={(e) => {
              const newSelected = [...selected];
              newSelected[i] = e.target.value;
              setSelected(newSelected);
            }}
            options={attributes.map((attribute) => ({
              value: attribute.name,
              title: attribute.title,
            }))}
            value={selected[i]}
            defaultValue="Select an attribute"
            showValue={true}
          />
          {i === selected.length ? null : (
            <button
              onClick={() => {
                setSelected([
                  ...selected.slice(0, i),
                  ...selected.slice(i + 1),
                ]);
              }}
            >
              🗙
            </button>
          )}
        </div>
      ))}
    </>
  );
}
