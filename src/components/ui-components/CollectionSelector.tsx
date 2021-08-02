import React, { ReactElement, ChangeEvent } from "react";
import Select from "./Select";
import { useCollections } from "../../lib/utils/hooks";

interface CollectionSelectorProps {
  context: string | null;
  value: string | null;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}

export default function CollectionSelector({
  context,
  value,
  onChange,
  disabled,
}: CollectionSelectorProps): ReactElement {
  const collections = useCollections(context);

  return (
    <Select
      onChange={onChange}
      options={collections.map((collection) => ({
        value: collection.name,
        title: collection.title,
      }))}
      value={value}
      defaultValue="Select a collection"
      disabled={disabled}
      tooltip="A collection is a set of cases with a group of attributes. The name of a collection is shown above the names of its attributes."
    />
  );
}
