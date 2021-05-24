import React, { useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { TransformationProps } from "./types";
import { sort } from "../transformations/sort";

export function Sort({ setErrMsg }: TransformationProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [keyExpression, keyExpressionChange] = useInput<
    string,
    HTMLTextAreaElement
  >("", () => setErrMsg(null));

  const dataContexts = useDataContexts();

  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }

    if (keyExpression === "") {
      setErrMsg("Key expression cannot be empty.");
      return;
    }

    const dataset = {
      collections: (await getDataContext(inputDataCtxt)).collections,
      records: await getDataFromContext(inputDataCtxt),
    };

    try {
      const result = sort(dataset, keyExpression);
      await createTableWithDataSet(result);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg, keyExpression]);

  return (
    <>
      <p>Table to sort</p>
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
      <p>Key expression</p>
      <textarea value={keyExpression} onChange={keyExpressionChange} />
      <br />
      <button onClick={transform}>Create sorted table</button>
    </>
  );
}
