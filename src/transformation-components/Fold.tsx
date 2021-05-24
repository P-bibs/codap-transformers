import React, { useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { TransformationProps } from "./types";
import { DataSet } from "../transformations/types";

interface FoldProps extends TransformationProps {
  label: string;
  foldFunc: (
    dataset: DataSet,
    inputName: string,
    outputName: string
  ) => DataSet;
}

export function Fold({ setErrMsg, label, foldFunc }: FoldProps): ReactElement {
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

    const dataset = {
      collections: (await getDataContext(inputDataCtxt)).collections,
      records: await getDataFromContext(inputDataCtxt),
    };

    try {
      const result = foldFunc(dataset, inputColumnName, resultColumnName);
      await createTableWithDataSet(result);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, inputColumnName, resultColumnName, setErrMsg, foldFunc]);

  return (
    <>
      <p>Table to calculate {label} on</p>
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
      <br />
      <button onClick={transform}>Create table with {label}</button>
    </>
  );
}
