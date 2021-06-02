import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
  useAttributes,
} from "../utils/hooks";
import { filter } from "../transformations/filter";
import {
  TransformationSubmitButtons,
  ContextSelector,
  ExpressionEditor,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import { CodapEvalError } from "../utils/codapPhone/error";

interface FilterProps {
  setErrMsg: (s: string | null) => void;
}

export function Filter({ setErrMsg }: FilterProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [predicate, predicateChange] = useState<string>("");
  const [lastContextName, setLastContextName] = useState<string | null>(null);
  const attributes = useAttributes(inputDataCtxt);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }

      console.log(`Data context to filter: ${inputDataCtxt}`);
      console.log(`Filter predicate to apply:\n${predicate}`);

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const filtered = await filter(dataset, predicate);
        await applyNewDataSet(
          filtered,
          `Filter of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        if (e instanceof CodapEvalError) {
          setErrMsg(e.error);
        } else {
          setErrMsg(e.toString());
        }
      }
    },
    [inputDataCtxt, predicate, lastContextName, setErrMsg]
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
      <p>Table to Filter</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>How to Filter</p>
      <ExpressionEditor
        onChange={predicateChange}
        attributeNames={attributes.map((a) => a.name)}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
    </>
  );
}
