import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { compare } from "../transformations/compare";
import {
  CodapFlowSelect,
  AttributeSelector,
  ContextSelector,
  TransformationSubmitButtons,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import { TransformationProps } from "./types";

export interface CompareSaveData {
  inputAttribute1: string;
  inputAttribute2: string;
  isCategorical: boolean;
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
  const [inputAttribute1, inputAttribute1OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(saveData !== undefined ? saveData.inputAttribute1 : "", () =>
    setErrMsg(null)
  );
  const [inputAttribute2, inputAttribute2OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(saveData !== undefined ? saveData.inputAttribute2 : "", () =>
    setErrMsg(null)
  );

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  const [isCategorical, setIsCategorical] = useState<boolean>(
    saveData !== undefined ? saveData.isCategorical : false
  );

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
          isCategorical
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
      isCategorical,
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
      <p>Table to Compare 1</p>
      <ContextSelector
        value={inputDataContext1}
        onChange={inputDataContext1OnChange}
      />
      <p>Table to Compare 2</p>
      <ContextSelector
        value={inputDataContext2}
        onChange={inputDataContext2OnChange}
      />

      <p>First attribute to Compare</p>
      <AttributeSelector
        onChange={inputAttribute1OnChange}
        value={inputAttribute1}
        context={inputDataContext1}
        disabled={saveData !== undefined}
      />

      <p>Second attribute to Compare</p>
      <AttributeSelector
        onChange={inputAttribute2OnChange}
        value={inputAttribute2}
        context={inputDataContext2}
        disabled={saveData !== undefined}
      />

      <p>What kind of Comparison?</p>
      <CodapFlowSelect
        onChange={(e) =>
          e.target.value === "categorical"
            ? setIsCategorical(true)
            : setIsCategorical(false)
        }
        options={[
          { value: "categorical", title: "Categorical" },
          { value: "numeric", title: "Numeric" },
        ]}
        value={isCategorical ? "categorical" : "numeric"}
        defaultValue="Select a type"
        disabled={saveData !== undefined}
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
