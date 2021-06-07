import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { selectAttributes } from "../transformations/selectAttributes";
import { DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ContextSelector,
  MultiAttributeSelector,
  CodapFlowSelect,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface SelectAttributesSaveData {
  attributes: string[];
  mode: string;
}

interface SelectAttributesProps extends TransformationProps {
  saveData?: SelectAttributesSaveData;
}

export function SelectAttributes({
  setErrMsg,
  saveData,
}: SelectAttributesProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, setAttributes] = useState<string[]>(
    saveData !== undefined ? saveData.attributes : []
  );
  const [mode, modeChange] = useInput<string | null, HTMLSelectElement>(
    saveData !== undefined ? saveData.mode : "selectOnly",
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
      <h3>Table to Select Attributes From</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Mode</h3>
      <CodapFlowSelect
        onChange={modeChange}
        options={[
          {
            value: "selectOnly",
            title: "Select only the following attributes",
          },
          {
            value: "selectAllBut",
            title: "Select all but the following attributes",
          },
        ]}
        value={mode}
        defaultValue={"Mode"}
        disabled={saveData !== undefined}
      />

      <h3>Attributes</h3>
      <MultiAttributeSelector
        context={inputDataCtxt}
        selected={attributes}
        setSelected={setAttributes}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            attributes,
            mode,
          })}
        />
      )}
    </>
  );
}
