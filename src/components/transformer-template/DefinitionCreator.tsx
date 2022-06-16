import React, { ReactElement, useState } from "react";
import { BaseTransformerName } from "../../transformerList";
import { SavedTransformerContent, TransformerSaveData } from "./types";
import { createDataInteractive, getAllComponents } from "../../lib/codapPhone";
import "./styles/DefinitionCreator.css";
import ErrorDisplay from "../ui-components/Error";

interface DefinitionCreatorProps {
  generateSaveData: () => TransformerSaveData;
  base: BaseTransformerName;
  disabled?: boolean;
}

export default function DefinitionCreator({
  generateSaveData,
  base,
  disabled,
}: DefinitionCreatorProps): ReactElement {
  const [saveErr, setSaveErr] = useState<string | null>(null);

  async function saveTransformer(data: TransformerSaveData) {
    let { name, purposeStatement } = data;

    name = name.trim();

    if (name === "") {
      setSaveErr("Please give the Transformer a name before saving.");
      return;
    }

    // Make sure a transformer with this name doesn't exist already
    const components = await getAllComponents();
    const full_name = `Transformer: ${name}`;
    if (components.find((c) => c.title === full_name)) {
      setSaveErr("A Transformer with that name already exists");
      return;
    }

    // Create a new transformer in a new data interactive window
    // TODO: can we do this without casting?
    const content: SavedTransformerContent = {
      base,
      data,
    } as SavedTransformerContent;

    const savedTransformer = { name, purposeStatement, content };
    const encoded = encodeURIComponent(JSON.stringify(savedTransformer));

    const savedUrl = new URL(window.location.toString());
    savedUrl.searchParams.append("transform", encoded);

    createDataInteractive(name, savedUrl.toString());
  }

  return (
    <div style={{ marginTop: "5px" }}>
      <div className="input-group">
        <div
          style={{
            marginTop: "2px",
          }}
        >
          <button
            disabled={disabled}
            onClick={() => {
              saveTransformer(generateSaveData());
            }}
            className="save-transformer-button"
          >
            Save Transformer
          </button>
          <ErrorDisplay
            setErrMsg={(err, _id) => setSaveErr(err)}
            store={saveErr === null ? [] : [[0, saveErr]]}
          />
        </div>
      </div>
    </div>
  );
}
