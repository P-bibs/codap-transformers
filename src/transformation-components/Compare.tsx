import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { compare, CompareType } from "../transformations/compare";
import { DataSet } from "../transformations/types";
import {
  CodapFlowSelect,
  AttributeSelector,
  ContextSelector,
  TransformationSubmitButtons,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface CompareSaveData {
  inputAttribute1: string;
  inputAttribute2: string;
  compareType: CompareType;
}

interface CompareProps extends TransformationProps {
  saveData?: CompareSaveData;
}

export function Compare({ setErrMsg, saveData }: CompareProps): ReactElement {
  const [inputDataContext1, inputDataContext1OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputDataContext2, inputDataContext2OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputAttribute1, setInputAttribute1] = useState<string | null>(
    saveData !== undefined ? saveData.inputAttribute1 : ""
  );
  const [inputAttribute2, setInputAttribute2] = useState<string | null>(
    saveData !== undefined ? saveData.inputAttribute2 : ""
  );

  const [compareType, setCompareType] = useState<CompareType>("numeric");

  const transform = useCallback(async () => {
    setErrMsg(null);

    if (
      !inputDataContext1 ||
      !inputDataContext2 ||
      !inputAttribute1 ||
      !inputAttribute2
    ) {
      setErrMsg("Please choose two contexts and two attributes");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context: context1, dataset: dataset1 } =
        await getContextAndDataSet(inputDataContext1);
      const { context: context2, dataset: dataset2 } =
        await getContextAndDataSet(inputDataContext2);
      const compared = compare(
        dataset1,
        dataset2,
        inputAttribute1,
        inputAttribute2,
        compareType
      );
      return [
        compared,
        `Compare of ${ctxtTitle(context1)} and ${ctxtTitle(context2)}`,
      ];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(
        inputDataContext1,
        newContextName,
        doTransform,
        setErrMsg
      );
      addUpdateListener(
        inputDataContext2,
        newContextName,
        doTransform,
        setErrMsg
      );
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [
    inputDataContext1,
    inputDataContext2,
    inputAttribute1,
    inputAttribute2,
    compareType,
    setErrMsg,
  ]);

  return (
    <>
      <h3>First Table to Compare </h3>
      <ContextSelector
        value={inputDataContext1}
        onChange={inputDataContext1OnChange}
      />
      <h3>Second Table to Compare</h3>
      <ContextSelector
        value={inputDataContext2}
        onChange={inputDataContext2OnChange}
      />

      <h3>First attribute to Compare</h3>
      <AttributeSelector
        onChange={(s) => setInputAttribute1(s)}
        value={inputAttribute1}
        context={inputDataContext1}
        disabled={saveData !== undefined}
      />

      <h3>Second attribute to Compare</h3>
      <AttributeSelector
        onChange={(s) => setInputAttribute2(s)}
        value={inputAttribute2}
        context={inputDataContext2}
        disabled={saveData !== undefined}
      />

      <h3>What kind of Comparison?</h3>
      <CodapFlowSelect
        onChange={(e) => setCompareType(e.target.value as CompareType)}
        options={[
          { value: "categorical", title: "Categorical" },
          { value: "numeric", title: "Numeric" },
          { value: "structural", title: "Structural" },
        ]}
        value={compareType}
        defaultValue="Select a type"
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            inputAttribute1,
            inputAttribute2,
            compareType,
          })}
        />
      )}
    </>
  );
}
