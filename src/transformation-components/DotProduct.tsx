import React, { useCallback, ReactElement } from "react";
import {
  getContextAndDataSet,
  createText,
  updateText,
} from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { dotProduct } from "../transformations/dotProduct";
import { TransformationSubmitButtons, ContextSelector } from "../ui-components";
import {
  ctxtTitle,
  addUpdateTextListener,
  allAttributesFromContext,
} from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export type DotProductSaveData = Record<string, never>;

interface DotProductProps extends TransformationProps {
  saveData?: DotProductSaveData;
}

export function DotProduct({
  setErrMsg,
  saveData,
}: DotProductProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

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

    const doTransform: () => Promise<[number, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const result = dotProduct(dataset, allAttributesFromContext(context));
      return [result, `Dot Product of ${ctxtTitle(context)}`];
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
  }, [inputDataCtxt, setErrMsg]);

  return (
    <>
      <p>Table to Take Dot Product of</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <br />
      <TransformationSubmitButtons
        onCreate={transform}
        label="Calculate dot product"
      />
      {saveData === undefined && (
        <TransformationSaveButton generateSaveData={() => ({})} />
      )}
    </>
  );
}
