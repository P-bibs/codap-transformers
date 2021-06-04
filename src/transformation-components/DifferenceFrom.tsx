import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { TransformationProps } from "./types";
import { differenceFrom } from "../transformations/fold";
import {
  CodapFlowTextInput,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface DifferenceFromSaveData {
  inputColumnName: string;
  resultColumnName: string;
  startingValue: string;
}

interface DifferenceFromProps extends TransformationProps {
  saveData?: DifferenceFromSaveData;
}

export function DifferenceFrom({
  setErrMsg,
  saveData,
}: DifferenceFromProps): ReactElement {
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

  const [startingValue, startingValueChange] = useInput<
    string,
    HTMLInputElement
  >(saveData !== undefined ? saveData.startingValue : "0", () =>
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

      const differenceStartingValue = Number(startingValue);
      if (isNaN(differenceStartingValue)) {
        setErrMsg(
          `Expected numeric starting value, instead got ${startingValue}`
        );
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const result = differenceFrom(
          dataset,
          inputColumnName,
          resultColumnName,
          differenceStartingValue
        );
        await applyNewDataSet(
          result,
          `Difference From of ${ctxtTitle(context)}`,
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
      startingValue,
      lastContextName,
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
      <p>Table to calculate difference on</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />
      <p>Input Column Name:</p>
      <CodapFlowTextInput
        value={inputColumnName}
        onChange={inputColumnNameChange}
      />
      <p>Result Column Name:</p>
      <CodapFlowTextInput
        value={resultColumnName}
        onChange={resultColumnNameChange}
      />
      <p>Starting value for difference</p>
      <CodapFlowTextInput
        value={startingValue}
        onChange={startingValueChange}
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
            startingValue,
          })}
        />
      )}
    </>
  );
}
