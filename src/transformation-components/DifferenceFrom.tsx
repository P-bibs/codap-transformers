import React, { useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { TransformationProps } from "./types";
import { differenceFrom } from "../transformations/fold";

export function DifferenceFrom({
  setErrMsg,
}: TransformationProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [inputColumnName, inputColumnNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));

  const [resultColumnName, resultColumnNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));

  const [startingValue, startingValueChange] = useInput<
    string,
    HTMLInputElement
  >("0", () => setErrMsg(null));

  const dataContexts = useDataContexts();

  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }

    if (resultColumnName === "") {
      setErrMsg("Please choose a non-empty result column name.");
      return;
    }

    const differenceStartingValue = Number(startingValue);
    if (isNaN(differenceStartingValue)) {
      setErrMsg(
        `Expected numeric starting value, instead got ${startingValue}`
      );
    }

    const dataset = {
      collections: (await getDataContext(inputDataCtxt)).collections,
      records: await getDataFromContext(inputDataCtxt),
    };

    try {
      const result = differenceFrom(
        dataset,
        inputColumnName,
        resultColumnName,
        differenceStartingValue
      );
      await createTableWithDataSet(result);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [
    inputDataCtxt,
    inputColumnName,
    resultColumnName,
    setErrMsg,
    startingValue,
  ]);

  return (
    <>
      <p>Table to calculate difference on</p>
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
      <p>Input Column Name:</p>
      <input
        type="text"
        value={inputColumnName}
        onChange={inputColumnNameChange}
      />
      <p>Result Column Name:</p>
      <input
        type="text"
        value={resultColumnName}
        onChange={resultColumnNameChange}
      />
      <p>Starting value for difference</p>
      <input type="text" value={startingValue} onChange={startingValueChange} />
      <br />
      <button onClick={transform}>Create table with difference</button>
    </>
  );
}
