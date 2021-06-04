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
  AttributeSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface DifferenceFromSaveData {
  inputAttributeName: string;
  resultAttributeName: string;
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

  const [inputAttributeName, inputAttributeNameChange] = useState<
    string | null
  >(saveData !== undefined ? saveData.inputAttributeName : "");

  const [resultAttributeName, resultAttributeNameChange] = useInput<
    string,
    HTMLInputElement
  >(saveData !== undefined ? saveData.resultAttributeName : "", () =>
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
      if (inputAttributeName === null) {
        setErrMsg("Please choose an attribute to take the difference from");
        return;
      }
      if (resultAttributeName === "") {
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
          inputAttributeName,
          resultAttributeName,
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
      inputAttributeName,
      resultAttributeName,
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
      <p>Attribute to take difference from</p>
      <AttributeSelector
        onChange={inputAttributeNameChange}
        value={inputAttributeName}
        context={inputDataCtxt}
      />
      <p>Result Attribute Name</p>
      <CodapFlowTextInput
        value={resultAttributeName}
        onChange={resultAttributeNameChange}
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
            inputAttributeName,
            resultAttributeName,
            startingValue,
          })}
        />
      )}
    </>
  );
}
