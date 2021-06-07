import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
} from "../utils/hooks";
import { join } from "../transformations/join";
import {
  AttributeSelector,
  ContextSelector,
  TransformationSubmitButtons,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";

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

  const [lastContextName, setLastContextName] = useState<null | string>(null);

  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (
        !inputDataContext1 ||
        !inputDataContext2 ||
        !inputAttribute1 ||
        !inputAttribute2
      ) {
        setErrMsg("Please choose two contexts and two attributes");
        return;
      }

      const { context: context1, dataset: dataset1 } =
        await getContextAndDataSet(inputDataContext1);
      const { context: context2, dataset: dataset2 } =
        await getContextAndDataSet(inputDataContext2);

      try {
        const joined = join(
          dataset1,
          inputAttribute1,
          dataset2,
          inputAttribute2
        );
        const baseTitle = ctxtTitle(context1);
        const joiningTitle = ctxtTitle(context2);
        await applyNewDataSet(
          joined,
          `Join of ${baseTitle} and ${joiningTitle}`,
          `A copy of ${baseTitle}, with all the attributes/values from the collection containing ${inputAttribute2} in ${joiningTitle} added into the collection containing ${inputAttribute1} in ${baseTitle}.`,
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
      inputDataContext1,
      inputDataContext2,
      inputAttribute1,
      inputAttribute2,
      lastContextName,
      setErrMsg,
    ]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataContext1,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataContext2,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

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
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
    </>
  );
}
