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
  CodapFlowTextArea,
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
  const [attributes, attributesChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );

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
      const attributeNames = attributes.split("\n").map((s) => s.trim());

      if (attributeNames.length === 0) {
        setErrMsg("Please choose at least one attribute to count");
        return;
      }

      try {
        const counted = count(dataset, attributeNames);
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
    [inputDataCtxt, attributes, setErrMsg, lastContextName]
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

      <p>Attributes to Count (1 per line)</p>
      <CodapFlowTextArea value={attributes} onChange={attributesChange} />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
    </>
  );
}
