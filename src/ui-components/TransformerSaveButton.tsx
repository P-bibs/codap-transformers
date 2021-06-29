import React, { ReactElement, useState } from "react";
import { TextArea, TextInput } from ".";
import { BaseTransformerName } from "../transformer-components/transformerList";
import {
  SavedTransformerContent,
  TransformerSaveData,
} from "../transformer-components/types";
import { createDataInteractive } from "../utils/codapPhone";

interface TransformerSaveButtonProps {
  generateSaveData: () => TransformerSaveData;
  base: BaseTransformerName;
  disabled?: boolean;
}

export default function TransformerSaveButton({
  generateSaveData,
  base,
  disabled,
}: TransformerSaveButtonProps): ReactElement {
  const [currentName, setCurrentName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  function saveTransformer(
    name: string,
    description: string | undefined,
    data: TransformerSaveData
  ) {
    if (name === "") {
      return;
    }

    // Create a new transformer in a new data interactive window
    // TODO: can we do this without casting?
    const content: SavedTransformerContent = {
      base,
      data,
    } as SavedTransformerContent;

    const savedTransformer = { name, description, content };
    const encoded = encodeURIComponent(JSON.stringify(savedTransformer));
    createDataInteractive(name, `http://localhost:3000?transform=${encoded}`);
  }

  return (
    <div style={{ marginTop: "5px" }}>
      <hr style={{ marginTop: "15px" }} />
      <div className="input-group">
        <h3>Save This Transformer</h3>
        <div
          style={{
            height: "175px",
            display: "flex",
            marginTop: "2px",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <TextInput
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder={"Transformer Name"}
          />
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Purpose Statement"
          />
          <button
            disabled={disabled}
            onClick={() => {
              saveTransformer(
                currentName,
                description === "" ? undefined : description,
                generateSaveData()
              );
              setCurrentName("");
              setDescription("");
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
