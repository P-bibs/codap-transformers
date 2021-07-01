/* eslint-disable @typescript-eslint/no-empty-interface */
import React, { useReducer, ReactElement, useEffect } from "react";
import {
  createText,
  getInteractiveFrame,
  notifyInteractiveFrameIsDirty,
  updateText,
} from "../utils/codapPhone";
import { useAttributes } from "../utils/hooks";
import {
  CodapLanguageType,
  DataSet,
  TransformationOutput,
} from "../transformers/types";
import {
  Select,
  AttributeSelector,
  ContextSelector,
  TransformerSubmitButtons,
  CollectionSelector,
  MultiAttributeSelector,
  TextInput,
  TypeSelector,
  ExpressionEditor,
} from "../ui-components";
import {
  applyNewDataSet,
  addUpdateListener,
  addUpdateTextListener,
} from "./util";
import TransformerSaveButton from "../ui-components/TransformerSaveButton";
import { BaseTransformerName } from "./transformerList";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
} from "../utils/codapPhone/listeners";
import { InteractiveState } from "../utils/codapPhone/types";
import Popover from "../ui-components/Popover";
import InfoIcon from "@material-ui/icons/Info";

// These types represent the configuration required for different UI elements
interface ComponentInit {
  title: string;
}
interface ContextInit extends ComponentInit {}
interface CollectionInit extends ComponentInit {
  context?: "context1" | "context2";
}
interface AttributeInit extends ComponentInit {
  context?: "context1" | "context2";
}
interface AttributeSetInit extends ComponentInit {
  context?: "context1" | "context2";
}
interface TextInputInit extends ComponentInit {}
interface DropdownInit extends ComponentInit {
  defaultValue: string;
  options: {
    title: string;
    value: string;
  }[];
}
interface ExpressionInit extends ComponentInit {}
interface TypeContractInit extends ComponentInit {
  inputTypes: string[];
  inputTypeDisabled?: boolean;
  outputTypes: string[];
  outputTypeDisabled?: boolean;
}
export type DDTransformerInit = {
  context1?: ContextInit;
  context2?: ContextInit;
  collection1?: CollectionInit;
  collection2?: CollectionInit;
  attribute1?: AttributeInit;
  attribute2?: AttributeInit;
  attributeSet1?: AttributeSetInit;
  attributeSet2?: AttributeSetInit;
  textInput1?: TextInputInit;
  textInput2?: TextInputInit;
  dropdown1?: DropdownInit;
  dropdown2?: DropdownInit;
  expression1?: ExpressionInit;
  expression2?: ExpressionInit;
  typeContract1?: TypeContractInit;
  typeContract2?: TypeContractInit;
};

// All the state types for different UI elements
type ContextState = string | null;
type CollectionState = string | null;
type AttributeState = string | null;
type AttributeSetState = string[];
type TextInputState = string;
type DropdownState = string | null;
type ExpressionState = string;
type TypeContractState = {
  inputType: CodapLanguageType;
  outputType: CodapLanguageType;
};
export type DDTransformerState = {
  context1: ContextState;
  context2: ContextState;
  collection1: CollectionState;
  collection2: CollectionState;
  attribute1: AttributeState;
  attribute2: AttributeState;
  attributeSet1: AttributeSetState;
  attributeSet2: AttributeSetState;
  textInput1: TextInputState;
  textInput2: TextInputState;
  dropdown1: DropdownState;
  dropdown2: DropdownState;
  expression1: ExpressionState;
  expression2: ExpressionState;
  typeContract1: TypeContractState;
  typeContract2: TypeContractState;
};

const DEFAULT_STATE: DDTransformerState = {
  context1: null,
  context2: null,
  collection1: null,
  collection2: null,
  attribute1: null,
  attribute2: null,
  attributeSet1: [],
  attributeSet2: [],
  textInput1: "",
  textInput2: "",
  dropdown1: null,
  dropdown2: null,
  expression1: "",
  expression2: "",
  typeContract1: { inputType: "any", outputType: "any" },
  typeContract2: { inputType: "any", outputType: "any" },
};

const contextFromCollection = (
  collection: string
): "collection1" | "collection2" =>
  convertNames(collection, "collection", "context") as
    | "collection1"
    | "collection2";

const contextFromAttribute = (attribute: string): "context1" | "context2" =>
  convertNames(attribute, "attribute", "context") as "context1" | "context2";

const contextFromAttributeSet = (
  attributeSet: string
): "context1" | "context2" =>
  convertNames(attributeSet, "attributeSet", "context") as
    | "context1"
    | "context2";

const attributeSetFromExpression = (
  expression: string
): "attributeSet1" | "attributeSet2" =>
  convertNames(expression, "expression", "attributes") as
    | "attributeSet1"
    | "attributeSet2";

/**
 * Converts component name and index of one type to a component of
 * another name but with the same index. Example: converts attribute1
 * to context1
 * @param sourceName the name you want to convert (eg: attribute1)
 * @param sourceNameRoot the root of the name you want to convert (eg: attribute)
 * @param destinationNameRoot the root of the name to convert to (eg: context)
 */
const convertNames = (
  sourceName: string,
  sourceNameRoot: string,
  destinationNameRoot: string
) => destinationNameRoot + sourceName.slice(sourceNameRoot.length);

/**
 * Makes a header from a ui component's title
 */
const titleFromComponent = (
  component: keyof DDTransformerInit,
  init: DDTransformerInit
): ReactElement => {
  const tmp = init[component];
  return tmp && tmp.title ? <h3>{tmp.title}</h3> : <></>;
};

export type TransformFunction =
  | {
      kind: "datasetCreator";
      func: (state: DDTransformerState) => Promise<TransformationOutput>;
    }
  | {
      kind: "fullOverride";
      func: (props: DDTransformerProps, state: DDTransformerState) => void;
    };

export type DDTransformerProps = {
  transformerFunction: TransformFunction;
  setErrMsg: (s: string | null) => void;
  errorDisplay: ReactElement;
  base: BaseTransformerName;
  init: DDTransformerInit;
  saveData?: DDTransformerState;
  info: {
    summary: string;
    consumes: string;
    produces: string;
  };
};

/**
 * Creates a transformer from a variety of ui elements. Requires a transformer
 * function that consumes state from all ui elements and returns a dataset and a
 * table name for a new context. Also requires an `init` object that has details on
 * which ui elements to include in the transformer and how to configure them.
 *
 * Only UI elements in `init` will be included and they will appear in order.
 */
const DataDrivenTransformer = (props: DDTransformerProps): ReactElement => {
  const {
    transformerFunction,
    init,
    info,
    base,
    saveData,
    errorDisplay,
    setErrMsg,
  } = props;

  const [state, setState] = useReducer(
    (
      oldState: DDTransformerState,
      newState: Partial<DDTransformerState>
    ): DDTransformerState => {
      return { ...oldState, ...newState };
    },
    saveData !== undefined ? saveData : DEFAULT_STATE
  );

  // Load saved state from CODAP memory
  useEffect(() => {
    async function fetchSavedState() {
      const savedState = (await getInteractiveFrame()).savedState;
      if (savedState.DDTransformation) {
        setState(savedState.DDTransformation);
      }
    }
    fetchSavedState();
  }, []);
  // Register a listener to generate the plugins state
  useEffect(() => {
    const callback = (
      previousInteractiveState: InteractiveState
    ): InteractiveState => {
      return { ...previousInteractiveState, DDTransformation: state };
    };

    addInteractiveStateRequestListener(callback);
    return () => removeInteractiveStateRequestListener(callback);
  }, [state]);
  function notifyStateIsDirty() {
    notifyInteractiveFrameIsDirty();
  }

  // Make sure we reset state if the underlying transformer changes (but only
  // if there isn't any save data)
  useEffect(() => {
    if (saveData === undefined) {
      setState(DEFAULT_STATE);
    }
  }, [init, saveData]);

  // The order here is guaranteed to be stable since ES2015 as long as we don't
  // use numeric keys
  const order = Object.keys(init);

  // Use these attributes to facilitate auto-fill in expression editor
  const attributes = {
    attributes1: useAttributes(state["context1"]),
    attributes2: useAttributes(state["context2"]),
  };

  const transform = async () => {
    setErrMsg(null);

    const doTransform: () => Promise<TransformationOutput> = async () => {
      if (transformerFunction.kind !== "datasetCreator") {
        throw new Error("Improper transformationFunction supplied");
      }
      // Might throw an error, which we handle in the below try/catch block
      return await transformerFunction.func(state);
    };

    try {
      const [result, name, description] = await doTransform();

      // Determine whether the transformerFunction returns a textbox or a table
      if (typeof result === "number") {
        // This is the case where the transformer returns a number

        const textName = await createText(name, String(result));

        // Workaround because the text doesn't show up after creation
        // See https://codap.concord.org/forums/topic/issue-creating-and-updating-text-views-through-data-interactive-api/#post-6483
        updateText(textName, String(result));

        if (order.includes("context1") && state["context1"] !== null) {
          addUpdateTextListener(
            state["context1"],
            textName,
            doTransform as () => Promise<[number, string, string]>,
            setErrMsg
          );
        }
        if (order.includes("context2") && state["context2"] !== null) {
          addUpdateTextListener(
            state["context2"],
            textName,
            doTransform as () => Promise<[number, string, string]>,
            setErrMsg
          );
        }
      } else if (typeof result === "object") {
        // This is the case where the transformation returns a dataset
        const newContextName = await applyNewDataSet(result, name, description);
        if (order.includes("context1") && state["context1"] !== null) {
          addUpdateListener(
            state["context1"],
            newContextName,
            doTransform as () => Promise<[DataSet, string, string]>,
            setErrMsg
          );
        }
        if (order.includes("context2") && state["context2"] !== null) {
          addUpdateListener(
            state["context2"],
            newContextName,
            doTransform as () => Promise<[DataSet, string, string]>,
            setErrMsg
          );
        }
      }
    } catch (e) {
      setErrMsg(e.message);
    }
  };

  /**
   * Splits a string into several <p> tags, one for each line of text.
   */
  function splitIntoParagraphs(text: string): JSX.Element[] {
    return text.split("\n").map((paragraph, i) => (
      <>
        <p key={i}>{paragraph}</p>
      </>
    ));
  }

  return (
    <>
      <Popover
        icon={<InfoIcon htmlColor="#72bfca" fontSize="small" />}
        tooltip={`More Info on ${base}`}
        innerContent={
          <>
            <p>{splitIntoParagraphs(info.summary)}</p>
            <p>
              <b>Consumes: </b>
              {splitIntoParagraphs(info.consumes)}
            </p>
            <p>
              <b>Produces: </b>
              {splitIntoParagraphs(info.produces)}
            </p>
          </>
        }
      />

      {order.map((component) => {
        if (component === "context1" || component === "context2") {
          return (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <ContextSelector
                value={state[component]}
                onChange={(e) => {
                  notifyStateIsDirty();
                  setState({ [component]: e.target.value });
                }}
              />
            </div>
          );
        } else if (component === "collection1" || component === "collection2") {
          return (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <CollectionSelector
                context={
                  state[
                    init[component]?.context || contextFromCollection(component)
                  ]
                }
                value={state[component]}
                onChange={(e) => {
                  notifyStateIsDirty();
                  setState({ [component]: e.target.value });
                }}
                disabled={saveData !== undefined}
              />
            </div>
          );
        } else if (component === "attribute1" || component === "attribute2") {
          return (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <AttributeSelector
                context={
                  state[
                    init[component]?.context || contextFromAttribute(component)
                  ]
                }
                value={state[component]}
                onChange={(s) => {
                  notifyStateIsDirty();
                  setState({ [component]: s });
                }}
                disabled={saveData !== undefined}
              />
            </div>
          );
        } else if (
          component === "attributeSet1" ||
          component === "attributeSet2"
        ) {
          return (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <MultiAttributeSelector
                context={
                  state[
                    init[component]?.context ||
                      contextFromAttributeSet(component)
                  ]
                }
                setSelected={(s) => {
                  notifyStateIsDirty();
                  setState({ [component]: s });
                }}
                selected={state[component]}
                disabled={saveData !== undefined}
              />
            </div>
          );
        } else if (component === "textInput1" || component === "textInput2") {
          return (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <TextInput
                value={state[component]}
                onChange={(e) => setState({ [component]: e.target.value })}
                disabled={saveData !== undefined}
                onBlur={notifyStateIsDirty}
              />
            </div>
          );
        } else if (component === "dropdown1" || component === "dropdown2") {
          const tmp = init[component];
          return tmp && tmp.options && tmp.defaultValue ? (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <Select
                onChange={(e) => {
                  notifyStateIsDirty();
                  setState({ [component]: e.target.value });
                }}
                options={tmp.options}
                value={state[component]}
                defaultValue={tmp.defaultValue}
                disabled={saveData !== undefined}
              />
            </div>
          ) : (
            `${component} used but undefined`
          );
        } else if (
          component === "typeContract1" ||
          component === "typeContract2"
        ) {
          const tmp = init[component];
          return tmp && tmp.outputTypes && tmp.inputTypes ? (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <TypeSelector
                inputTypes={tmp.inputTypes}
                selectedInputType={state[component].outputType}
                inputTypeOnChange={(e) => {
                  notifyStateIsDirty();
                  setState({
                    [component]: {
                      inputType: e.target.value,
                      outputType: state[component].outputType,
                    },
                  });
                }}
                inputTypeDisabled={
                  init[component]?.inputTypeDisabled || saveData !== undefined
                }
                outputTypes={tmp.outputTypes}
                selectedOutputType={state[component].outputType}
                outputTypeOnChange={(e) => {
                  notifyStateIsDirty();
                  setState({
                    [component]: {
                      inputType: state[component].inputType,
                      outputType: e.target.value,
                    },
                  });
                }}
                outputTypeDisabled={
                  init[component]?.outputTypeDisabled || saveData !== undefined
                }
              />
            </div>
          ) : (
            `${component} used but undefined`
          );
        } else if (component === "expression1" || component === "expression2") {
          return (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <ExpressionEditor
                value={state[component]}
                onChange={(s) => setState({ [component]: s })}
                attributeNames={attributes[
                  attributeSetFromExpression(component) as
                    | "attributes1"
                    | "attributes2"
                ].map((a) => a.name)}
                disabled={saveData !== undefined}
                onBlur={notifyStateIsDirty}
              />
            </div>
          );
        } else {
          return "UNRECOGNIZED COMPONENT";
        }
      })}
      <div>
        <TransformerSubmitButtons
          onCreate={
            transformerFunction.kind === "fullOverride"
              ? () => transformerFunction.func(props, state)
              : transform
          }
        />
      </div>
      {errorDisplay}
      {saveData === undefined && (
        <TransformerSaveButton base={base} generateSaveData={() => state} />
      )}
    </>
  );
};

export default DataDrivenTransformer;
