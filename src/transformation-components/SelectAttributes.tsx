import React, { useCallback, ReactElement, useState } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { selectAttributes } from "../transformations/selectAttributes";
import {
  TransformationSubmitButtons,
  CodapFlowTextArea,
  ContextSelector,
} from "../ui-components";
import { applyNewDataSet } from "./util";

interface SelectAttributesProps {
  setErrMsg: (s: string | null) => void;
}

export function SelectAttributes({
  setErrMsg,
}: SelectAttributesProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, attributesChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );
  const [mode, modeChange] = useInput<string | null, HTMLSelectElement>(
    "selectOnly",
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

      // extract attribute names from user's text
      const attributeNames = attributes.split("\n").map((s) => s.trim());

    // select all but the given attributes?
    const allBut = mode === "selectAllBut";

      try {
        const selected = selectAttributes(dataset, attributeNames, allBut);
        await applyNewDataSet(
          selected,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, attributes, mode, setErrMsg, lastContextName]
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
      <p>Table to Select Attributes From</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Mode</p>
      <select id="mode" onChange={modeChange}>
        <option value="selectOnly">Select only the following attributes</option>
        <option value="selectAllBut">
          Select all but the following attributes
        </option>
      </select>

      <p>Attributes (1 per line)</p>
      <CodapFlowTextArea onChange={attributesChange} value={attributes} />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
    </>
  );
}
