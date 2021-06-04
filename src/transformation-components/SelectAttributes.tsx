import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { selectAttributes } from "../transformations/selectAttributes";
import {
  TransformationSubmitButtons,
  ContextSelector,
  MultiAttributeSelector,
  CodapFlowSelect,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
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
  const [lastContextName, setLastContextName] = useState<null | string>(null);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      setErrMsg(null);

      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      // select all but the given attributes?
      const allBut = mode === "selectAllBut";

      try {
        const selected = selectAttributes(dataset, attributes, allBut);
        await applyNewDataSet(
          selected,
          `Select Attributes of ${ctxtTitle(context)}`,
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

      <p>Attributes</p>
      <MultiAttributeSelector
        context={inputDataCtxt}
        selected={attributes}
        setSelected={setAttributes}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={lastContextName === null}
      />
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
