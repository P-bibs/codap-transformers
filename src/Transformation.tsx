/* eslint use-isnan: 0 */
import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformation.css";
import CodapFlowErrorDisplay from "./Error";
import {
  BaseTransformations,
  SavedTransformation,
  SavedTransformationContent,
  TransformationSaveData,
} from "./transformation-components/types";
import { PolymorphicComponent } from "./transformation-components/PolymorphicComponent";
import { createDataInteractive } from "./utils/codapPhone";

/**
 * Subscribing to this context allows adding new saved transformations
 */
export const SaveTransformationContext = React.createContext<
  (name: string, d: TransformationSaveData) => void
>(() => {
  // If someone tries to subscribe to this context without a valid
  // provider higher up, then throw an error.
  throw Error("No Save Transformation Provider Found");
});

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
  const transformGroups: Record<string, string[]> = {
    "Running Aggregators": [
      "Running Sum",
      "Running Mean",
      "Running Min",
      "Running Max",
      "Running Difference",
    ],
    "Structural Transformations": ["Flatten", "Group By"],
    Others: [
      "Filter",
      "Transform Column",
      "Build Column",
      "Select Attributes",
      "Count",
      "Compare",
      "Difference From",
      "Sort",
      "Pivot Longer",
      "Pivot Wider",
      "Join",
      "Eval",
      "Copy",
      "Copy Schema",
      "Combine Cases",
    ],
  };

  const transformationData: SavedTransformation[] = [
    { name: "Build Column", content: { base: "Build Column" } },
    { name: "Compare", content: { base: "Compare" } },
    { name: "Count", content: { base: "Count" } },
    { name: "Difference From", content: { base: "Difference From" } },
    { name: "Filter", content: { base: "Filter" } },
    { name: "Flatten", content: { base: "Flatten" } },
    { name: "Running Sum", content: { base: "Running Sum" } },
    { name: "Running Mean", content: { base: "Running Mean" } },
    { name: "Running Min", content: { base: "Running Min" } },
    { name: "Running Max", content: { base: "Running Max" } },
    { name: "Running Difference", content: { base: "Running Difference" } },
    { name: "Group By", content: { base: "Group By" } },
    { name: "Pivot Longer", content: { base: "Pivot Longer" } },
    { name: "Pivot Wider", content: { base: "Pivot Wider" } },
    { name: "Select Attributes", content: { base: "Select Attributes" } },
    { name: "Sort", content: { base: "Sort" } },
    { name: "Transform Column", content: { base: "Transform Column" } },
    { name: "Join", content: { base: "Join" } },
    { name: "Eval", content: { base: "Eval" } },
    { name: "Copy", content: { base: "Copy" } },
    { name: "Copy Schema", content: { base: "Copy Schema" } },
    { name: "Combine Cases", content: { base: "Combine Cases" } },
  ];

  function addTransformation(name: string, data: TransformationSaveData) {
    if (name === "") {
      return;
    }
    // Make sure transformType is non-null
    if (transformType === null) {
      return;
    }
    // Search for the base value associated with the currently selected transformation
    const base: BaseTransformations | undefined = transformationData.find(
      ({ name }) => name === transformType
    )?.content.base;
    // Make sure the previous search was successful
    if (base === undefined) {
      return;
    }
    // Create a new transformation and add it to the list
    // TODO: can we do this without casting?
    const content: SavedTransformationContent = {
      base,
      data,
    } as SavedTransformationContent;

    const savedTransformation = { name, content };
    const encoded = encodeURIComponent(JSON.stringify(savedTransformation));
    createDataInteractive(name, `http://localhost:3000?transform=${encoded}`);
  }

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value);
    setErrMsg(null);
  }

  return (
    <div className="Transformation">
      {urlTransformation ? (
        <p>
          {urlTransformation.name} ({urlTransformation.content.base})
        </p>
      ) : (
        <>
          <p>Transformation Type</p>

          <select
            onChange={typeChange}
            value={transformType || "Select a transformation"}
          >
            <option disabled value="Select a transformation">
              Select a transformation
            </option>
            {Object.keys(transformGroups).map((groupName) => (
              <optgroup label={groupName} key={groupName}>
                {transformGroups[groupName].map((transformName) => (
                  <option key={transformName} value={transformName}>
                    {transformName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </>
      )}
      <SaveTransformationContext.Provider value={addTransformation}>
        {urlTransformation ? (
          <PolymorphicComponent
            setErrMsg={setErrMsg}
            transformation={urlTransformation}
          />
        ) : (
          <PolymorphicComponent
            setErrMsg={setErrMsg}
            transformation={transformationData.find(
              ({ name }) => name === transformType
            )}
          />
        )}
      </SaveTransformationContext.Provider>
      <CodapFlowErrorDisplay message={errMsg} />
    </div>
  );
}

export default Transformation;
