import React, { useState, useCallback, ReactElement } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { groupBy } from "../transformations/groupBy";
import { applyNewDataSet } from "./util";
import {
  TransformationSubmitButtons,
  ContextSelector,
  MultiAttributeSelector,
} from "../ui-components";

interface GroupByProps {
  setErrMsg: (s: string | null) => void;
}

export function GroupBy({ setErrMsg }: GroupByProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, setAttributes] = useState<string[]>([]);
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

      const dataset = await getDataSet(inputDataCtxt);
      const parentName = `Grouped by ${attributes.join(", ")}`;

      try {
        const grouped = groupBy(dataset, attributes, parentName);
        await applyNewDataSet(
          grouped,
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
