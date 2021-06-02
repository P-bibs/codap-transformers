import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { TransformationProps } from "./types";
import { DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ContextSelector,
  AttributeSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import { uniqueName } from "../utils/names";

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

  const [inputAttributeName, inputAttributeNameChange] =
    useState<string | null>(null);

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }
      if (inputAttributeName === null) {
        setErrMsg("Please select an attribute to aggregate");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      const attrs = dataset.collections.map((coll) => coll.attrs || []).flat();
      const resultAttributeName = uniqueName(
        `${label} of ${inputAttributeName}`,
        attrs.map((attr) => attr.name)
      );

      try {
        const result = foldFunc(
          dataset,
          inputAttributeName,
          resultAttributeName
        );
        await applyNewDataSet(
          result,
          `${label} of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [
      inputDataCtxt,
      inputAttributeName,
      setErrMsg,
      foldFunc,
      lastContextName,
      label,
    ]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataCtxt,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

  return (
    <>
      <p>Table to calculate {label.toLowerCase()} on</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Attribute to Aggregate</p>
      <AttributeSelector
        onChange={inputAttributeNameChange}
        value={inputAttributeName}
        context={inputDataCtxt}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
    </>
  );
}
