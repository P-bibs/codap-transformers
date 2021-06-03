import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { join } from "../transformations/join";
import { DataSet } from "../transformations/types";
import {
  AttributeSelector,
  ContextSelector,
  TransformationSubmitButtons,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";

interface JoinProps {
  setErrMsg: (s: string | null) => void;
}

export function Join({ setErrMsg }: JoinProps): ReactElement {
  const [inputDataContext1, inputDataContext1OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputDataContext2, inputDataContext2OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputAttribute1, inputAttribute1OnChange] =
    useState<string | null>(null);
  const [inputAttribute2, inputAttribute2OnChange] =
    useState<string | null>(null);

  const transform = useCallback(async () => {
    if (
      !inputDataContext1 ||
      !inputDataContext2 ||
      !inputAttribute1 ||
      !inputAttribute2
    ) {
      setErrMsg("Please choose two contexts and two attributes");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context: context1, dataset: dataset1 } =
        await getContextAndDataSet(inputDataContext1);
      const { context: context2, dataset: dataset2 } =
        await getContextAndDataSet(inputDataContext2);
      const joined = join(dataset1, inputAttribute1, dataset2, inputAttribute2);
      return [
        joined,
        `Join of ${ctxtTitle(context1)} and ${ctxtTitle(context2)}`,
      ];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataContext1, newContextName, doTransform);
      addUpdateListener(inputDataContext2, newContextName, doTransform);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [
    inputDataContext1,
    inputDataContext2,
    inputAttribute1,
    inputAttribute2,
    setErrMsg,
  ]);

  return (
    <>
      <p>Base Table</p>
      <ContextSelector
        value={inputDataContext1}
        onChange={inputDataContext1OnChange}
      />
      <p>Joining Table</p>
      <ContextSelector
        value={inputDataContext2}
        onChange={inputDataContext2OnChange}
      />

      <p>Base Attribute</p>
      <AttributeSelector
        onChange={inputAttribute1OnChange}
        value={inputAttribute1}
        context={inputDataContext1}
      />

      <p>Joining Attribute</p>
      <AttributeSelector
        onChange={inputAttribute2OnChange}
        value={inputAttribute2}
        context={inputDataContext2}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
