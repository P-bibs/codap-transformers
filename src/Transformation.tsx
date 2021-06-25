import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformation.css";
import CodapFlowErrorDisplay from "./Error";
import { SavedTransformation } from "./transformation-components/types";
import { TransformationRenderer } from "./transformation-components/TransformationRenderer";
import transformationList, {
  BaseTransformationName,
  TransformationGroup,
} from "./transformation-components/transformationList";

// These are the base transformation types represented as SavedTransformation
// objects
const baseTransformations: SavedTransformation[] = Object.keys(
  transformationList
).map((transform) => ({
  name: transform,
  content: { base: transform as BaseTransformationName },
}));

// Take the grouping data from transformationList and reorganize it into a form
// thats easier to make a dropdown UI out of
const transformationGroups: [TransformationGroup, string[]][] = (function () {
  let groupNames = Object.entries(transformationList).map(
    ([, data]) => data.group
  );
  // deduplicate group names
  groupNames = [...new Set(groupNames)];

  return groupNames.map((groupName: TransformationGroup): [
    TransformationGroup,
    string[]
  ] => {
    // for each group name, filter to find all the transformations of that
    // type and then map to get just the transformation name
    const transformationsMatchingGroup = Object.entries(transformationList)
      .filter(([, data]) => data.group === groupName)
      .map(([transform]) => transform);
    return [groupName, transformationsMatchingGroup];
  });
})();

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation({
  transformation: urlTransformation,
}: {
  transformation?: SavedTransformation;
}): ReactElement {
  const [transformType, setTransformType] = useState<string | null>(null);

  const [errMsg, setErrMsg] = useState<string | null>(null);

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value);
    setErrMsg(null);
  }

  if (urlTransformation) {
    return (
      <div className="Transformation">
        <h2>
          {urlTransformation.name}
          <span id="transformationBase">
            {" "}
            ({urlTransformation.content.base})
          </span>
        </h2>
        {urlTransformation.description && (
          <p>{urlTransformation.description}</p>
        )}
        <TransformationRenderer
          setErrMsg={setErrMsg}
          errorDisplay={<CodapFlowErrorDisplay message={errMsg} />}
          transformation={urlTransformation}
        />
      </div>
    );
  } else {
    return (
      <div className="Transformation">
        <h3>Transformation Type</h3>

        <select
          onChange={typeChange}
          value={transformType || "Select a transformation"}
        >
          <option disabled value="Select a transformation">
            Select a transformation
          </option>
          {transformationGroups.map(([groupName, transformations]) => (
            <optgroup label={groupName} key={groupName}>
              {transformations.map((transformName) => (
                <option key={transformName} value={transformName}>
                  {transformName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <TransformationRenderer
          setErrMsg={setErrMsg}
          errorDisplay={<CodapFlowErrorDisplay message={errMsg} />}
          transformation={baseTransformations.find(
            ({ name }) => name === transformType
          )}
        />
      </div>
    );
  }
}

export default Transformation;
