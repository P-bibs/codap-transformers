import React, { useState, useEffect, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  setContextItems,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { groupBy } from "../transformations/groupBy";

interface GroupByProps {
  setErrMsg: (s: string | null) => void;
}

export function GroupBy({ setErrMsg }: GroupByProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, attributesChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );
  const [parentName, parentNameChange] = useInput<string, HTMLInputElement>(
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

      console.log(`Data context to group: ${inputDataCtxt}`);

      const dataset = {
        collections: (await getDataContext(inputDataCtxt)).collections,
        records: await getDataFromContext(inputDataCtxt),
      };

      // TODO: make this work for multi-word identifiers
      const attributeNames = attributes.split(",");

      try {
        console.log("attribute names:", attributeNames);
        console.log("parent name:", parentName);

        const grouped = groupBy(dataset, attributeNames, parentName);

        console.log("grouped dataset:", grouped);

        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }

          // TODO: this doesn't update the data context, only the records.
          // no good for group by which is structural change
          setContextItems(lastContextName, grouped.records);
        } else {
          const [newContext] = await createTableWithDataSet(grouped);
          setLastContextName(newContext.name);
        }
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, attributes, parentName, lastContextName, setErrMsg]
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
      <p>Table to Group</p>
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

      <p>Attributes to Group By</p>
      <textarea onChange={attributesChange}></textarea>

      <p>Name of New Parent Collection</p>
      <input type="text" onChange={parentNameChange}></input>

      <br />
      <button onClick={() => transform(false)}>Create grouped table</button>
      <button onClick={() => transform(true)} disabled={!lastContextName}>
        Update previous grouped table
      </button>
    </>
  );
}
