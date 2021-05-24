import React, { useEffect, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithDataSet,
  getDataContext,
  getDataSet,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { selectAttributes } from "../transformations/selectAttributes";
import {
  CodapFlowSelect,
  TransformationSubmitButtons,
  CodapFlowTextArea,
} from "../ui-components";

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
  const dataContexts = useDataContexts();

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }

    const dataset = await getDataSet(inputDataCtxt);

    // extract attribute names from user's text
    const attributeNames = attributes.split("\n").map((s) => s.trim());

    try {
      const selected = selectAttributes(dataset, attributeNames);
      await createTableWithDataSet(selected);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, attributes, setErrMsg]);

  useEffect(() => {
    if (inputDataCtxt !== null) {
      addContextUpdateListener(inputDataCtxt, transform);
      return () => removeContextUpdateListener(inputDataCtxt);
    }
  }, [transform, inputDataCtxt]);

  return (
    <>
      <p>Table to Select Attributes From</p>
      <CodapFlowSelect
        onChange={inputChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: dataContext.title,
        }))}
        value={inputDataCtxt}
        defaultValue="Select a Data Context"
      />

      <p>Attributes to Include in Output (1 per line)</p>
      <CodapFlowTextArea onChange={attributesChange} value={attributes} />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform()}
        onUpdate={() => transform()}
        updateDisabled={true}
      />
    </>
  );
}
