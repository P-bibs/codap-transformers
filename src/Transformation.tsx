/* eslint use-isnan: 0 */
import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformation.css";
import CodapFlowErrorDisplay from "./Error";
import { Filter, FilterSaveData } from "./transformation-components/Filter";
import { TransformColumn } from "./transformation-components/TransformColumn";
import {
  BuildColumn,
  BuildColumnSaveData,
} from "./transformation-components/BuildColumn";
import { GroupBy } from "./transformation-components/GroupBy";
import { SelectAttributes } from "./transformation-components/SelectAttributes";
import { Count } from "./transformation-components/Count";
import { Flatten } from "./transformation-components/Flatten";
import { Compare } from "./transformation-components/Compare";
import {
  Fold,
  FoldSaveData,
  RunningSum,
} from "./transformation-components/Fold";
import { DifferenceFrom } from "./transformation-components/DifferenceFrom";
import { Sort } from "./transformation-components/Sort";
import {
  runningSum,
  runningMean,
  runningMin,
  runningMax,
  difference,
} from "./transformations/fold";
import { PivotLonger } from "./transformation-components/PivotLonger";
import { PivotWider } from "./transformation-components/PivotWider";
import {
  BaseTransformations,
  SavedTransformation,
  SavedTransformationContent,
  TransformationComponent,
  TransformationProps,
  TransformationSaveData,
} from "./transformation-components/types";
import { PolymorphicComponent } from "./transformation-components/PolymorphicComponent";

/**
 * Subscribing to this context allows adding new saved transformations
 */
export const SaveTransformationContext = React.createContext<
  (name: string, d: TransformationSaveData) => void
>((name, d) => {
  // If someone tries to subscribe to this context without a valid
  // provider higher up, then throw an error.
  throw Error("No Save Transformation Provider Found");
});

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation(): ReactElement {
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [transformType, setTransformType] = useState<string | null>(null);
  const [savedTransformations, setSavedTransformations] = useState<
    SavedTransformation[]
  >([]);

  /**
   * The broad categories of transformations that can be applied
   * to tables.
   */
  const transformComponents: Record<string, TransformationComponent> = {
    // "Running Sum": (
    //   <Fold setErrMsg={setErrMsg} label="running sum" foldFunc={runningSum} />
    // ),
    // "Running Mean": (
    //   <Fold setErrMsg={setErrMsg} label="running mean" foldFunc={runningMean} />
    // ),
    // "Running Min": (
    //   <Fold setErrMsg={setErrMsg} label="running min" foldFunc={runningMin} />
    // ),
    // "Running Max": (
    //   <Fold setErrMsg={setErrMsg} label="running max" foldFunc={runningMax} />
    // ),
    // "Running Difference": (
    //   <Fold setErrMsg={setErrMsg} label="difference" foldFunc={difference} />
    // ),
    // Flatten: <Flatten setErrMsg={setErrMsg} />,
    // "Group By": <GroupBy setErrMsg={setErrMsg} />,
    // Filter: <Filter setErrMsg={setErrMsg} />,
    // "Transform Column": <TransformColumn setErrMsg={setErrMsg} />,
    // "Build Column": <BuildColumn setErrMsg={setErrMsg} />,
    // "Select Attributes": <SelectAttributes setErrMsg={setErrMsg} />,
    // Count: <Count setErrMsg={setErrMsg} />,
    // Compare: <Compare setErrMsg={setErrMsg} />,
    // "Difference From": <DifferenceFrom setErrMsg={setErrMsg} />,
    // Sort: <Sort setErrMsg={setErrMsg} />,
    // "Pivot Longer": <PivotLonger setErrMsg={setErrMsg} />,
    // "Pivot Wider": <PivotWider setErrMsg={setErrMsg} />,
  };

  const transformGroups: Record<string, string[]> = {
    // "Running Aggregators": [
    //   "Running Sum",
    //   "Running Mean",
    //   "Running Min",
    //   "Running Max",
    //   "Running Difference",
    // ],
    // "Structural Transformations": ["Flatten", "Group By"],
    // Others: [
    //   "Filter",
    //   "Transform Column",
    //   "Build Column",
    //   "Select Attributes",
    //   "Count",
    //   "Compare",
    //   "Difference From",
    //   "Sort",
    //   "Pivot Longer",
    //   "Pivot Wider",
    // ],
    Primitive: ["Filter", "Build Column", "Running Sum"],
    Saved: savedTransformations.map((transform) => transform.name),
  };
  const transformationData: SavedTransformation[] = [
    { name: "Filter", content: { base: "Filter" } },
    { name: "Build Column", content: { base: "Build Column" } },
    { name: "Running Sum", content: { base: "Running Sum" } },
    ...savedTransformations,
  ];

  function addTransformation(name: string, data: TransformationSaveData) {
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
    setSavedTransformations([...savedTransformations, { name, content }]);
  }

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value);
    setErrMsg(null);
  }

  return (
    <div className="Transformation">
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
      <SaveTransformationContext.Provider value={addTransformation}>
        <PolymorphicComponent
          setErrMsg={setErrMsg}
          transformation={transformationData.find(
            ({ name }) => name === transformType
          )}
        />
      </SaveTransformationContext.Provider>
      <CodapFlowErrorDisplay message={errMsg} />
    </div>
  );
}

export default Transformation;
