import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { averageTable } from "../transformations/average";
import { DataSet } from "../transformations/types";
import { TransformationSubmitButtons, ContextSelector } from "../ui-components";
import { ctxtTitle, addUpdateListener, applyNewDataSet } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import AttributeSelector from "../ui-components/AttributeSelector";

export interface AverageSaveData {
  attribute: string;
}

interface AverageProps extends TransformationProps {
  saveData?: AverageSaveData;
}

export function Average({ setErrMsg, saveData }: AverageProps): ReactElement {
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

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const result = averageTable(dataset, attribute);
      return [result, `Average of ${ctxtTitle(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg, attribute]);

  return (
    <>
      <p>Table to Take Average of</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <br />
      <p>Attribute to Average</p>
      <AttributeSelector
        context={inputDataCtxt}
        value={attribute}
        onChange={setAttribute}
      />
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
