import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { compare, CompareType } from "../transformations/compare";
import {
  CodapFlowSelect,
  AttributeSelector,
  ContextSelector,
  TransformationSubmitButtons,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
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

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  const [compareType, setCompareType] = useState<CompareType>("numeric");

  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (
        !inputDataContext1 ||
        !inputDataContext2 ||
        !inputAttribute1 ||
        !inputAttribute2
      ) {
        setErrMsg("Please choose two contexts and two attributes");
        return;
      }

      const { context: context1, dataset: dataset1 } =
        await getContextAndDataSet(inputDataContext1);
      const { context: context2, dataset: dataset2 } =
        await getContextAndDataSet(inputDataContext2);

      try {
        const compared = compare(
          dataset1,
          dataset2,
          inputAttribute1,
          inputAttribute2,
          compareType
        );
        await applyNewDataSet(
          compared,
          `Compare of ${ctxtTitle(context1)} and ${ctxtTitle(context2)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [
      inputDataContext1,
      inputDataContext2,
      inputAttribute1,
      inputAttribute2,
      lastContextName,
      compareType,
      setErrMsg,
    ]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataContext1,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataContext2,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

  return (
    <>
      <p>First Table to Compare </p>
      <ContextSelector
        value={inputDataContext1}
        onChange={inputDataContext1OnChange}
      />
      <p>Second Table to Compare</p>
      <ContextSelector
        value={inputDataContext2}
        onChange={inputDataContext2OnChange}
      />

      <p>First attribute to Compare</p>
      <AttributeSelector
        onChange={(s) => setInputAttribute1(s)}
        value={inputAttribute1}
        context={inputDataContext1}
        disabled={saveData !== undefined}
      />

      <p>Second attribute to Compare</p>
      <AttributeSelector
        onChange={(s) => setInputAttribute2(s)}
        value={inputAttribute2}
        context={inputDataContext2}
        disabled={saveData !== undefined}
      />

      <p>What kind of Comparison?</p>
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
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
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
