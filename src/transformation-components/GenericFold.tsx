import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { TransformationProps } from "./types";
import { DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ContextSelector,
  AttributeSelector,
  CodapFlowTextInput,
  ExpressionEditor,
} from "../ui-components";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import { genericFold } from "../transformations/fold";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface GenericFoldSaveData {
  inputAttributeName: string | null;
  outputAttributeName: string;
  expression: string;
  base: string;
  accumulatorName: string;
}

interface GenericFoldProps extends TransformationProps {
  saveData?: GenericFoldSaveData;
}

export function GenericFold({
  setErrMsg,
  saveData,
  errorDisplay,
}: GenericFoldProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [inputAttributeName, inputAttributeNameChange] = useState<
    string | null
  >(saveData !== undefined ? saveData.inputAttributeName : null);
  const [outputAttributeName, outputAttributeNameChange] = useInput<
    string,
    HTMLInputElement
  >(saveData !== undefined ? saveData.outputAttributeName : "", () =>
    setErrMsg(null)
  );
  const [base, baseChange] = useInput<string, HTMLInputElement>(
    saveData !== undefined ? saveData.base : "",
    () => setErrMsg(null)
  );
  const [expression, expressionChange] = useState<string>(
    saveData !== undefined ? saveData.expression : ""
  );
  const [accumulatorName, accumulatorNameChange] = useInput<
    string,
    HTMLInputElement
  >(saveData !== undefined ? saveData.accumulatorName : "", () =>
    setErrMsg(null)
  );

  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid dataset to transform.");
      return;
    }
    if (inputAttributeName === null) {
      setErrMsg("Please select an attribute to aggregate");
      return;
    }
    if (outputAttributeName === "") {
      setErrMsg("Please enter a name for the new attribute");
      return;
    }
    if (expression === "") {
      setErrMsg("Please enter an expression");
      return;
    }
    if (base === "") {
      setErrMsg("Please enter a base value");
      return;
    }
    if (accumulatorName === "") {
      setErrMsg("Please enter an accumulator name");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const resultDescription = `A reduce of the values from the ${inputAttributeName} attribute in the ${readableName(
        context
      )} table.`;
      const result = await genericFold(
        dataset,
        base,
        expression,
        inputAttributeName,
        outputAttributeName,
        accumulatorName,
        resultDescription
      );
      return [result, `Reduce of ${readableName(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [
    inputDataCtxt,
    inputAttributeName,
    outputAttributeName,
    expression,
    accumulatorName,
    base,
    setErrMsg,
  ]);

  return (
    <>
      <h3>Table to reduce</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Attribute to Aggregate</h3>
      <AttributeSelector
        onChange={inputAttributeNameChange}
        value={inputAttributeName}
        context={inputDataCtxt}
        disabled={saveData !== undefined}
      />

      <h3>Result Attribute Name</h3>
      <CodapFlowTextInput
        value={outputAttributeName}
        onChange={outputAttributeNameChange}
        disabled={saveData !== undefined}
      />

      <h3>Starting Value</h3>
      <CodapFlowTextInput
        value={base}
        onChange={baseChange}
        disabled={saveData !== undefined}
      />

      <h3>Accumulator Name</h3>
      <CodapFlowTextInput
        value={accumulatorName}
        onChange={accumulatorNameChange}
        disabled={saveData !== undefined}
      />

      <h3>Formula for Next Accumulator</h3>
      <ExpressionEditor
        value={expression}
        onChange={expressionChange}
        disabled={saveData !== undefined}
        attributeNames={
          inputAttributeName !== null
            ? [inputAttributeName, accumulatorName]
            : [accumulatorName]
        }
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            inputAttributeName,
            outputAttributeName,
            expression,
            base,
            accumulatorName,
          })}
        />
      )}
    </>
  );
}
