import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { selectAttributes } from "../transformations/selectAttributes";
import { DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ContextSelector,
  MultiAttributeSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";

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
  const [attributes, setAttributes] = useState<string[]>([]);
  const [mode, modeChange] = useInput<string | null, HTMLSelectElement>(
    "selectOnly",
    () => setErrMsg(null)
  );

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }

    // select all but the given attributes?
    const allBut = mode === "selectAllBut";

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const selected = selectAttributes(dataset, attributes, allBut);
      return [selected, `Select Attributes of ${ctxtTitle(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, attributes, mode, setErrMsg]);

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

      <p>Attributes</p>
      <MultiAttributeSelector
        context={inputDataCtxt}
        selected={attributes}
        onChange={setAttributes}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
