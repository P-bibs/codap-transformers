import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { flatten } from "../transformations/flatten";
import { TransformationSubmitButtons, ContextSelector } from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";

interface FlattenProps {
  setErrMsg: (s: string | null) => void;
}

export function Flatten({ setErrMsg }: FlattenProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  /**
   * Applies the flatten transformation to the input data context,
   * producing an output table in CODAP.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to flatten.");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const flat = flatten(dataset);
        await applyNewDataSet(
          flat,
          `Flatten of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, setErrMsg, lastContextName]
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
      <p>Table to Flatten</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
    </>
  );
}
