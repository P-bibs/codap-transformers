import React, { ReactElement } from "react";
import { BuildColumn } from "./BuildColumn";
import { RunningSum } from "./Fold";
import { useState } from "react";
import "./Transformation.css";
import CodapFlowErrorDisplay from "../Error";
import { Filter, FilterSaveData } from "./Filter";
import { TransformColumn } from "./TransformColumn";
import { BuildColumnSaveData } from "./BuildColumn";
import { GroupBy } from "./GroupBy";
import { SelectAttributes } from "./SelectAttributes";
import { Count } from "./Count";
import { Flatten } from "./Flatten";
import { Compare } from "./Compare";
import { Fold, FoldSaveData } from "./Fold";
import { DifferenceFrom } from "./DifferenceFrom";
import { Sort } from "./Sort";
import {
  runningSum,
  runningMean,
  runningMin,
  runningMax,
  difference,
} from "../transformations/fold";
import { PivotLonger } from "./PivotLonger";
import { PivotWider } from "./PivotWider";
import {
  BaseTransformations,
  SavedTransformation,
  SavedTransformationContent,
  TransformationComponent,
  TransformationProps,
  TransformationSaveData,
} from "./types";

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
        <Fold
          setErrMsg={setErrMsg}
          label="running sum"
          foldFunc={runningSum}
          saveData={transformation.content.base}
        />
      );
    case "Running Mean":
      return (
        <Fold
          setErrMsg={setErrMsg}
          label="running mean"
          foldFunc={runningMean}
          saveData={transformation.content.base}
        />
      );
    case "Running Min":
      return (
        <Fold
          setErrMsg={setErrMsg}
          label="running min"
          foldFunc={runningMin}
          saveData={transformation.content.base}
        />
      );
    case "Running Max":
      return (
        <Fold
          setErrMsg={setErrMsg}
          label="running max"
          foldFunc={runningMax}
          saveData={transformation.content.base}
        />
      );
    case "Running Difference":
      return (
        <Fold
          setErrMsg={setErrMsg}
          label="difference"
          foldFunc={difference}
          saveData={transformation.content.base}
        />
      );
    case "Flatten":
      return (
        <Flatten setErrMsg={setErrMsg} saveData={transformation.content.base} />
      );
    case "Group By":
      return (
        <GroupBy setErrMsg={setErrMsg} saveData={transformation.content.base} />
      );
    case "Filter":
      return (
        <Filter setErrMsg={setErrMsg} saveData={transformation.content.base} />
      );
    case "Transform Column":
      return (
        <TransformColumn
          setErrMsg={setErrMsg}
          saveData={transformation.content.base}
        />
      );
    case "Build Column":
      return (
        <BuildColumn
          setErrMsg={setErrMsg}
          saveData={transformation.content.base}
        />
      );
    case "Select Attributes":
      return (
        <SelectAttributes
          setErrMsg={setErrMsg}
          saveData={transformation.content.base}
        />
      );
    case "Count":
      return (
        <Count setErrMsg={setErrMsg} saveData={transformation.content.base} />
      );
    case "Compare":
      return (
        <Compare setErrMsg={setErrMsg} saveData={transformation.content.base} />
      );
    case "Difference From":
      return (
        <DifferenceFrom
          setErrMsg={setErrMsg}
          saveData={transformation.content.base}
        />
      );
    case "Sort":
      return (
        <Sort setErrMsg={setErrMsg} saveData={transformation.content.base} />
      );
    case "Pivot Longer":
      return (
        <PivotLonger
          setErrMsg={setErrMsg}
          saveData={transformation.content.base}
        />
      );
    case "Pivot Wider":
      return (
        <PivotWider
          setErrMsg={setErrMsg}
          saveData={transformation.content.base}
        />
      );
  }
};
