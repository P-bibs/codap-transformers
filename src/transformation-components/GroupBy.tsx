import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { groupBy } from "../transformations/groupBy";
import { applyNewDataSet, ctxtTitle } from "./util";
import {
  TransformationSubmitButtons,
  ContextSelector,
  MultiAttributeSelector,
} from "../ui-components";
import { TransformationProps } from "./types";

export interface GroupBySaveData {
  attributes: string[];
}

interface GroupByProps extends TransformationProps {
  saveData?: GroupBySaveData;
}

export function GroupBy({ setErrMsg, saveData }: GroupByProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, setAttributes] = useState<string[]>(
    saveData !== undefined ? saveData.attributes : []
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
      if (attributes.length === 0) {
        setErrMsg("Please choose at least one attribute to group by");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const parentName = `Grouped by ${attributes.join(", ")}`;

      try {
        const grouped = groupBy(dataset, attributes, parentName);
        await applyNewDataSet(
          grouped,
          `Group By of ${ctxtTitle(context)}`,
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
      <p>Table to Group</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Attributes to Group By</p>
      <MultiAttributeSelector
        context={inputDataCtxt}
        onChange={setAttributes}
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
