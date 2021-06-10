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
import { Copy } from "./Copy";
import { DotProduct } from "./DotProduct";
import { Average } from "./Average";
import { CopySchema } from "./CopySchema";
import { CombineCases } from "./CombineCases";
import { GenericFold } from "./GenericFold";

interface PolymorphicComponentProps {
  transformation?: SavedTransformation;
  setErrMsg: (s: string | null) => void;
  errorDisplay: ReactElement;
}

/**
 * A component which takes in data about a saved transformation and renders it properly
 */
export const PolymorphicComponent = ({
  transformation,
  setErrMsg,
  errorDisplay,
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
          errorDisplay={errorDisplay}
        />
      );
    case "Running Mean":
      return (
        <RunningMean
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Running Min":
      return (
        <RunningMin
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Running Max":
      return (
        <RunningMax
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Running Difference":
      return (
        <RunningDifference
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Flatten":
      return (
        <Flatten
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Group By":
      return (
        <GroupBy
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Filter":
      return (
        <Filter
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Transform Column":
      return (
        <TransformColumn
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Build Column":
      return (
        <BuildColumn
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Select Attributes":
      return (
        <SelectAttributes
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Count":
      return (
        <Count
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Compare":
      return (
        <Compare
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Difference From":
      return (
        <DifferenceFrom
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Sort":
      return (
        <Sort
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Pivot Longer":
      return (
        <PivotLonger
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Pivot Wider":
      return (
        <PivotWider
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Join":
      return (
        <Join
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Copy":
      return (
        <Copy
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Dot Product":
      return (
        <DotProduct
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Copy Schema":
      return (
        <CopySchema
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Average":
      return (
        <Average
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Combine Cases":
      return (
        <CombineCases
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
    case "Reduce":
      return (
        <GenericFold
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
  }
};
