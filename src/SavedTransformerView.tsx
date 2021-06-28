import React, { ReactElement } from "react";
import { useState } from "react";
import "./TransformerViews.css";
import ErrorDisplay from "./Error";
import { SavedTransformer } from "./transformer-components/types";
import { TransformerRenderer } from "./transformer-components/TransformerRenderer";

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

  return (
    <div className="Transformer">
      <h2>
        {urlTransformer.name}
        <span id="transformerBase"> ({urlTransformer.content.base})</span>
      </h2>
      {urlTransformer.description && <p>{urlTransformer.description}</p>}
      <TransformerRenderer
        setErrMsg={setErrMsg}
        errorDisplay={<ErrorDisplay message={errMsg} />}
        transformer={urlTransformer}
      />
    </div>
  );
}

export default SavedTransformerView;
