import React, { ReactElement } from "react";
import {
  RunningDifference,
  RunningMax,
  RunningMean,
  RunningMin,
  RunningSum,
} from "./Fold";
import { DifferenceFrom } from "./DifferenceFrom";
import { SavedTransformation } from "./types";
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
import { count } from "../transformations/count";
import { compare } from "../transformations/compare";
import { sort } from "../transformations/sort";
import { pivotLonger, pivotWider } from "../transformations/pivot";
import { join } from "../transformations/join";

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
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Count",
            },
            attributeSet1: {
              title: "Attributes to Count",
            },
          }}
          transformationFunction={count}
        />
      );
    case "Compare":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "First Table to Compare",
            },
            context2: {
              title: "Second Table to Compare",
            },
            attribute1: {
              title: "First attribute to Compare",
            },
            attribute2: {
              title: "Second attribute to Compare",
            },
            dropdown1: {
              title: "What kind of Comparison?",
              options: [
                { value: "categorical", title: "Categorical" },
                { value: "numeric", title: "Numeric" },
                { value: "structural", title: "Structural" },
              ],
              defaultValue: "Select a type",
            },
          }}
          transformationFunction={compare}
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
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to sort",
            },
            typeContract1: {
              title: "Key expression",
              inputTypes: ["Row"],
              outputTypes: ["any", "string", "number", "boolean", "boundary"],
              inputTypeDisabled: true,
            },
            expression1: { title: "" },
            dropdown1: {
              title: "Direction",
              options: [
                { value: "descending", title: "descending" },
                { value: "ascending", title: "ascending" },
              ],
              defaultValue: "Select a sort direction",
            },
          }}
          transformationFunction={sort}
        />
      );
    case "Pivot Longer":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Pivot",
            },
            attributeSet1: {
              title: "Attributes to Pivot",
            },
            textInput1: {
              title: "Names to",
            },
            textInput2: {
              title: "Values to",
            },
          }}
          transformationFunction={pivotLonger}
        />
      );
    case "Pivot Wider":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Pivot",
            },
            attribute1: {
              title: "Names From",
            },
            attribute2: {
              title: "Values From",
            },
          }}
          transformationFunction={pivotWider}
        />
      );
    case "Join":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Base Table",
            },context2: {
              title: "Joining Table",
            },
            attribute1: {
              title: "Base Attribute",
            },
            attribute2: {
              title: "Joining Attribute",
            },
          }}
          transformationFunction={join}
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
