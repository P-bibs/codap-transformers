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
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface JoinSaveData {
  inputAttribute1: string | null;
  inputAttribute2: string | null;
}

interface JoinProps extends TransformationProps {
  saveData?: JoinSaveData;
}

export function Join({
  setErrMsg,
  saveData,
  errorDisplay,
}: JoinProps): ReactElement {
  const [inputDataContext1, inputDataContext1OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputDataContext2, inputDataContext2OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputAttribute1, inputAttribute1OnChange] = useState<string | null>(
    saveData !== undefined ? saveData.inputAttribute1 : null
  );
  const [inputAttribute2, inputAttribute2OnChange] = useState<string | null>(
    saveData !== undefined ? saveData.inputAttribute2 : null
  );

  const transform = useCallback(async () => {
    setErrMsg(null);

    if (
      !inputDataContext1 ||
      !inputDataContext2 ||
      !inputAttribute1 ||
      !inputAttribute2
    ) {
      setErrMsg("Please choose two datasets and two attributes");
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
        `Join of ${readableName(context1)} and ${readableName(context2)}`,
      ];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(
        inputDataContext1,
        newContextName,
        doTransform,
        setErrMsg
      );
      addUpdateListener(
        inputDataContext2,
        newContextName,
        doTransform,
        setErrMsg
      );
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
      <h3>Base Table</h3>
      <ContextSelector
        value={inputDataContext1}
        onChange={inputDataContext1OnChange}
      />
      <h3>Joining Table</h3>
      <ContextSelector
        value={inputDataContext2}
        onChange={inputDataContext2OnChange}
      />

      <h3>Base Attribute</h3>
      <AttributeSelector
        onChange={inputAttribute1OnChange}
        value={inputAttribute1}
        context={inputDataContext1}
        disabled={saveData !== undefined}
      />

      <h3>Joining Attribute</h3>
      <AttributeSelector
        onChange={inputAttribute2OnChange}
        value={inputAttribute2}
        context={inputDataContext2}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({ inputAttribute1, inputAttribute2 })}
        />
      )}
    </>
  );
}
