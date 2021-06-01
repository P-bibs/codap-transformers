//ts-ignore
import React, { ReactElement } from "react";
import { BuildColumn } from "./BuildColumn";
import { Filter } from "./Filter";
import { RunningSum } from "./Fold";
import { SavedTransformation } from "./types";

interface PolymorphicComponentProps {
  transformation?: SavedTransformation;
  setErrMsg: (s: string | null) => void;
}

/**
 * A component which takes in data about a saved transformation and renders it properly
 */
export const PolymorphicComponent = ({
  transformation,
  setErrMsg,
}: PolymorphicComponentProps): ReactElement => {
  if (transformation === undefined) {
    return <></>;
  }

  switch (transformation.content.base) {
    case "Filter":
      return (
        <Filter setErrMsg={setErrMsg} saveData={transformation.content.data} />
      );
    case "Build Column":
      return (
        <BuildColumn
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
    case "Running Sum":
      return (
        <RunningSum
          setErrMsg={setErrMsg}
          saveData={transformation.content.data}
        />
      );
  }
};
