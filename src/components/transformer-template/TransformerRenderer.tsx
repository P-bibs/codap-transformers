import React, { ReactElement } from "react";
import { SavedTransformer } from "../../transformer-components/types";
import TransformerTemplate from "./TransformerTemplate";
import transformerList from "../../transformerList";
import { SafeActiveTransformationsDispatch } from "../../lib/transformationDescription";

interface TransformerRendererProps {
  transformer?: SavedTransformer;
  editable: boolean;
  setErrMsg: (s: string | null) => void;
  errorDisplay: ReactElement;
  activeTransformationsDispatch: SafeActiveTransformationsDispatch;
}

/**
 * A component which takes in data about a saved transformer and renders it properly
 */
export const TransformerRenderer = ({
  transformer,
  editable,
  setErrMsg,
  errorDisplay,
  activeTransformationsDispatch,
}: TransformerRendererProps): ReactElement => {
  if (transformer === undefined) {
    return <></>;
  }

  for (const key in transformerList) {
    if (transformer.content.base === key) {
      return (
        <TransformerTemplate
          setErrMsg={setErrMsg}
          errorDisplay={errorDisplay}
          init={transformerList[key].componentData.init}
          transformerFunction={
            transformerList[key].componentData.transformerFunction
          }
          info={transformerList[key].componentData.info}
          base={transformer.content.base}
          saveData={transformer.content.data}
          editable={editable}
          activeTransformationsDispatch={activeTransformationsDispatch}
        />
      );
    }
  }

  return <div>Unrecognized Transformer</div>;
};
