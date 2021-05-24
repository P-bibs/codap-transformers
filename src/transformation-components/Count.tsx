import React, { useEffect, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { count } from "../transformations/count";
import { CodapFlowTextInput } from "../ui-components/CodapFlowTextInput";
import { TransformationSubmitButtons } from "../ui-components/TransformationSubmitButtons";
import { CodapFlowSelect } from "../ui-components/CodapFlowSelect";

interface CountProps {
  setErrMsg: (s: string | null) => void;
}

export function Count({ setErrMsg }: CountProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributeName, attributeNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));
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

    const dataset = {
      collections: (await getDataContext(inputDataCtxt)).collections,
      records: await getDataFromContext(inputDataCtxt),
    };

    try {
      const counted = count(dataset, attributeName);
      await createTableWithDataSet(counted);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, attributeName, setErrMsg]);

  useEffect(() => {
    if (inputDataCtxt !== null) {
      addContextUpdateListener(inputDataCtxt, transform);
      return () => removeContextUpdateListener(inputDataCtxt);
    }
  }, [transform, inputDataCtxt]);

  return (
    <>
      <p>Table to Count</p>
      <CodapFlowSelect
        onChange={inputChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: `${dataContext.title} (${dataContext.name})`,
        }))}
        value={inputDataCtxt}
        defaultValue="Select a Data Context"
      />

      <p>Attribute to Count</p>
      <CodapFlowTextInput
        value={attributeName}
        onChange={attributeNameChange}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform()}
        onUpdate={() => transform()}
        updateDisabled={true}
      />
    </>
  );
}
