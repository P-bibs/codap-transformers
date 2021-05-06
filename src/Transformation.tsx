import React from 'react';
import { useState } from 'react';
import './Transformation.css';

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation() {

  const [inputDataCtxt, setInputDataCtxt] = useState<string|null>(null);
  const [transformPgrm, setTransformPgrm] = useState("");

  const inputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInputDataCtxt(event.target.value);
  }

  const transformChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTransformPgrm(event.target.value);
  }

  /**
   * Retrieves a list of every data context in the CODAP window that 
   * could be used as input to this transformation.
   */
  const getPossibleInputs = () : string[] => {
    // TODO: communicate with CODAP to get names of all current data contexts
    return ["Table A", "Table B", "Table C"];
  }

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data. 
   */
  const transform = () => {
    // TODO: get inputDataCtxt's actual data from CODAP, interpret the 
    // transformPgrm and apply it to the data, and tell CODAP to create a 
    // new table with the transformed data.
    console.log(`Data context to transform: ${inputDataCtxt}`);
    console.log(`Transformation to apply:\n${transformPgrm}`);
  }

  return (
    <div className="Transformation">
      <p>Table to Transform</p>
      <select id="inputDataContext" onChange={inputChange}>
        {getPossibleInputs().map((dataContextName) => (
          <option>{dataContextName}</option>
        ))}
      </select>

      <p>How to Transform</p>
      <textarea onChange={transformChange}></textarea>

      <br/>
      <button onClick={transform}>Transform!</button>
    </div>
  );
}

export default Transformation;
