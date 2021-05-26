import React, { useState, useCallback, ReactElement } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { groupBy } from "../transformations/groupBy";
import { applyNewDataSet } from "./util";
import {
  CodapFlowTextArea,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";

interface GroupByProps {
  setErrMsg: (s: string | null) => void;
}

export function GroupBy({ setErrMsg }: GroupByProps): ReactElement {
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
      if (attributes === "") {
        setErrMsg("Please choose at least one attribute to group by");
        return;
      }

      const dataset = await getDataSet(inputDataCtxt);

      // extract attribute names from user's text
      const attributeNames = attributes.split("\n").map((s) => s.trim());
      const parentName = `Grouped by ${attributeNames.join(", ")}`;

      try {
        const grouped = groupBy(dataset, attributeNames, parentName);
        await applyNewDataSet(
          grouped,
          `Group By of ${inputDataCtxt}`,
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
      <p>Attributes to Group By (1 per line)</p>
      <CodapFlowTextArea value={attributes} onChange={attributesChange} />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
    </>
  );
}
