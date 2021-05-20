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
import { transformColumn } from "../transformations/transformColumn";

interface TransformColumnProps {
  setErrMsg: (s: string | null) => void;
}

export function TransformColumn({ setErrMsg }: TransformColumnProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributeName, attributeNameChange] = useInput<string, HTMLInputElement>(
    "",
    () => setErrMsg(null)
  );
  const [expression, expressionChange] = useInput<string, HTMLTextAreaElement>(
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
      if (attributeName === "") {
        setErrMsg("Please enter a non-empty attribute name to transform");
        return;
      }
      if (expression === "") {
        setErrMsg("Please enter a non-empty expression to transform with");
        return;
      }

      const dataset = {
        collections: (await getDataContext(inputDataCtxt)).collections,
        records: await getDataFromContext(inputDataCtxt),
      };

      try {
        const transformed = transformColumn(dataset, attributeName, expression);

        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }
          setContextItems(lastContextName, transformed.records);
        } else {
          const [newContext] = await createTableWithDataSet(transformed);
          setLastContextName(newContext.name);
        }
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, attributeName, expression, lastContextName, setErrMsg]
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
      <p>Table to TransformColumn</p>
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

      <p>Attribute to Transform</p>
      <input type="text" onChange={attributeNameChange}/>

      <p>How to Transform Column</p>
      <textarea onChange={expressionChange}></textarea>

      <br />
      <button onClick={() => transform(false)}>Create transformed table</button>
      <button onClick={() => transform(true)} disabled={!lastContextName}>
        Update previous transformed table
      </button>
    </>
  );
}
