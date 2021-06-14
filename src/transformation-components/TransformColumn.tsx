import React, { useState, useCallback, ReactElement } from "react";
import { useInput, useAttributes } from "../utils/hooks";
import { transformColumn } from "../transformations/transformColumn";
import { DataSet } from "../transformations/types";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import {
  ExpressionEditor,
  AttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
  TypeSelector,
  TransformationSaveButton,
} from "../ui-components";
import { getContextAndDataSet } from "../utils/codapPhone";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface TransformColumnSaveData {
  attributeName: string | null;
  expression: string;
  outputType: CodapLanguageType;
}

interface TransformColumnProps extends TransformationProps {
  saveData?: TransformColumnSaveData;
}
export function TransformColumn({
  setErrMsg,
  saveData,
  errorDisplay,
}: TransformColumnProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [attributeName, attributeNameChange] = useState<string | null>(
    saveData !== undefined ? saveData.attributeName : null
  );
  const [expression, expressionChange] = useState<string>(
    saveData !== undefined ? saveData.expression : ""
  );
  const [outputType, setOutputType] = useState<CodapLanguageType>(
    saveData !== undefined ? saveData.outputType : "any"
  );
  const attributes = useAttributes(inputDataCtxt);

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
    if (attributeName === null) {
      setErrMsg("Please select an attribute to transform");
      return;
    }
    if (expression === "") {
      setErrMsg("Please enter a non-empty expression to transform with");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const transformed = await transformColumn(
        dataset,
        attributeName,
        expression,
        outputType
      );
      const newName = `Transform Column of ${readableName(context)}`;
      return [transformed, newName];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, attributeName, expression, setErrMsg, outputType]);

  return (
    <>
      <h3>Table to Transform Column Of</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Attribute to Transform</h3>
      <AttributeSelector
        onChange={attributeNameChange}
        value={attributeName}
        context={inputDataCtxt}
        disabled={saveData !== undefined}
      />

      <h3>Formula for Transformed Values</h3>
      <TypeSelector
        inputTypes={["Row"]}
        selectedInputType={"Row"}
        inputTypeDisabled={true}
        outputTypes={["any", "string", "number", "boolean"]}
        selectedOutputType={outputType}
        outputTypeOnChange={(e) => {
          setOutputType(e.target.value as CodapLanguageType);
        }}
        outputTypeDisabled={saveData !== undefined}
      />
      <br />
      <ExpressionEditor
        value={expression}
        onChange={expressionChange}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            attributeName,
            expression,
          })}
        />
      )}
    </>
  );
}
