import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { TransformationProps } from "./types";
import { DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ContextSelector,
  AttributeSelector,
} from "../ui-components";
import {
  applyNewDataSet,
  readableName,
  parenthesizeName,
  addUpdateListener,
} from "./util";
import {
  difference,
  runningMax,
  runningMean,
  runningMin,
  runningSum,
} from "../transformations/fold";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { uniqueName } from "../utils/names";

export interface FoldSaveData {
  inputAttributeName: string | null;
}

interface FoldProps extends TransformationProps {
  label: string;
  foldFunc: (
    dataset: DataSet,
    inputName: string,
    outputName: string,
    outputDescription: string
  ) => DataSet;
  saveData?: FoldSaveData;
}

// This is props type for components which are constructed with an
// underlying `Fold` component. Examples include Running Sum and Running Mean
type FoldConsumerProps = Omit<FoldProps, "foldFunc" | "label">;

export const RunningSum = (props: FoldConsumerProps): ReactElement => {
  // Use spread syntax to merge passed in props with fixed props
  return (
    <Fold
      {...{
        ...props,
        label: "Running Sum",
        foldFunc: runningSum,
      }}
    />
  );
};
export const RunningMean = (props: FoldConsumerProps): ReactElement => {
  return (
    <Fold
      {...{
        ...props,
        label: "Running Mean",
        foldFunc: runningMean,
      }}
    />
  );
};
export const RunningMin = (props: FoldConsumerProps): ReactElement => {
  return (
    <Fold
      {...{
        ...props,
        label: "Running Min",
        foldFunc: runningMin,
      }}
    />
  );
};
export const RunningMax = (props: FoldConsumerProps): ReactElement => {
  return (
    <Fold
      {...{
        ...props,
        label: "Running Max",
        foldFunc: runningMax,
      }}
    />
  );
};
export const RunningDifference = (props: FoldConsumerProps): ReactElement => {
  return (
    <Fold
      {...{
        ...props,
        label: "Running Difference",
        foldFunc: difference,
      }}
    />
  );
};

export function Fold({
  setErrMsg,
  label,
  foldFunc,
  saveData,
  errorDisplay,
}: FoldProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [inputAttributeName, inputAttributeNameChange] = useState<
    string | null
  >(saveData !== undefined ? saveData.inputAttributeName : "");

  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }
    if (inputAttributeName === null) {
      setErrMsg("Please select an attribute to aggregate");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const attrs = dataset.collections.map((coll) => coll.attrs || []).flat();
      const resultAttributeName = uniqueName(
        `${label} of ${parenthesizeName(
          inputAttributeName
        )} from ${readableName(context)}`,
        attrs.map((attr) => attr.name)
      );
      const resultDescription = `A ${label.toLowerCase()} of the values from the ${inputAttributeName} attribute in the ${readableName(
        context
      )} table.`;
      const result = foldFunc(
        dataset,
        inputAttributeName,
        resultAttributeName,
        resultDescription
      );
      return [result, `${label} of ${readableName(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, inputAttributeName, setErrMsg, foldFunc, label]);

  return (
    <>
      <h3>Table to calculate {label.toLowerCase()} on</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Attribute to Aggregate</h3>
      <AttributeSelector
        onChange={inputAttributeNameChange}
        value={inputAttributeName}
        context={inputDataCtxt}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            inputAttributeName,
          })}
        />
      )}
    </>
  );
}
