import React from 'react';
import { useState } from 'react';
import './Transformation.css';
import Error from './Error'

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation() {

  enum TransformType {
    Filter,
  }

  const [inputDataCtxt, setInputDataCtxt] = useState<string|null>(null);
  const [transformType, setTransformType] = useState<TransformType|null>(null);
  const [transformPgrm, setTransformPgrm] = useState("");
  const [errMsg, setErrMsg] = useState<string|null>(null);

  function inputChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setInputDataCtxt(event.target.value);
    setErrMsg(null);
  }

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nameToType : {[name: string] : TransformType} = {
      "Filter": TransformType.Filter,
    };
    setTransformType(nameToType[event.target.value]);
    setErrMsg(null);
  }

  function pgrmChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setTransformPgrm(event.target.value);
    setErrMsg(null);
  }

  /**
   * Retrieves a list of every data context in the CODAP window that 
   * could be used as input to this transformation.
   * 
   * @returns list of data context names
   */
  function getPossibleInputs() : string[] {
    // TODO: communicate with CODAP to get names of all current data contexts
    return ["Table A", "Table B", "Table C"];
  }

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data. 
   */
  function transform() {
    if (inputDataCtxt === null) {
      setErrMsg('Please choose a valid data context to transform.');
      return;
    }
    if (transformType === null) {
      setErrMsg('Please choose a valid transformation type.');
      return;
    }

    // TODO: get inputDataCtxt's actual data from CODAP, interpret the 
    // transformPgrm and apply it to the data, and tell CODAP to create a 
    // new table with the transformed data.
    console.log(`Data context to transform: ${inputDataCtxt}`);
    console.log(`Transformation type: ${transformType}`);
    console.log(`Transformation to apply:\n${transformPgrm}`);
  }

  return (
    <div className="Transformation">
      <p>Table to Transform</p>
      <select id="inputDataContext" onChange={inputChange}>
        <option selected disabled>Select a Data Context</option>
        {getPossibleInputs().map((dataContextName) => (
          <option>{dataContextName}</option>
        ))}
      </select>

      <p>Transformation Type</p>
      <select id="transformType" onChange={typeChange}>
        <option selected disabled>Select a Transformation</option>
        <option>Filter</option>
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
