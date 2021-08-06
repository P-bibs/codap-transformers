import React, { ReactElement, useEffect } from "react";
import { useState } from "react";
import "./styles/Views.css";
import "./styles/REPLView.css";
import ErrorDisplay, {
  useErrorSetterId,
  useErrorStore,
} from "../components/ui-components/Error";
import { SavedTransformer } from "../components/transformer-template/types";
import transformerList, {
  BaseTransformerName,
  TransformerGroup,
} from "../transformerList";
import {
  getInteractiveFrame,
  notifyInteractiveFrameIsDirty,
} from "../lib/codapPhone";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
} from "../lib/codapPhone/listeners";
import { InteractiveState } from "../lib/codapPhone/types";
import AboutInfo from "../components/info-components/AboutInfo";
import { useActiveTransformations } from "../transformerStore";
import { ActionTypes } from "../transformerStore/types";
import { deserializeActiveTransformations } from "../transformerStore/util";
import { TransformerRenderer } from "../components/transformer-template/TransformerRenderer";
import Select, { ValueType, ActionMeta } from "react-select";
import TransformerInfo from "../components/info-components/TransformerInfo";
import { closePlugin } from "./util";
import { Cancel } from "@material-ui/icons";
import { IconButton } from "@material-ui/core";

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
const transformerGroups: [TransformerGroup, BaseTransformerName[]][] =
  (function () {
    let groupNames = Object.entries(transformerList).map(
      ([, data]) => data.group
    );
    // deduplicate group names
    groupNames = [...new Set(groupNames)];

    return groupNames.map((groupName: TransformerGroup): [
      TransformerGroup,
      BaseTransformerName[]
    ] => {
      // for each group name, filter to find all the transformers of that
      // type and then map to get just the transformer name
      const transformersMatchingGroup = Object.entries(transformerList)
        .filter(([, data]) => data.group === groupName)
        .map(([transform]) => transform as BaseTransformerName);
      return [groupName, transformersMatchingGroup];
    });
  })();

/**
 * REPLView provides a dropdown to select from the base transformations
 * and functionality to render the selected transformation.
 */
function REPLView(): ReactElement {
  const [transformType, setTransformType] =
    useState<BaseTransformerName | null>(null);

  const [errorStore, setErrMsg] = useErrorStore();
  const errorId = useErrorSetterId();

  // activeTransformations (first element of tuple) can be used to draw a diagram
  const [
    activeTransformations,
    activeTransformationsDispatch,
    wrappedDispatch,
  ] = useActiveTransformations(setErrMsg);

  function transformerChangeHandler(
    selected: ValueType<{ value: BaseTransformerName; label: string }, false>,
    _actionMeta: ActionMeta<{ value: BaseTransformerName; label: string }>
  ) {
    if (selected !== null) {
      notifyStateIsDirty();
      setTransformType(selected.value);
      setErrMsg(null, errorId);
    }
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

  // Tutorial info about the current transformer
  const info = transformType
    ? transformerList[transformType].componentData.info
    : null;

  return (
    <div className="transformer-view">
      <div className="title-row">
        <h3>Transformer</h3>
        <div>
          <AboutInfo />
          <IconButton
            style={{
              padding: "0",
            }}
            size="medium"
            onClick={() => closePlugin(activeTransformations)}
            title="Close plugin"
          >
            <Cancel htmlColor="var(--blue-green)" fontSize="inherit" />
          </IconButton>
        </div>
      </div>

      <div className="select-row">
        <Select
          className="transformer-select"
          onChange={transformerChangeHandler}
          options={transformerGroups.map(([groupName, transformers]) => ({
            label: groupName,
            options: transformers.map((transformer) => ({
              label: transformer,
              value: transformer,
            })),
          }))}
        />
        {info && transformType && (
          <TransformerInfo {...info} transformerName={transformType} />
        )}
      </div>

      <TransformerRenderer
        setErrMsg={setErrMsg}
        errorDisplay={<ErrorDisplay setErrMsg={setErrMsg} store={errorStore} />}
        transformer={baseTransformers.find(
          ({ name }) => name === transformType
        )}
        editable={true}
        activeTransformationsDispatch={wrappedDispatch}
      />
    </div>
  );
}

export default REPLView;
