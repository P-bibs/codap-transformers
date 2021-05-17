import React, { useState, useEffect, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  setContextItems,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithData,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { flatten } from "../transformations/flatten";

interface FlattenProps {
  setErrMsg: (s: string | null) => void;
}

export function Flatten({ setErrMsg }: FlattenProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const dataContexts = useDataContexts();
  const [lastContextName, setLastContextName] = useState<string | null>(null);

  /**
   * Applies the flatten transformation to the input data context,
   * producing an output table in CODAP.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to flatten.");
        return;
      }

      console.log(`Data context to flatten: ${inputDataCtxt}`);

      const dataset = {
        collections: (await getDataContext(inputDataCtxt)).collections,
        records: await getDataFromContext(inputDataCtxt),
      };

      try {
        const flat = flatten(dataset);

        console.log("original", dataset);
        console.log("flat", flat);

        // TODO: use "create context from dataset" instead below

        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }
          setContextItems(lastContextName, flat.records);
        } else {
          const [newContext] = await createTableWithData(
            inputDataCtxt,
            flat.records
          );
          setLastContextName(newContext.name);
        }
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, lastContextName, setErrMsg]
  );

  useEffect(() => {
    if (inputDataCtxt !== null) {
      addContextUpdateListener(inputDataCtxt, () => {
        transform(true);
      });
      return () => removeContextUpdateListener(inputDataCtxt);
    }
  }, [transform, inputDataCtxt]);

  return (
    <>
      <p>Table to Flatten</p>
      <select id="inputDataContext" onChange={inputChange}>
        <option selected disabled>
          Select a Data Context
        </option>
        {dataContexts.map((dataContext) => (
          <option key={dataContext.name} value={dataContext.name}>
            {dataContext.title} ({dataContext.name})
          </option>
        ))}
      </select>

      <br />
      <button onClick={() => transform(false)}>Create flattened table</button>
      <button onClick={() => transform(true)} disabled={!lastContextName}>
        Update previous flattened table
      </button>
    </>
  );
}
