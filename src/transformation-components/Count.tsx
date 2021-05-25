import React, { useCallback, ReactElement, useState } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { count } from "../transformations/count";
import {
  TransformationSubmitButtons,
  ContextSelector,
  AttributeSelector,
} from "../ui-components";
import { applyNewDataSet } from "./util";

interface CountProps {
  setErrMsg: (s: string | null) => void;
}

export function Count({ setErrMsg }: CountProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributeName, attributeNameChange] = useInput<
    string,
    HTMLSelectElement
  >("", () => setErrMsg(null));

  const [lastContextName, setLastContextName] = useState<null | string>(null);

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

      const dataset = await getDataSet(inputDataCtxt);

      try {
        const counted = count(dataset, attributeName);
        await applyNewDataSet(
          counted,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, attributeName, setErrMsg, lastContextName]
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
      <p>Table to Count</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Attribute to Count</p>
      <AttributeSelector
        context={inputDataCtxt}
        value={attributeName}
        onChange={attributeNameChange}
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
