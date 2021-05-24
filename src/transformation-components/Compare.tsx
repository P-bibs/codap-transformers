import React, { useState, useCallback, ReactElement, useEffect } from "react";
import {
  getDataFromContext,
  setContextItems,
  createTableWithDataSet,
  getDataContext,
  addContextUpdateListener,
  removeContextUpdateListener,
} from "../utils/codapPhone";
import { useAttributes, useDataContexts, useInput } from "../utils/hooks";
import { compare } from "../transformations/compare";
import { CodapFlowSelect, TransformationSubmitButtons } from "../ui-components";

interface CompareProps {
  setErrMsg: (s: string | null) => void;
}

export function Compare({ setErrMsg }: CompareProps): ReactElement {
  const [inputDataContext1, inputDataContext1OnChange] = useInput<
    string,
    HTMLSelectElement
  >("", () => setErrMsg(null));
  const [inputDataContext2, inputDataContext2OnChange] = useInput<
    string,
    HTMLSelectElement
  >("", () => setErrMsg(null));
  const [inputAttribute1, inputAttribute1OnChange] = useInput<
    string,
    HTMLSelectElement
  >("", () => setErrMsg(null));
  const [inputAttribute2, inputAttribute2OnChange] = useInput<
    string,
    HTMLSelectElement
  >("", () => setErrMsg(null));

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

      // FIXME: perhaps a wrapper function for making a dataset from a context name?
      const dataset1 = {
        collections: (await getDataContext(inputDataContext1)).collections,
        records: await getDataFromContext(inputDataContext1),
      };
      const dataset2 = {
        collections: (await getDataContext(inputDataContext2)).collections,
        records: await getDataFromContext(inputDataContext2),
      };

      const compared = compare(
        dataset1,
        dataset2,
        inputAttribute1,
        inputAttribute2,
        isCategorical
      );
      try {
        // FIXME: wrap up this update vs. create logic in a function
        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }
          setContextItems(lastContextName, compared.records);
        } else {
          const [newContext] = await createTableWithDataSet(compared);
          setLastContextName(newContext.name);
        }
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

  // FIXME: can we find a way to make these update listeners more automatic?
  // Listen for updates to first data context
  useEffect(() => {
    if (inputDataContext1 !== null) {
      addContextUpdateListener(inputDataContext1, () => {
        transform(true);
      });
      return () => removeContextUpdateListener(inputDataContext1);
    }
  }, [transform, inputDataContext1]);

  // Listen for updates to second data context
  useEffect(() => {
    if (inputDataContext2 !== null) {
      addContextUpdateListener(inputDataContext2, () => {
        transform(true);
      });
      return () => removeContextUpdateListener(inputDataContext2);
    }
  }, [transform, inputDataContext2]);

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
