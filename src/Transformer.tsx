import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformer.css";
import CodapFlowErrorDisplay from "./Error";
import { SavedTransformer } from "./transformer-components/types";
import { TransformerRenderer } from "./transformer-components/TransformerRenderer";
import transformerList, {
  BaseTransformerName,
  TransformerGroup,
} from "./transformer-components/transformerList";

// These are the base transformer types represented as SavedTransformer
// objects
const baseTransformers: SavedTransformer[] = Object.keys(
  transformerList
).map((transform) => ({
  name: transform,
  content: { base: transform as BaseTransformerName },
}));

// Take the grouping data from transformerList and reorganize it into a form
// thats easier to make a dropdown UI out of
const transformerGroups: [TransformerGroup, string[]][] = (function () {
  let groupNames = Object.entries(transformerList).map(
    ([, data]) => data.group
  );
  // deduplicate group names
  groupNames = [...new Set(groupNames)];

  return groupNames.map((groupName: TransformerGroup): [
    TransformerGroup,
    string[]
  ] => {
    // for each group name, filter to find all the transformers of that
    // type and then map to get just the transformer name
    const transformersMatchingGroup = Object.entries(transformerList)
      .filter(([, data]) => data.group === groupName)
      .map(([transform]) => transform);
    return [groupName, transformersMatchingGroup];
  });
})();

/**
 * Transformer represents an instance of the plugin, which applies a
 * user-defined transformer to input data from CODAP to yield output data.
 */
function Transformer({
  transformer: urlTransformer,
}: {
  transformer?: SavedTransformer;
}): ReactElement {
  const [transformType, setTransformType] = useState<string | null>(null);

  const [errMsg, setErrMsg] = useState<string | null>(null);

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value);
    setErrMsg(null);
  }

  if (urlTransformer) {
    return (
      <div className="Transformer">
        <h2>
          {urlTransformer.name}
          <span id="transformerBase">
            {" "}
            ({urlTransformer.content.base})
          </span>
        </h2>
        {urlTransformer.description && (
          <p>{urlTransformer.description}</p>
        )}
        <TransformerRenderer
          setErrMsg={setErrMsg}
          errorDisplay={<CodapFlowErrorDisplay message={errMsg} />}
          transformer={urlTransformer}
        />
      </div>
    );
  } else {
    return (
      <div className="Transformer">
        <h3>Transformer Type</h3>

        <select
          onChange={typeChange}
          value={transformType || "Select a transformer"}
        >
          <option disabled value="Select a transformer">
            Select a transformer
          </option>
          {transformerGroups.map(([groupName, transformers]) => (
            <optgroup label={groupName} key={groupName}>
              {transformers.map((transformName) => (
                <option key={transformName} value={transformName}>
                  {transformName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <TransformerRenderer
          setErrMsg={setErrMsg}
          errorDisplay={<CodapFlowErrorDisplay message={errMsg} />}
          transformer={baseTransformers.find(
            ({ name }) => name === transformType
          )}
        />
      </div>
    );
  }
}

export default Transformer;
