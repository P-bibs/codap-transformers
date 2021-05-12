/* eslint use-isnan: 0 */
import React from "react";
import { useState, useEffect, useCallback } from "react";
import "./Transformation.css";
import Error from "./Error";
import {
  getAllDataContexts,
  getDataFromContext,
  setContextItems,
  addNewContextListener,
  removeNewContextListener,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithData,
} from "./utils/codapPhone";
import { Value } from "./language/ast";
import { Env } from "./language/interpret";
import { evaluate } from "./language";
import { DataContext } from "./utils/codapPhone/types";

function useDataContexts() {
  const [dataContexts, setDataContexts] = useState<DataContext[]>([]);

  async function refreshTables() {
    setDataContexts(await getAllDataContexts());
  }

  // Initial refresh to set up connection, then start listening
  useEffect(() => {
    refreshTables();
    addNewContextListener(refreshTables);
    return () => removeNewContextListener(refreshTables);
  }, []);

  return dataContexts;
}

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation() {
  /**
   * The broad categories of transformations that can be applied
   * to tables.
   */
  enum TransformType {
    Filter = "Filter",
  }

  const transformTypes = [TransformType.Filter];

  const [inputDataCtxt, setInputDataCtxt] = useState<string | null>(null);
  const [transformType, setTransformType] =
    useState<TransformType | null>(null);
  const [transformPgrm, setTransformPgrm] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const dataContexts = useDataContexts();
  const [lastContextName, setLastContextName] = useState<string | null>(null);

  function inputChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setInputDataCtxt(event.target.value);
    setErrMsg(null);
  }

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value as TransformType);
    setErrMsg(null);
  }

  function pgrmChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setTransformPgrm(event.target.value);
    setErrMsg(null);
  }

  /**
   * Converts a data item object into an environment for our language. Only
   * includes numeric values.
   *
   * @returns An environment from the fields of the data item.
   */
  function dataItemToEnv(dataItem: Record<string, unknown>): Env {
    return Object.fromEntries(
      Object.entries(dataItem).map(([key, tableValue]) => {
        let value;
        // parse value from CODAP table data
        if (
          tableValue === "true" ||
          tableValue === "false" ||
          tableValue === true ||
          tableValue === false
        ) {
          value = {
            kind: "Bool",
            content: tableValue === "true" || tableValue === true,
          };
        } else if (!isNaN(Number(tableValue))) {
          value = { kind: "Num", content: Number(tableValue) };
        } else {
          value = { kind: "String", content: tableValue };
        }
        return [key, value as Value];
      })
    );
  }

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
      if (transformType === null) {
        setErrMsg("Please choose a valid transformation type.");
        return;
      }

      console.log(`Data context to transform: ${inputDataCtxt}`);
      console.log(`Transformation type: ${transformType}`);
      console.log(`Transformation to apply:\n${transformPgrm}`);

      const data = await getDataFromContext(inputDataCtxt);

      try {
        const newData = [];

        for (const dataItem of data) {
          const dataEnv = dataItemToEnv(dataItem);
          const result = evaluate(transformPgrm, dataEnv);

          if (result.kind !== "Bool") {
            setErrMsg(`Expected boolean output, instead got ${result.kind}.`);
            return;
          }
          // include in filter if expression evaluated to true
          if (result.content) {
            newData.push(dataItem);
          }
        }

        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }
          setContextItems(lastContextName, newData);
        } else {
          const [newContext, _newTable] = await createTableWithData(newData);
          setLastContextName(newContext.name);
        }
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, transformType, transformPgrm, lastContextName]
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
    <div className="Transformation">
      <p>Table to Transform</p>
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

      <p>Transformation Type</p>
      <select id="transformType" onChange={typeChange}>
        <option selected disabled>
          Select a Transformation
        </option>
        {transformTypes.map((type, i) => (
          <option key={i}>{type}</option>
        ))}
      </select>

      <p>How to Transform</p>
      <textarea onChange={pgrmChange}></textarea>

      <br />
      <button onClick={() => transform(false)}>
        Create table with transformation
      </button>
      <button onClick={() => transform(true)} disabled={!lastContextName}>
        Update previous table with transformation
      </button>

      <Error message={errMsg} />
    </div>
  );
}

export default Transformation;
