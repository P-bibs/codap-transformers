import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { compare } from "../transformations/compare";
import { DataSet } from "../transformations/types";
import {
  CodapFlowSelect,
  AttributeSelector,
  ContextSelector,
  TransformationSubmitButtons,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";

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

  const [isCategorical, setIsCategorical] = useState<boolean>(false);

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
        isCategorical
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
    isCategorical,
    setErrMsg,
  ]);

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
      />

      <p>Second attribute to Compare</p>
      <AttributeSelector
        onChange={inputAttribute2OnChange}
        value={inputAttribute2}
        context={inputDataContext2}
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
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
