import React, { ReactElement } from "react";
import { SavedTransformation } from "./types";
import DDTransformation from "./DataDrivenTransformation";
import transformationList from "./transformationList";

interface PolymorphicComponentProps {
  transformation?: SavedTransformation;
  setErrMsg: (s: string | null) => void;
  errorDisplay: ReactElement;
}

/**
 * A component which takes in data about a saved transformation and renders it properly
 */
export const PolymorphicComponent = ({
  transformation,
  setErrMsg,
  errorDisplay,
}: PolymorphicComponentProps): ReactElement => {
  if (transformation === undefined) {
    return <></>;
  }

  for (const key in transformationList) {
    if (transformation.content.base === key) {
      return (
        <DDTransformation
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={transformationList[key].componentData.init}
          transformationFunction={
            transformationList[key].componentData.transformationFunction
          }
          base={transformation.content.base}
          saveData={transformation.content.data}
        />
      );
    }
  }

  return <div>Unrecognized Transformation</div>;
};
