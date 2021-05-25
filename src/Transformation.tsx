/* eslint use-isnan: 0 */
import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformation.css";
import Error from "./Error";
import { Filter } from "./transformation-components/Filter";
import { TransformColumn } from "./transformation-components/TransformColumn";
import { BuildColumn } from "./transformation-components/BuildColumn";
import { GroupBy } from "./transformation-components/GroupBy";
import { SelectAttributes } from "./transformation-components/SelectAttributes";
import { Count } from "./transformation-components/Count";
import { Flatten } from "./transformation-components/Flatten";
import { Compare } from "./transformation-components/Compare";
import { Fold } from "./transformation-components/Fold";
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
import { CodapFlowSelect } from "./ui-components";

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation(): ReactElement {
  const [errMsg, setErrMsg] = useState<string | null>(null);

  /**
   * The broad categories of transformations that can be applied
   * to tables.
   */
  const transformComponents = {
    Filter: <Filter setErrMsg={setErrMsg} />,
    "Transform Column": <TransformColumn setErrMsg={setErrMsg} />,
    "Build Column": <BuildColumn setErrMsg={setErrMsg} />,
    "Group By": <GroupBy setErrMsg={setErrMsg} />,
    "Select Attributes": <SelectAttributes setErrMsg={setErrMsg} />,
    Count: <Count setErrMsg={setErrMsg} />,
    Flatten: <Flatten setErrMsg={setErrMsg} />,
    Compare: <Compare setErrMsg={setErrMsg} />,
    "Running Sum": (
      <Fold setErrMsg={setErrMsg} label="running sum" foldFunc={runningSum} />
    ),
    "Running Mean": (
      <Fold setErrMsg={setErrMsg} label="running mean" foldFunc={runningMean} />
    ),
    "Running Min": (
      <Fold setErrMsg={setErrMsg} label="running min" foldFunc={runningMin} />
    ),
    "Running Max": (
      <Fold setErrMsg={setErrMsg} label="running max" foldFunc={runningMax} />
    ),
    "Running Difference": (
      <Fold setErrMsg={setErrMsg} label="difference" foldFunc={difference} />
    ),
    "Difference From": <DifferenceFrom setErrMsg={setErrMsg} />,
    Sort: <Sort setErrMsg={setErrMsg} />,
    "Pivot Longer": <PivotLonger setErrMsg={setErrMsg} />,
    "Pivot Wider": <PivotWider setErrMsg={setErrMsg} />,
  };

  type TransformType = keyof typeof transformComponents;

  const [transformType, setTransformType] =
    useState<TransformType | null>(null);

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value as TransformType);
    setErrMsg(null);
  }

  return (
    <div className="Transformation">
      <p>Transformation Type</p>
      <CodapFlowSelect
        onChange={typeChange}
        options={Object.keys(transformComponents).map((type) => ({
          value: type,
          title: type,
        }))}
        value={transformType}
        defaultValue="Select a transformation"
      />

      {transformType && transformComponents[transformType]}

      <Error message={errMsg} />
    </div>
  );
}

export default Transformation;
