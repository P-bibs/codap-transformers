import React, { ReactElement } from "react";
import {
  RunningDifference,
  RunningMax,
  RunningMean,
  RunningMin,
  RunningSum,
} from "./Fold";
// import { Filter } from "./Filter";
import { Count } from "./Count";
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
import { Partition } from "./Partition";
import DDTransformation from "./DDTransformation";
import { filter } from "../transformations/filter";
import { buildColumn } from "../transformations/buildColumn";
import { flatten } from "../transformations/flatten";
import { groupBy } from "../transformations/groupBy";
import { selectAttributes } from "../transformations/selectAttributes";

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
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Flatten",
            },
          }}
          transformationFunction={flatten}
        />
      );
    case "Group By":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Group",
            },
            attributeSet1: {
              title: "Attributes to Group By",
            },
          }}
          transformationFunction={groupBy}
        />
      );
    case "Filter":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Filter",
            },
            typeContract1: {
              title: "How to Filter",
              inputTypes: ["Row"],
              outputTypes: ["boolean"],
              inputTypeDisabled: true,
              outputTypeDisabled: true,
            },
            expression1: { title: "" },
          }}
          transformationFunction={filter}
        />
      );
    case "Transform Column":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Transform Column Of",
            },
            attribute1: {
              title: "Attribute to Transform",
            },
            typeContract1: {
              title: "Formula for Transformed Values",
              inputTypes: ["Row"],
              outputTypes: ["any", "string", "number", "boolean", "boundary"],
              inputTypeDisabled: true,
            },
            expression1: { title: "" },
          }}
          transformationFunction={buildColumn}
        />
      );
    case "Build Column":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Add Attribute To",
            },
            textInput1: {
              title: "Name of New Attribute",
            },
            collection1: {
              title: "Collection to Add To",
            },
            typeContract1: {
              title: "Formula for Attribute Values",
              inputTypes: ["Row"],
              outputTypes: ["any", "string", "number", "boolean", "boundary"],
              inputTypeDisabled: true,
            },
            expression1: { title: "" },
          }}
          transformationFunction={buildColumn}
        />
      );
    case "Select Attributes":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Select Attributes From",
            },
            textInput1: {
              title: "Name of New Attribute",
            },
            dropdown1: {
              title: "Mode",
              options: [
                {
                  value: "selectOnly",
                  title: "Select only the following attributes",
                },
                {
                  value: "selectAllBut",
                  title: "Select all but the following attributes",
                },
              ],
              defaultValue: "Mode",
            },
            attributeSet1: {
              title: "Attributes",
            },
          }}
          transformationFunction={selectAttributes}
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
    case "Partition":
      return (
        <Partition
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
          errorDisplay={errorDisplay}
        />
      );
  }
};
