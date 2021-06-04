import React, { ReactElement, useState } from "react";
import CodapFlowSelect from "./CodapFlowSelect";
import { useAttributes } from "../utils/hooks";

interface MultiAttributeSelectorProps {
  context: string | null;
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export default function MultiAttributeSelector({
  context,
  onChange,
  disabled,
}: MultiAttributeSelectorProps): ReactElement {
  const attributes = useAttributes(context);
  const [count, setCount] = useState<number>(0);
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <>
      {[...Array(count + 1).keys()].map((i) => (
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
              onChange(newSelected);
              if (i === count) {
                setCount(count + 1);
              }
            }}
            options={attributes.map((attribute) => ({
              value: attribute.name,
              title: attribute.title,
            }))}
            value={selected[i]}
            defaultValue="Select an attribute"
            showValue={true}
            disabled={disabled}
          />
          {i === count ? null : (
            <button
              onClick={() => {
                setCount(count - 1);
                setSelected([
                  ...selected.slice(0, i),
                  ...selected.slice(i + 1),
                ]);
              }}
              disabled={disabled}
            >
              🗙
            </button>
          )}
        </div>
      ))}
    </>
  );
}
