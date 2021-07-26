import React, { ReactElement, useEffect } from "react";
import { useState } from "react";
import "./TransformerViews.css";
import ErrorDisplay from "../ui-components/Error";
import { SavedTransformer } from "./types";
import transformerList, {
  BaseTransformerName,
  TransformerGroup,
} from "./transformerList";
import { TransformerRenderer } from "./TransformerRenderer";
import {
  getInteractiveFrame,
  notifyInteractiveFrameIsDirty,
} from "../lib/codapPhone";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
} from "../lib/codapPhone/listeners";
import { InteractiveState } from "../lib/codapPhone/types";
import AboutInfo from "./AboutInfo";
import {
  useActiveTransformations,
  deserializeActiveTransformations,
  ActionTypes,
} from "../lib/transformationDescription";

// These are the base transformer types represented as SavedTransformer
// objects
const baseTransformers: SavedTransformer[] = Object.keys(transformerList).map(
  (transform) => ({
    name: transform,
    content: { base: transform as BaseTransformerName },
  })
);

// Take the grouping data from transformerList and reorganize it into a form
// thats easier to make a dropdown UI out of
const transformerGroups: [TransformerGroup, string[]][] = (function () {
  let groupNames = Object.entries(transformerList).map(
    ([, data]) => data.group
  );
  // deduplicate group names
  groupNames = [...new Set(groupNames)];

  return groupNames.map((groupName: TransformerGroup): [
    TransformerGroup,
    string[]
  ] => {
    // for each group name, filter to find all the transformers of that
    // type and then map to get just the transformer name
    const transformersMatchingGroup = Object.entries(transformerList)
      .filter(([, data]) => data.group === groupName)
      .map(([transform]) => transform);
    return [groupName, transformersMatchingGroup];
  });
})();

/**
 * TransformerREPLView provides a dropdown to select from the base transformations
 * and functionality to render the selected transformation.
 */
function TransformerREPLView(): ReactElement {
  const [transformType, setTransformType] = useState<string | null>(null);

  const [errMsg, setErrMsg] = useState<string | null>(null);

  // activeTransformations (first element of tuple) can be used to draw a diagram
  const [, activeTransformationsDispatch, wrappedDispatch] =
    useActiveTransformations(setErrMsg);

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    notifyStateIsDirty();
    setTransformType(event.target.value);
    setErrMsg(null);
  }

  // Load saved state from CODAP memory
  useEffect(() => {
    async function fetchSavedState() {
      const savedState = (await getInteractiveFrame()).savedState;
      if (savedState === undefined) {
        return;
      }
      if (savedState.transformerREPL) {
        setTransformType(savedState.transformerREPL.transformer);
      }
      if (savedState.activeTransformations) {
        activeTransformationsDispatch({
          type: ActionTypes.SET,
          newTransformations: deserializeActiveTransformations(
            savedState.activeTransformations
          ),
        });
      }
    }
    fetchSavedState();
  }, [activeTransformationsDispatch]);

  // Register a listener to generate the plugins state
  useEffect(() => {
    const callback = (
      previousInteractiveState: InteractiveState
    ): InteractiveState => {
      if (transformType) {
        return {
          ...previousInteractiveState,
          transformerREPL: {
            transformer: transformType as BaseTransformerName,
          },
        };
      } else {
        return previousInteractiveState;
      }
    };

    addInteractiveStateRequestListener(callback);
    return () => removeInteractiveStateRequestListener(callback);
  }, [transformType]);

  function notifyStateIsDirty() {
    notifyInteractiveFrameIsDirty();
  }

  return (
    <div className="transformer-view">
      <AboutInfo />

      <h3>Transformer Type</h3>

      <select
        onChange={typeChange}
        value={transformType || "Select a transformer"}
      >
        <option disabled value="Select a transformer">
          Select a transformer
        </option>
        {transformerGroups.map(([groupName, transformers]) => (
          <optgroup label={groupName} key={groupName}>
            {transformers.map((transformName) => (
              <option key={transformName} value={transformName}>
                {transformName}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <TransformerRenderer
        setErrMsg={setErrMsg}
        errorDisplay={<ErrorDisplay message={errMsg} />}
        transformer={baseTransformers.find(
          ({ name }) => name === transformType
        )}
        editable={true}
        activeTransformationsDispatch={wrappedDispatch}
      />
    </div>
  );
}

export default TransformerREPLView;
