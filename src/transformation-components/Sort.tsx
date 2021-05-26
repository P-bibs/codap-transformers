import React, { useCallback, ReactElement, useState } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { TransformationProps } from "./types";
import { sort } from "../transformations/sort";
import {
  TransformationSubmitButtons,
  CodapFlowTextArea,
  ContextSelector,
} from "../ui-components";
import { applyNewDataSet } from "./util";

export function Sort({ setErrMsg }: TransformationProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [keyExpression, keyExpressionChange] = useInput<
    string,
    HTMLTextAreaElement
  >("", () => setErrMsg(null));

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }

      if (keyExpression === "") {
        setErrMsg("Key expression cannot be empty.");
        return;
      }

      const dataset = await getDataSet(inputDataCtxt);

      try {
        const result = sort(dataset, keyExpression);
        await applyNewDataSet(
          result,
          `Sort of ${inputDataCtxt}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, setErrMsg, keyExpression, lastContextName]
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
      <p>Table to sort</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Key expression</p>
      <CodapFlowTextArea value={keyExpression} onChange={keyExpressionChange} />
      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
    </>
  );
}
