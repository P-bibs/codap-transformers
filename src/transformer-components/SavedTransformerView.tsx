import React, { ReactElement } from "react";
import { useState } from "react";
import "./TransformerViews.css";
import ErrorDisplay from "../ui-components/Error";
import { SavedTransformer } from "./types";
import { TransformerRenderer } from "./TransformerRenderer";

/**
 * SavedTransformerView wraps a saved transformer in other important info
 * like it's name/purpose statement and an error box
 */
function SavedTransformerView({
  transformer: urlTransformer,
}: {
  transformer: SavedTransformer;
}): ReactElement {
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [editable, setEditable] = useState<boolean>(false);

  return (
    <div className="transformer-view">
      <h2>
        {urlTransformer.name}
        <span id="transformerBase"> ({urlTransformer.content.base})</span>
      </h2>
      {urlTransformer.description && <p>{urlTransformer.description}</p>}
      <TransformerRenderer
        setErrMsg={setErrMsg}
        errorDisplay={<ErrorDisplay message={errMsg} />}
        transformer={urlTransformer}
        editable={editable}
      />
      <button onClick={() => setEditable(!editable)}>Edit</button>
    </div>
  );
}

export default SavedTransformerView;
