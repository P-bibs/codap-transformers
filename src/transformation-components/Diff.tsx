import React, { useState, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  setContextItems,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useAttributes, useDataContexts } from "../utils/hooks";
import { diff } from "../transformations/diff";

interface FilterProps {
  setErrMsg: (s: string | null) => void;
}

export function Diff({ setErrMsg }: FilterProps): ReactElement {
  const [inputDataContext1, setInputDataContext1] =
    useState<null | string>(null);
  const [inputDataContext2, setInputDataContext2] =
    useState<null | string>(null);
  const [inputAttribute1, setInputAttribute1] = useState<null | string>(null);
  const [inputAttribute2, setInputAttribute2] = useState<null | string>(null);

  const dataContexts = useDataContexts();
  const attributes1 = useAttributes(inputDataContext1);
  const attributes2 = useAttributes(inputDataContext2);

  const [lastContextName, setLastContextName] = useState<null | string>(null);

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
        const diffed = diff(
          dataset1,
          dataset2,
          inputAttribute1,
          inputAttribute2
        );

        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }
          setContextItems(lastContextName, diffed.records);
        } else {
          const [newContext] = await createTableWithDataSet(diffed);
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
      setErrMsg,
    ]
  );

  return (
    <>
      <p>Table to Diff 1</p>
      <select
        id="inputDataContext1"
        onChange={(e) => setInputDataContext1(e.target.value)}
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
      <p>Table to Diff 2</p>
      <select
        id="inputDataContext2"
        onChange={(e) => setInputDataContext2(e.target.value)}
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

      <p>First attribute to Diff</p>
      <select
        id="inputAttribute1"
        onChange={(e) => setInputAttribute1(e.target.value)}
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

      <p>Second attribute to Diff</p>
      <select
        id="inputAttribute2"
        onChange={(e) => setInputAttribute2(e.target.value)}
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

      <br />
      <button onClick={() => 1}>Create Diff</button>
    </>
  );
}
