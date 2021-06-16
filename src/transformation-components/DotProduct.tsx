import React, { useCallback, ReactElement, useState } from "react";
import {
  getContextAndDataSet,
  createText,
  updateText,
} from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { dotProduct } from "../transformations/dotProduct";
import { TransformationSubmitButtons, ContextSelector } from "../ui-components";
import { readableName, addUpdateTextListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { MultiAttributeSelector } from "../ui-components";

export interface DotProductSaveData {
  attributes: string[];
}
interface DotProductProps extends TransformationProps {
  saveData?: DotProductSaveData;
}

export function DotProduct({
  setErrMsg,
  saveData,
  errorDisplay,
}: DotProductProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [attributes, setAttributes] = useState<string[]>(
    saveData !== undefined ? saveData.attributes : []
  );

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid dataset to transform.");
      return;
    }

    if (attributes.length === 0) {
      setErrMsg(
        "Please choose at least one attribute to take the dot product of."
      );
      return;
    }

    const doTransform: () => Promise<[number, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const result = dotProduct(dataset, attributes);
      return [result, `Dot Product of ${readableName(context)}`];
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
  }, [inputDataCtxt, setErrMsg, attributes]);

  return (
    <>
      <h3>Table to Take Dot Product of</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Attributes to Take Dot Product of</h3>
      <MultiAttributeSelector
        context={inputDataCtxt}
        setSelected={setAttributes}
        selected={attributes}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={transform}
        label="Calculate Dot Product"
      />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton generateSaveData={() => ({ attributes })} />
      )}
    </>
  );
}
