import React, { ReactElement, useState } from "react";
import { BaseTransformerName } from "../../transformerList";
import { SavedTransformerContent, TransformerSaveData } from "./types";
import { createDataInteractive } from "../../lib/codapPhone";
import "./styles/DefinitionCreator.css";
import ErrorDisplay from "../ui-components/Error";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowDropUpIcon from "@material-ui/icons/ArrowDropUp";
import { IconButton } from "@material-ui/core";

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
  const [saveUIShown, setSaveUIShown] = useState<boolean>(false);

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

    // clear save inputs after successful save
    setSaveUIShown(false);
  }

  function toggleSaveUI(): void {
    setSaveUIShown(!saveUIShown);
    setSaveErr(null);
  }

  return (
    <div style={{ marginTop: "5px" }}>
      <hr style={{ marginTop: "15px" }} />
      <div className="input-group">
        <h3>
          Save This Transformer
          <IconButton
            style={{
              marginLeft: "5px",
              padding: "0",
              background: "var(--blue-green)",
              color: "white",
            }}
            size="small"
            onClick={toggleSaveUI}
          >
            {saveUIShown ? (
              <ArrowDropUpIcon fontSize="inherit" />
            ) : (
              <ArrowDropDownIcon fontSize="inherit" />
            )}
          </IconButton>
        </h3>
        <div
          hidden={!saveUIShown}
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
            Save
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
