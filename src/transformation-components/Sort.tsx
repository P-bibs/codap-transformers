import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput, useAttributes } from "../utils/hooks";
import { TransformationProps } from "./types";
import { sort } from "../transformations/sort";
import { CodapLanguageType, DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ExpressionEditor,
  ContextSelector,
  TypeSelector,
  CodapFlowSelect,
} from "../ui-components";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export type SortDirection = "ascending" | "descending";
export interface SortSaveData {
  keyExpression: string;
  outputType: CodapLanguageType;
  sortDirection: SortDirection;
}

interface SortProps extends TransformationProps {
  saveData?: SortSaveData;
}

export function Sort({
  setErrMsg,
  saveData,
  errorDisplay,
}: SortProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [sortDirection, sortDirectionChange] = useState<SortDirection>(
    saveData !== undefined ? saveData.sortDirection : "ascending"
  );
  const [keyExpression, keyExpressionChange] = useState<string>(
    saveData !== undefined ? saveData.keyExpression : ""
  );
  const [outputType, setOutputType] = useState<CodapLanguageType>(
    saveData !== undefined ? saveData.outputType : "any"
  );
  const attributes = useAttributes(inputDataCtxt);

  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid dataset to transform.");
      return;
    }
    if (keyExpression === "") {
      setErrMsg("Please enter a non-empty key expression");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const result = await sort(
        dataset,
        keyExpression,
        outputType,
        sortDirection
      );
      return [result, `Sort ${sortDirection} of ${readableName(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg, keyExpression, outputType, sortDirection]);

  return (
    <>
      <h3>Table to sort</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Key expression</h3>
      <TypeSelector
        inputTypes={["Row"]}
        selectedInputType={"Row"}
        inputTypeDisabled={true}
        outputTypes={["any", "string", "number", "boolean", "boundary"]}
        selectedOutputType={outputType}
        outputTypeOnChange={(e) => {
          setOutputType(e.target.value as CodapLanguageType);
        }}
        outputTypeDisabled={saveData !== undefined}
      />
      <br />
      <ExpressionEditor
        value={keyExpression}
        onChange={keyExpressionChange}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />
      <br />
      <h3>Direction</h3>
      <CodapFlowSelect
        onChange={(e) => sortDirectionChange(e.target.value as SortDirection)}
        options={[
          { value: "descending", title: "descending" },
          { value: "ascending", title: "ascending" },
        ]}
        value={sortDirection}
        defaultValue="Select sort direction"
        disabled={saveData !== undefined}
      />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            keyExpression,
            outputType,
            sortDirection,
          })}
        />
      )}
    </>
  );
}
