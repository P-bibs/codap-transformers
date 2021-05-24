import React, { useState, useCallback, ReactElement } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useAttributes,
  useContextUpdateListenerWithFlowEffect,
  useDataContexts,
  useInput,
} from "../utils/hooks";
import { compare } from "../transformations/compare";
import { CodapFlowSelect, TransformationSubmitButtons } from "../ui-components";
import { applyNewDataSet } from "./util";

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
  const [inputAttribute1, inputAttribute1OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputAttribute2, inputAttribute2OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const dataContexts = useDataContexts();
  const attributes1 = useAttributes(inputDataContext1);
  const attributes2 = useAttributes(inputDataContext2);

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  const [isCategorical, setIsCategorical] = useState<boolean>(false);

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

      const dataset1 = await getDataSet(inputDataContext1);
      const dataset2 = await getDataSet(inputDataContext2);

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
      <CodapFlowSelect
        onChange={inputDataContext1OnChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: `${dataContext.title} (${dataContext.name})`,
        }))}
        value={inputDataContext1}
        defaultValue="Select a Data Context"
      />
      <p>Table to Compare 2</p>
      <CodapFlowSelect
        onChange={inputDataContext2OnChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: `${dataContext.title} (${dataContext.name})`,
        }))}
        value={inputDataContext2}
        defaultValue="Select a Data Context"
      />

      <p>First attribute to Compare</p>
      <CodapFlowSelect
        onChange={inputAttribute1OnChange}
        options={attributes1.map((attribute) => ({
          value: attribute.name,
          title: `${attribute.title} (${attribute.name})`,
        }))}
        value={inputAttribute1}
        defaultValue="Select an attribute"
      />

      <p>Second attribute to Compare</p>
      <CodapFlowSelect
        onChange={inputAttribute2OnChange}
        options={attributes2.map((attribute) => ({
          value: attribute.name,
          title: `${attribute.title} (${attribute.name})`,
        }))}
        value={inputAttribute2}
        defaultValue="Select an attribute"
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
        value={inputAttribute2}
        defaultValue="numeric"
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
