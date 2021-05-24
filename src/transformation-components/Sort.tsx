import React, { useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { TransformationProps } from "./types";
import { sort } from "../transformations/sort";
import { TransformationSubmitButtons } from "../ui-components/TransformationSubmitButtons";
import { CodapFlowTextArea } from "../ui-components/CodapFlowTextArea";
import { CodapFlowSelect } from "../ui-components/CodapFlowSelect";

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
      <CodapFlowSelect
        onChange={inputChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: dataContext.title,
        }))}
        value={inputDataCtxt}
        defaultValue="Select a Data Context"
      />

      <p>Key expression</p>
      <CodapFlowTextArea value={keyExpression} onChange={keyExpressionChange} />
      <br />
      <TransformationSubmitButtons
        onCreate={() => transform()}
        onUpdate={() => transform()}
        updateDisabled={true}
      />
    </>
  );
}
