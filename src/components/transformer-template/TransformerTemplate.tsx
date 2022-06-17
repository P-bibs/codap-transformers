/* eslint-disable @typescript-eslint/no-empty-interface */
import React, { useReducer, ReactElement, useEffect, useState } from "react";
import {
  createText,
  getInteractiveFrame,
  notifyInteractiveFrameIsDirty,
  deleteDataContext,
  getDataContext,
} from "../../lib/codapPhone";
import { useAttributes } from "../../lib/utils/hooks";
import {
  CodapLanguageType,
  TransformationOutput,
  FullOverrideSaveState,
  MISSING_VALUE_SCARE_SYMBOL,
  MISSING_VALUE_WARNING,
} from "../../transformers/types";
import {
  Select,
  AttributeSelector,
  ContextSelector,
  CollectionSelector,
  MultiAttributeSelector,
  TextInput,
  TextArea,
  TypeSelector,
  ExpressionEditor,
} from "../ui-components";
import { applyNewDataSet, createMVRDisplay } from "./util";
import {
  DatasetCreatorTransformerName,
  BaseTransformerName,
} from "../../transformerList";
import {
  addInteractiveStateRequestListener,
  removeInteractiveStateRequestListener,
} from "../../lib/codapPhone/listeners";
import { InteractiveState } from "../../lib/codapPhone/types";
import { pushToUndoStack } from "../../lib/codapPhone/listeners";
import {
  TransformationOutputType,
  SafeActiveTransformationsDispatch,
  ActionTypes as ActiveTransformationActionTypes,
} from "../../transformerStore/types";
import { displaySingleValue, tryTitle } from "../../transformers/util";
import { makeDatasetImmutable } from "../../transformers/util";
import "./styles/TransformerTemplate.css";
import DefinitionCreator from "./DefinitionCreator";
import { genErrorSetterId, useErrorSetterId } from "../ui-components/Error";

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

interface ToggleDropdownInit extends ComponentInit {
  defaultValue: string;
  options: Record<
    string,
    {
      title: string;
      componentsHidden: string[];
    }
  >;
}

interface NameInit {
  placeholder?: string;
}

interface ExpressionInit extends ComponentInit {
  placeholder?: string;
}

interface TypeContractInit extends ComponentInit {
  inputTypes: string[] | string;
  inputTypeDisabled?: boolean;
  outputTypes: readonly string[] | string;
  outputTypeDisabled?: boolean;
}
interface PurposeStatementInit {
  placeholder: string;
}
export type TransformerTemplateInit = {
  toggle?: ToggleDropdownInit;
  name?: NameInit;
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
  purposeStatement?: PurposeStatementInit;
};

// All the state types for different UI elements
type ContextState = string | null;
type CollectionState = string | null;
type AttributeState = string | null;
type AttributeSetState = string[];
type TextInputState = string;
type DropdownState = string | null;
type ToggleDropdownState = string | null;
type ExpressionState = string;
type TypeContractState = {
  inputType: CodapLanguageType;
  outputType: CodapLanguageType;
};
export type TransformerTemplateState = {
  name: string;
  toggle: ToggleDropdownState;
  purposeStatement: string;
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

const DEFAULT_STATE: TransformerTemplateState = {
  name: "",
  toggle: null,
  purposeStatement: "",
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
  typeContract1: { inputType: "Any", outputType: "Any" },
  typeContract2: { inputType: "Any", outputType: "Any" },
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

type ComponentWithTitle = Exclude<
  keyof TransformerTemplateInit,
  "purposeStatement" | "name"
>;

/**
 * Makes a header from a ui component's title
 */
const titleFromComponent = (
  component: ComponentWithTitle,
  init: TransformerTemplateInit
): ReactElement => {
  const tmp = init[component];
  return tmp && tmp.title ? <h3>{tmp.title}</h3> : <></>;
};

/**
 * Makes an italicized paragraph element from a ui component's title.
 * This is used for displaying prompts for formulas.
 */
const displayExpressionPrompt = (
  component: ComponentWithTitle,
  init: TransformerTemplateInit,
  state: TransformerTemplateState
): ReactElement => {
  const tmp = init[component];

  if (tmp && tmp.title) {
    let rawPrompt = tmp.title;

    // Loop through each key of the state object to see if we need to splice
    // one of these values into the expression prompt
    let key: keyof typeof state;
    for (key in state) {
      const value = state[key];

      // Replace substrings of the form {attribute1} eg. with the corresponding
      // state value. If no state exists yet, use an underscore.
      rawPrompt = rawPrompt.replace(
        "{" + key + "}",
        value === null || value === "" ? "____" : value.toString()
      );
    }

    const processedPrompt = rawPrompt;
    return (
      <p className="expression-prompt">
        <i>{processedPrompt}</i>
      </p>
    );
  }
  return <></>;
};

export interface DatasetCreatorFunction {
  kind: "datasetCreator";
  func: (state: TransformerTemplateState) => Promise<TransformationOutput>;
}

export interface FullOverrideFunction {
  kind: "fullOverride";
  createFunc: (
    props: TransformerTemplateProps,
    state: TransformerTemplateState,
    errorId: number
  ) => Promise<void>;
  updateFunc: (
    state: FullOverrideSaveState,
    editedOutputs: Set<string>
  ) => Promise<{
    extraDependencies?: string[];
    state?: Partial<FullOverrideSaveState>;
  }>;
}

export type TransformFunction = DatasetCreatorFunction | FullOverrideFunction;

export type TransformerTemplateProps = {
  transformerFunction: TransformFunction;
  setErrMsg: (s: string | null, id: number) => void;
  errorDisplay: ReactElement;
  base: BaseTransformerName;
  init: TransformerTemplateInit;
  saveData?: TransformerTemplateState;
  editable: boolean;
  activeTransformationsDispatch: SafeActiveTransformationsDispatch;
};

/**
 * Creates a transformer from a variety of ui elements. Requires a transformer
 * function that consumes state from all ui elements and returns a dataset and a
 * table name for a new context. Also requires an `init` object that has details on
 * which ui elements to include in the transformer and how to configure them.
 *
 * Only UI elements in `init` will be included and they will appear in order.
 */
const TransformerTemplate = (props: TransformerTemplateProps): ReactElement => {
  const {
    transformerFunction,
    init,
    base,
    saveData,
    editable,
    errorDisplay,
    setErrMsg,
    activeTransformationsDispatch,
  } = props;

  // Refresh the errorId when the transformer changes
  const errorId = useErrorSetterId();

  const [loading, setLoading] = useState<boolean>(false);

  const [state, setState] = useReducer(
    (
      oldState: TransformerTemplateState,
      newState: Partial<TransformerTemplateState>
    ): TransformerTemplateState => {
      return { ...oldState, ...newState };
    },
    saveData !== undefined ? saveData : DEFAULT_STATE
  );

  // Load saved state from CODAP memory
  useEffect(() => {
    async function fetchSavedState() {
      const savedState = (await getInteractiveFrame()).savedState;
      if (savedState && savedState.DDTransformation) {
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
      const defaultState = { ...DEFAULT_STATE };

      // Must initialize toggle. The transformer must be in one of the toggle
      // states at a time, and if no options are chosen, the transformer will be
      // in an impossible state. E.g. both sorting by attribute and sorting by
      // expression.
      if (init.toggle) {
        defaultState.toggle = init.toggle.defaultValue;
      }
      setState(defaultState);
      setErrMsg(null, errorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setErrMsg(null, errorId);

    const doTransform: () => Promise<TransformationOutput> = async () => {
      if (transformerFunction.kind !== "datasetCreator") {
        throw new Error("Improper transformationFunction supplied");
      }
      // Might throw an error, which we handle in the below try/catch block
      return await transformerFunction.func(state);
    };

    try {
      const [result, name, description, mvr] = await doTransform();

      // Ensure user wants to go through with computation if MVR non-empty
      if (mvr.missingValues.length > 0 && !confirm(MISSING_VALUE_WARNING)) {
        return;
      }

      // Add scare symbol to output if MVR is non-empty
      const markedName =
        mvr.missingValues.length > 0
          ? `${name} ${MISSING_VALUE_SCARE_SYMBOL}`
          : name;

      const inputContexts: string[] = [];
      for (const i of ["1", "2"]) {
        const contextKey = ("context" + i) as "context1" | "context2";
        const contextName = state[contextKey];
        if (order.includes(contextKey) && contextName !== null) {
          inputContexts.push(contextName);
        }
      }

      // Determine whether the transformerFunction returns a textbox or a table
      if (typeof result === "number" || Array.isArray(result)) {
        // This is the case where the transformer returns a single value
        const textName = await createText(
          markedName,
          displaySingleValue(result)
        );

        activeTransformationsDispatch({
          type: ActiveTransformationActionTypes.ADD,
          newTransformation: {
            inputs: inputContexts,
            extraDependencies: [textName],
            outputType: TransformationOutputType.TEXT,
            output: textName,
            transformer: base as DatasetCreatorTransformerName,
            state,
            errorId: genErrorSetterId(),
          },
        });

        if (mvr.missingValues.length > 0) {
          await createMVRDisplay(mvr, textName);
        }
      } else if (typeof result === "object") {
        // This is the case where the transformation returns a dataset
        const immutableDataset = makeDatasetImmutable(result);
        const newContextName = await applyNewDataSet(
          immutableDataset,
          markedName,
          description
        );

        // Add action to undo stack
        pushToUndoStack(
          `Undo ${base} Transformer`,
          () => deleteDataContext(newContextName),
          transform
        );

        activeTransformationsDispatch({
          type: ActiveTransformationActionTypes.ADD,
          newTransformation: {
            inputs: inputContexts,
            extraDependencies: [newContextName],
            outputType: TransformationOutputType.CONTEXT,
            output: newContextName,
            transformer: base as DatasetCreatorTransformerName,
            state,
            errorId: genErrorSetterId(),
          },
        });

        if (mvr.missingValues.length > 0) {
          const ctxt = await getDataContext(newContextName);
          const outputName = tryTitle(ctxt);
          await createMVRDisplay(mvr, outputName);
        }
      }
    } catch (e) {
      setErrMsg((e as Error).message, errorId);
    }
  };

  return (
    <>
      {order.map((component) => {
        if (
          init.toggle &&
          state.toggle &&
          init.toggle.options[state.toggle].componentsHidden.includes(component)
        ) {
          return <></>;
        }
        if (component === "name") {
          if (saveData !== undefined) {
            // Saved transformers have custom name displays. No need to render
            // this.
            return <></>;
          }
          return (
            <div className="input-group">
              <h3>Transformer Name</h3>
              <TextInput
                value={state.name}
                onChange={(e) => {
                  setState({ name: e.target.value });
                }}
                placeholder={init[component]?.placeholder || "Transformer Name"}
                className="saved-transformer-name"
                onBlur={notifyStateIsDirty}
              />
            </div>
          );
        } else if (component === "context1" || component === "context2") {
          return (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <ContextSelector
                value={state[component]}
                onChange={(context) => {
                  notifyStateIsDirty();
                  setState({ [component]: context });
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
                disabled={!editable}
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
                disabled={!editable}
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
                disabled={!editable}
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
                disabled={!editable}
                onBlur={notifyStateIsDirty}
              />
            </div>
          );
        } else if (component === "toggle") {
          const tmp = init[component];
          return tmp ? (
            <div className="input-group">
              {titleFromComponent(component, init)}
              <select
                onChange={(e) => {
                  notifyStateIsDirty();
                  setState({ [component]: e.target.value });
                }}
                // Safe cast, since we ensure that toggle state is initialized.
                // Otherwise, the component exists in an impossible state.
                value={state[component] as string}
                disabled={!editable}
              >
                {Object.entries(tmp.options).map(([key, values]) => (
                  <option key={key} value={key}>
                    {values.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            `${component} used but undefined`
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
                disabled={!editable}
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
                  init[component]?.inputTypeDisabled || !editable
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
                  init[component]?.outputTypeDisabled || !editable
                }
              />
            </div>
          ) : (
            `${component} used but undefined`
          );
        } else if (component === "expression1" || component === "expression2") {
          return (
            <div className="input-group">
              {displayExpressionPrompt(component, init, state)}
              <ExpressionEditor
                value={state[component]}
                placeholder={init[component]?.placeholder || "Expression"}
                onChange={(s) => setState({ [component]: s })}
                attributeNames={attributes[
                  attributeSetFromExpression(component) as
                    | "attributes1"
                    | "attributes2"
                ].map((a) => a.name)}
                disabled={!editable}
                onBlur={notifyStateIsDirty}
              />
            </div>
          );
        } else if (component === "purposeStatement") {
          return (
            <div className="input-group">
              <h3>Purpose Statement</h3>
              <TextArea
                value={state.purposeStatement}
                onChange={(e) => setState({ purposeStatement: e.target.value })}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                placeholder={init.purposeStatement!.placeholder}
                className="purpose-statement"
                onBlur={notifyStateIsDirty}
                disabled={!editable}
              />
            </div>
          );
        } else {
          return "UNRECOGNIZED COMPONENT";
        }
      })}
      <div>
        <button
          id="applyTransformer"
          disabled={loading}
          className={loading ? "loading" : ""}
          onClick={() => {
            // disable the button while the transformer is running
            if (loading) return;

            setLoading(true);
            transformerFunction.kind === "fullOverride"
              ? transformerFunction
                  .createFunc(props, state, errorId)
                  .then(() => setLoading(false))
              : transform().then(() => setLoading(false));
          }}
        >
          Apply Transformer
        </button>
      </div>
      {errorDisplay}
      {saveData === undefined && (
        <DefinitionCreator base={base} generateSaveData={() => state} />
      )}
    </>
  );
};

export default TransformerTemplate;
