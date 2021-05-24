import React, { useCallback, ReactElement, useState } from "react";
import { getDataSet } from "../utils/codapPhone";
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
import { applyNewDataSet } from "./util";

interface FoldProps extends TransformationProps {
  label: string;
  foldFunc: (
    dataset: DataSet,
    inputName: string,
    outputName: string
  ) => DataSet;
}

export function Fold({ setErrMsg, label, foldFunc }: FoldProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [inputColumnName, inputColumnNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));

  const [resultColumnName, resultColumnNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));

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

      const dataset = await getDataSet(inputDataCtxt);

      try {
        const result = foldFunc(dataset, inputColumnName, resultColumnName);
        await applyNewDataSet(
          result,
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
      <p>Table to calculate {label} on</p>
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
      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
    </>
  );
}
