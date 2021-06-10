import React, { useCallback, ReactElement, useState } from "react";
import {
  getContextAndDataSet,
  createText,
  updateText,
} from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { average } from "../transformations/average";
import { TransformationSubmitButtons, ContextSelector } from "../ui-components";
import { readableName, addUpdateTextListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import AttributeSelector from "../ui-components/AttributeSelector";

export interface AverageSaveData {
  attribute: string | null;
}

interface AverageProps extends TransformationProps {
  saveData?: AverageSaveData;
}

export function Average({
  setErrMsg,
  saveData,
  errorDisplay,
}: AverageProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [attribute, setAttribute] = useState<string | null>(
    saveData !== undefined ? saveData.attribute : null
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

    if (attribute === null) {
      setErrMsg("Please choose an attribute to take the average of.");
      return;
    }

    const doTransform: () => Promise<[number, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const result = average(dataset, attribute);
      return [result, `Average of ${attribute} in ${readableName(context)}`];
    };

    try {
      const [result, name] = await doTransform();
      const textName = await createText(name, String(result));

      // Workaround because the text doesn't show up after creation
      // See https://codap.concord.org/forums/topic/issue-creating-and-updating-text-views-through-data-interactive-api/#post-6483
      updateText(textName, String(result));
      addUpdateTextListener(inputDataCtxt, textName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg, attribute]);

  return (
    <>
      <h3>Table to Take Average of</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <br />
      <h3>Attribute to Average</h3>
      <AttributeSelector
        context={inputDataCtxt}
        value={attribute}
        onChange={setAttribute}
        disabled={saveData !== undefined}
      />
      <br />
      <TransformationSubmitButtons
        onCreate={transform}
        label="Calculate Average"
      />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton generateSaveData={() => ({ attribute })} />
      )}
    </>
  );
}
