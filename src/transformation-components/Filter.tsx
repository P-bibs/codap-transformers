import React, { useEffect, useCallback, ReactElement, useState } from "react";
import {
  addContextUpdateListener,
  removeContextUpdateListener,
  getContextAndDataSet,
} from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { filter } from "../transformations/filter";
import {
  TransformationSubmitButtons,
  CodapFlowTextArea,
  ContextSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { TransformationProps } from "./types";

export interface FilterSaveData {
  transformPgrm: string;
}

interface FilterProps extends TransformationProps {
  saveData?: FilterSaveData;
}

export function Filter({ setErrMsg, saveData }: FilterProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [transformPgrm, pgrmChange] = useInput<string, HTMLTextAreaElement>(
    saveData !== undefined ? saveData.transformPgrm : "",
    () => setErrMsg(null)
  );
  const [lastContextName, setLastContextName] = useState<string | null>(null);

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
      console.log(`Filter predicate to apply:\n${transformPgrm}`);

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const filtered = filter(dataset, transformPgrm);
        await applyNewDataSet(
          filtered,
          `Filter of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, transformPgrm, lastContextName, setErrMsg]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataCtxt,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

  useEffect(() => {
    if (inputDataCtxt !== null) {
      addContextUpdateListener(inputDataCtxt, () => {
        transform(true);
      });
      return () => removeContextUpdateListener(inputDataCtxt);
    }
  }, [transform, inputDataCtxt]);

  return (
    <>
      <p>Table to Filter</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>How to Filter</p>
      <CodapFlowTextArea
        onChange={pgrmChange}
        value={transformPgrm}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            transformPgrm,
          })}
        />
      )}
    </>
  );
}
