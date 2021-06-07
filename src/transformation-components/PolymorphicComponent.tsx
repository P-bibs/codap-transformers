import React, { ReactElement } from "react";
import { BuildColumn } from "./BuildColumn";
import {
  RunningDifference,
  RunningMax,
  RunningMean,
  RunningMin,
  RunningSum,
} from "./Fold";
import { Filter } from "./Filter";
import { TransformColumn } from "./TransformColumn";
import { GroupBy } from "./GroupBy";
import { SelectAttributes } from "./SelectAttributes";
import { Count } from "./Count";
import { Flatten } from "./Flatten";
import { Compare } from "./Compare";
import { DifferenceFrom } from "./DifferenceFrom";
import { Sort } from "./Sort";
import { PivotLonger } from "./PivotLonger";
import { PivotWider } from "./PivotWider";
import { SavedTransformation } from "./types";
import { Join } from "./Join";
import { Eval } from "./Eval";
import { Copy } from "./Copy";
import { CombineCases } from "./CombineCases";

interface PolymorphicComponentProps {
  transformation?: SavedTransformation;
  setErrMsg: (s: string | null) => void;
}

/**
 * A component which takes in data about a saved transformation and renders it properly
 */
export const PolymorphicComponent = ({
  transformation,
  setErrMsg,
}: PolymorphicComponentProps): ReactElement => {
  if (transformation === undefined) {
    return <></>;
  }

  switch (transformation.content.base) {
    case "Running Sum":
      return (
        <RunningSum
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Running Mean":
      return (
        <RunningMean
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Running Min":
      return (
        <RunningMin
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Running Max":
      return (
        <RunningMax
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Running Difference":
      return (
        <RunningDifference
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Flatten":
      return (
        <Flatten setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Group By":
      return (
        <GroupBy setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Filter":
      return (
        <Filter setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Transform Column":
      return (
        <TransformColumn
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Build Column":
      return (
        <BuildColumn
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Select Attributes":
      return (
        <SelectAttributes
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Count":
      return (
        <Count setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Compare":
      return (
        <Compare setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Difference From":
      return (
        <DifferenceFrom
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Sort":
      return (
        <Sort setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Pivot Longer":
      return (
        <PivotLonger
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Pivot Wider":
      return (
        <PivotWider
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Join":
      return (
        <Join setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Eval":
      return (
        <Eval setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Copy":
      return (
        <Copy setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Combine Cases":
      return (
        <CombineCases
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
  }
};
