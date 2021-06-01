import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { TransformationProps } from "./types";
import { DataSet } from "../transformations/types";
import {
  CodapFlowTextInput,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import { runningSum } from "../transformations/fold";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface FoldSaveData {
  inputColumnName: string;
  resultColumnName: string;
}

interface FoldProps extends TransformationProps {
  label: string;
  foldFunc: (
    dataset: DataSet,
    inputName: string,
    outputName: string
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
        label: "running sum",
        foldFunc: runningSum,
      }}
    />
  );
};

export function Fold({
  setErrMsg,
  label,
  foldFunc,
  saveData,
}: FoldProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [inputColumnName, inputColumnNameChange] = useInput<
    string,
    HTMLInputElement
  >(saveData !== undefined ? saveData.inputColumnName : "", () =>
    setErrMsg(null)
  );

  const [resultColumnName, resultColumnNameChange] = useInput<
    string,
    HTMLInputElement
  >(saveData !== undefined ? saveData.resultColumnName : "", () =>
    setErrMsg(null)
  );

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }

      if (resultColumnName === "") {
        setErrMsg("Please choose a non-empty result column name.");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const result = foldFunc(dataset, inputColumnName, resultColumnName);
        await applyNewDataSet(
          result,
          `${label} of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [
      inputDataCtxt,
      inputColumnName,
      resultColumnName,
      setErrMsg,
      foldFunc,
      lastContextName,
      label,
    ]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataCtxt,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

  return (
    <>
      <p>Table to calculate {label.toLowerCase()} on</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />
      <p>Input Column Name:</p>
      <CodapFlowTextInput
        value={inputColumnName}
        onChange={inputColumnNameChange}
        disabled={saveData !== undefined}
      />
      <p>Result Column Name:</p>
      <CodapFlowTextInput
        value={resultColumnName}
        onChange={resultColumnNameChange}
        disabled={saveData !== undefined}
      />
      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            inputColumnName,
            resultColumnName,
          })}
        />
      )}
    </>
  );
}
