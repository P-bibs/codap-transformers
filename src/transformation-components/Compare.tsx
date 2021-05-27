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

interface CompareProps {
  setErrMsg: (s: string | null) => void;
}

export function Compare({ setErrMsg }: CompareProps): ReactElement {
  const [inputDataContext1, inputDataContext1OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputDataContext2, inputDataContext2OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputAttribute1, inputAttribute1OnChange] =
    useState<string | null>(null);
  const [inputAttribute2, inputAttribute2OnChange] =
    useState<string | null>(null);

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
        onChange={inputAttribute1OnChange}
        value={inputAttribute1}
        context={inputDataContext1}
      />

      <p>Second attribute to Compare</p>
      <AttributeSelector
        onChange={inputAttribute2OnChange}
        value={inputAttribute2}
        context={inputDataContext2}
      />

      <p>What kind of Comparison?</p>
      <CodapFlowSelect
        onChange={(e) => setCompareType(e.target.value as CompareType)}
        options={[
          { value: "categorical", title: "Categorical" },
          { value: "numeric", title: "Numeric" },
          { value: "decision", title: "Decision" },
        ]}
        value={compareType}
        defaultValue="Select a type"
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
    </>
  );
}
