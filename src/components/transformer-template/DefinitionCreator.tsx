import React, { ReactElement, useState } from "react";
import { BaseTransformerName } from "../../transformerList";
import { SavedTransformerContent, TransformerSaveData } from "./types";
import { createDataInteractive } from "../../lib/codapPhone";
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

  function saveTransformer(data: TransformerSaveData) {
    const { name, description } = data;

    if (name.trim() === "") {
      setSaveErr("Please give the transformer a name before saving.");
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
