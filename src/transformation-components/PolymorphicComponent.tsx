import React, { ReactElement } from "react";
import { SavedTransformation } from "./types";
import DDTransformation from "./DataDrivenTransformation";
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
import { copy } from "../transformations/copy";
import { copySchema } from "../transformations/copySchema";
import { combineCases } from "../transformations/combineCases";
import {
  difference,
  differenceFrom,
  genericFold,
  runningMax,
  runningMean,
  runningMin,
  runningSum,
} from "../transformations/fold";
import { dotProduct } from "../transformations/dotProduct";
import { average } from "../transformations/average";
import { partitionOverride } from "../transformations/partition";

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
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to calculate running sum on",
            },
            attribute1: {
              title: "Attribute to Aggregate",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: runningSum }}
        />
      );
    case "Running Mean":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to calculate running mean on",
            },
            attribute1: {
              title: "Attribute to Aggregate",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: runningMean }}
        />
      );
    case "Running Min":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to calculate running min on",
            },
            attribute1: {
              title: "Attribute to Aggregate",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: runningMin }}
        />
      );
    case "Running Max":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to calculate running max on",
            },
            attribute1: {
              title: "Attribute to Aggregate",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: runningMax }}
        />
      );
    case "Running Difference":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to calculate running difference on",
            },
            attribute1: {
              title: "Attribute to Aggregate",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: difference }}
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
          transformationFunction={{ kind: "datasetCreator", func: flatten }}
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
          transformationFunction={{ kind: "datasetCreator", func: groupBy }}
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
          transformationFunction={{ kind: "datasetCreator", func: filter }}
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
          transformationFunction={{ kind: "datasetCreator", func: buildColumn }}
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
          transformationFunction={{ kind: "datasetCreator", func: buildColumn }}
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
          transformationFunction={{
            kind: "datasetCreator",
            func: selectAttributes,
          }}
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
          transformationFunction={{ kind: "datasetCreator", func: count }}
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
          transformationFunction={{ kind: "datasetCreator", func: compare }}
        />
      );
    case "Difference From":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to calculate difference on",
            },
            attribute1: {
              title: "Attribute to take difference from",
            },
            textInput1: {
              title: "Result Attribute Name",
            },
            textInput2: {
              title: "Starting value for difference",
            },
          }}
          transformationFunction={{
            kind: "datasetCreator",
            func: differenceFrom,
          }}
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
          transformationFunction={{ kind: "datasetCreator", func: sort }}
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
          transformationFunction={{ kind: "datasetCreator", func: pivotLonger }}
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
          transformationFunction={{ kind: "datasetCreator", func: pivotWider }}
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
            },
            context2: {
              title: "Joining Table",
            },
            attribute1: {
              title: "Base Attribute",
            },
            attribute2: {
              title: "Joining Attribute",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: join }}
        />
      );
    case "Copy":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Copy",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: copy }}
        />
      );
    case "Dot Product":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Take Dot Product of",
            },
            attributeSet1: {
              title: "Attributes to Take Dot Product of",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: dotProduct }}
        />
      );
    case "Copy Schema":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Copy",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: copySchema }}
        />
      );
    case "Average":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Take Average of",
            },
            attribute1: {
              title: "Attribute to Average",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: average }}
        />
      );
    case "Combine Cases":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Base Table",
            },
            context2: {
              title: "Combining Table",
            },
          }}
          transformationFunction={{
            kind: "datasetCreator",
            func: combineCases,
          }}
        />
      );
    case "Reduce":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to reduce",
            },
            textInput1: {
              title: "Result Attribute Name",
            },
            expression1: {
              title: "Starting Value",
            },
            textInput2: {
              title: "Accumulator Name",
            },
            expression2: {
              title: "Formula for Next Accumulator",
            },
          }}
          transformationFunction={{ kind: "datasetCreator", func: genericFold }}
        />
      );
    case "Partition":
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={{
            context1: {
              title: "Table to Partition",
            },
            attribute1: {
              title: "Attribute to Partition By",
            },
          }}
          transformationFunction={{
            kind: "fullOverride",
            func: partitionOverride,
          }}
        />
      );
  }
};
