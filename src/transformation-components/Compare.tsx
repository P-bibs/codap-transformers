import React, { useState, useCallback, ReactElement, useEffect } from "react";
import {
  getDataFromContext,
  updateContextWithDataSet,
  createTableWithDataSet,
  getDataContext,
  addContextUpdateListener,
  removeContextUpdateListener,
} from "../utils/codapPhone";
import { useAttributes, useDataContexts, useInput } from "../utils/hooks";
import { compare } from "../transformations/compare";

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

      const dataset1 = {
        collections: (await getDataContext(inputDataContext1)).collections,
        records: await getDataFromContext(inputDataContext1),
      };
      const dataset2 = {
        collections: (await getDataContext(inputDataContext2)).collections,
        records: await getDataFromContext(inputDataContext2),
      };

      try {
        const compared = compare(
          dataset1,
          dataset2,
          inputAttribute1,
          inputAttribute2,
          isCategorical
        );

        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }
          updateContextWithDataSet(lastContextName, compared);
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
      <select
        id="inputDataContext1"
        onChange={inputDataContext1OnChange}
        defaultValue="default"
      >
        <option disabled value="default">
          Select a Data Context
        </option>
        {dataContexts.map((dataContext) => (
          <option key={dataContext.name} value={dataContext.name}>
            {dataContext.title} ({dataContext.name})
          </option>
        ))}
      </select>
      <p>Table to Compare 2</p>
      <select
        id="inputDataContext2"
        onChange={inputDataContext2OnChange}
        defaultValue="default"
      >
        <option disabled value="default">
          Select a Data Context
        </option>
        {dataContexts.map((dataContext) => (
          <option key={dataContext.name} value={dataContext.name}>
            {dataContext.title} ({dataContext.name})
          </option>
        ))}
      </select>

      <p>First attribute to Compare</p>
      <select
        id="inputAttribute1"
        onChange={inputAttribute1OnChange}
        defaultValue="default"
      >
        <option disabled value="default">
          Select a attribute
        </option>
        {attributes1.map((attribute) => (
          <option key={attribute.name} value={attribute.name}>
            {attribute.title} ({attribute.name})
          </option>
        ))}
      </select>

      <p>Second attribute to Compare</p>
      <select
        id="inputAttribute2"
        onChange={inputAttribute2OnChange}
        defaultValue="default"
      >
        <option disabled value="default">
          Select a attribute
        </option>
        {attributes2.map((attribute) => (
          <option key={attribute.name} value={attribute.name}>
            {attribute.title} ({attribute.name})
          </option>
        ))}
      </select>
      <p>What kind of Comparison?</p>
      <select
        id="isCategorical"
        onChange={(e) =>
          e.target.value === "categorical"
            ? setIsCategorical(true)
            : setIsCategorical(false)
        }
        defaultValue="numeric"
      >
        <option value="categorical">Categorical</option>
        <option value="numeric">Numeric</option>
      </select>

      <br />
      <button onClick={() => transform(false)}>
        Create Table with Comparison
      </button>
      <br />
      <button onClick={() => transform(true)}>
        Update Previous Table With Comparison
      </button>
    </>
  );
}
