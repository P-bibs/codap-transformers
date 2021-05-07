import React from 'react';
import { useState, useEffect } from 'react';
import './Transformation.css';
import Error from './Error'
import {
  getAllDataContexts,
  getDataFromContext,
  createDataset,
  createTable,
} from './utils/codapPhone';
import { addCodapListener, removeCodapListener } from './utils/codapListeners';
import { Value } from './language/ast';
import { Env } from './language/interpret';
import { evaluate } from "./language";


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

  const [inputDataCtxt, setInputDataCtxt] = useState<string|null>(null);
  const [transformType, setTransformType] = useState<TransformType|null>(null);
  const [transformPgrm, setTransformPgrm] = useState("");
  const [errMsg, setErrMsg] = useState<string|null>(null);
  const [dataContexts, setDataContexts] = useState<string[]|null>(null);

  // Initial refresh to set up connection, then start listening
  useEffect(() => {
    refreshTables();
    addCodapListener(refreshTables);
    return () => removeCodapListener(refreshTables);
  }, []);

  async function refreshTables() {
    setDataContexts(await getAllDataContexts());
  }

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
  function dataItemToEnv(dataItem: Object): Env {
    return Object.fromEntries(
      Object.entries(dataItem)
        .map(([key, value]) =>
          [key, { kind: "Num", content: Number(value) }]
        )
        .filter(([key, value]) => (value as Value).content !== NaN)
    );
  }

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data. 
   */
  async function transform() {
    if (inputDataCtxt === null) {
      setErrMsg('Please choose a valid data context to transform.');
      return;
    }
    if (transformType === null) {
      setErrMsg('Please choose a valid transformation type.');
      return;
    }

    console.log(`Data context to transform: ${inputDataCtxt}`);
    console.log(`Transformation type: ${transformType}`);
    console.log(`Transformation to apply:\n${transformPgrm}`);

    const data = await(getDataFromContext(inputDataCtxt));

    const newData = data.filter(dataItem => {
      const dataEnv = dataItemToEnv(dataItem);
      const result = evaluate(transformPgrm, dataEnv);
      if (result.kind !== "Bool") {
        setErrMsg("Expected boolean output, instead got number.");
        return false;
      }
      return result.content;
    });

    const newContext = await(createDataset("Testing", newData));
    await createTable(newContext.name);
  }

  return (
    <div className="Transformation">
      <p>Table to Transform</p>
      <select id="inputDataContext" onChange={inputChange}>
        <option selected disabled>Select a Data Context</option>
        {dataContexts && dataContexts.map((dataContextName) => (
          <option key={dataContextName}>{dataContextName}</option>
        ))}
      </select>

      <p>Transformation Type</p>
      <select id="transformType" onChange={typeChange}>
        <option selected disabled>Select a Transformation</option>
        {transformTypes.map((type) => (
          <option>{type}</option>
        ))}
      </select>

      <p>How to Transform</p>
      <textarea onChange={pgrmChange}></textarea>

      <br/>
      <button onClick={transform}>Transform!</button>

      <Error message={errMsg}/>
    </div>
  );
}

export default Transformation;
