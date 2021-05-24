import React, { useEffect, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { buildColumn } from "../transformations/buildColumn";

interface BuildColumnProps {
  setErrMsg: (s: string | null) => void;
}

export function BuildColumn({ setErrMsg }: BuildColumnProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributeName, attributeNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));
  const [collectionName, collectionNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));
  const [expression, expressionChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );
  const dataContexts = useDataContexts();

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }
    if (attributeName === "") {
      setErrMsg("Please enter a non-empty name for the new attribute");
      return;
    }
    if (collectionName === "") {
      setErrMsg("Please enter a non-empty collection name to add to");
      return;
    }
    if (expression === "") {
      setErrMsg("Please enter a non-empty expression");
      return;
    }

    const dataset = {
      collections: (await getDataContext(inputDataCtxt)).collections,
      records: await getDataFromContext(inputDataCtxt),
    };

    try {
      const built = buildColumn(
        dataset,
        attributeName,
        collectionName,
        expression
      );
      await createTableWithDataSet(built);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, attributeName, collectionName, expression, setErrMsg]);

  useEffect(() => {
    if (inputDataCtxt !== null) {
      addContextUpdateListener(inputDataCtxt, transform);
      return () => removeContextUpdateListener(inputDataCtxt);
    }
  }, [transform, inputDataCtxt]);

  return (
    <>
      <p>Table to Add Attribute To</p>
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

      <p>Name of New Attribute</p>
      <input type="text" onChange={attributeNameChange} />

      <p>Collection to Add To</p>
      <input type="text" onChange={collectionNameChange} />

      <p>Formula for Attribute Values</p>
      <textarea onChange={expressionChange}></textarea>

      <br />
      <button onClick={transform}>Create table with attribute added</button>
    </>
  );
}
