import React, { useState, useEffect, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  updateContextWithDataSet,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { filter } from "../transformations/filter";

interface FilterProps {
  setErrMsg: (s: string | null) => void;
}

export function Filter({ setErrMsg }: FilterProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [transformPgrm, pgrmChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );
  const dataContexts = useDataContexts();
  const [lastContextName, setLastContextName] = useState<string | null>(null);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }

      console.log(`Data context to filter: ${inputDataCtxt}`);
      console.log(`Filter predicate to apply:\n${transformPgrm}`);

      const dataset = {
        collections: (await getDataContext(inputDataCtxt)).collections,
        records: await getDataFromContext(inputDataCtxt),
      };

      try {
        const filtered = filter(dataset, transformPgrm);

        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }
          updateContextWithDataSet(lastContextName, filtered);
        } else {
          const [newContext] = await createTableWithDataSet(filtered);
          setLastContextName(newContext.name);
        }
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, transformPgrm, lastContextName, setErrMsg]
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
      <p>Table to Filter</p>
      <select
        id="inputDataContext"
        onChange={inputChange}
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

      <p>How to Filter</p>
      <textarea onChange={pgrmChange}></textarea>

      <br />
      <button onClick={() => transform(false)}>Create filtered table</button>
      <button onClick={() => transform(true)} disabled={!lastContextName}>
        Update previous filtered table
      </button>
    </>
  );
}
