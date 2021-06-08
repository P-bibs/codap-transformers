import React, { useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { combineCases } from "../transformations/combineCases";
import { DataSet } from "../transformations/types";
import { ContextSelector, TransformationSubmitButtons } from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export type CombineCasesSaveData = Record<string, never>;

interface CombineCasesProps extends TransformationProps {
  saveData?: CombineCasesSaveData;
}

export function CombineCases({
  setErrMsg,
  saveData,
}: CombineCasesProps): ReactElement {
  const [inputDataContext1, inputDataContext1OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [inputDataContext2, inputDataContext2OnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const transform = useCallback(async () => {
    setErrMsg(null);

    if (!inputDataContext1 || !inputDataContext2) {
      setErrMsg("Please choose two contexts to stack.");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context: context1, dataset: dataset1 } =
        await getContextAndDataSet(inputDataContext1);
      const { context: context2, dataset: dataset2 } =
        await getContextAndDataSet(inputDataContext2);
      const combined = combineCases(dataset1, dataset2);
      return [
        combined,
        `Combined Cases of ${ctxtTitle(context1)} and ${ctxtTitle(context2)}`,
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
  }, [inputDataContext1, inputDataContext2, setErrMsg]);

  return (
    <>
      <p>Base Table</p>
      <ContextSelector
        value={inputDataContext1}
        onChange={inputDataContext1OnChange}
      />
      <p>Combining Table</p>
      <ContextSelector
        value={inputDataContext2}
        onChange={inputDataContext2OnChange}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {saveData === undefined && (
        <TransformationSaveButton generateSaveData={() => ({})} />
      )}
    </>
  );
}
