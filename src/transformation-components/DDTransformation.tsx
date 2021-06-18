import React, { useReducer, useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useAttributes, useInput } from "../utils/hooks";
import { compare, CompareType } from "../transformations/compare";
import { DataSet } from "../transformations/types";
import {
  CodapFlowSelect,
  AttributeSelector,
  ContextSelector,
  TransformationSubmitButtons,
  CollectionSelector,
  MultiAttributeSelector,
  CodapFlowTextInput,
  TypeSelector,
  ExpressionEditor,
} from "../ui-components";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

type ContextInit = {
  title?: string;
};

type CollectionInit = {
  title?: string;
};

type AttributeInit = {
  title?: string;
};

type AttributeSetInit = {
  title?: string;
};

type TextInputInit = {
  title?: string;
};

type DropdownInit = {
  title?: string;
  defaultValue: string;
  options: {
    title: string;
    value: string;
  }[];
};

type ExpressionInit = {
  title?: string;
};

type TypeContractInit = {
  title?: string;
  inputTypes: string[];
  inputTypeDisabled?: boolean;
  outputTypes: string[];
  outputTypeDisabled?: boolean;
};

export type DDTransformationInit = {
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

type ContextState = string | null;

type CollectionState = string | null;

type AttributeState = string | null;

type AttributeSetState = string[];

type TextInputState = string;

type DropdownState = string | null;

type ExpressionState = string;

type TypeContractState = {
  inputType: string;
  outputType: string;
};
export type DDTransformationState = {
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

type DDTransformationProps = {
  name: string;
  title?: string;
  order?: (keyof DDTransformationInit)[];
  init: DDTransformationInit;
  initialState: Partial<DDTransformationState>;
};

const DEFAULT_ORDER: (keyof DDTransformationInit)[] = [
  "context1",
  "context2",
  "collection1",
  "collection2",
  "attribute1",
  "attribute2",
  "attributeSet1",
  "attributeSet2",
  "textInput1",
  "textInput2",
  "dropdown1",
  "dropdown2",
  "expression1",
  "expression2",
  "typeContract1",
  "typeContract2",
];

const DEFAULT_STATE: DDTransformationState = {
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

const contextFromCollection = (collection: string) =>
  convertNames(collection, "collection", "context");

const contextFromAttribute = (attribute: string) =>
  convertNames(attribute, "attribute", "context");

const contextFromAttributeSet = (attributeSet: string) =>
  convertNames(attributeSet, "attributeSet", "context");

const attributeFromExpression = (expression: string) =>
  convertNames(expression, "expression", "context");

const convertNames = (
  sourceName: string,
  sourceNameRoot: string,
  destinationNameRoot: string
) => destinationNameRoot + sourceName.slice(sourceNameRoot.length);

const titleFromComponent = (
  component: keyof DDTransformationInit,
  init: DDTransformationInit
): ReactElement => {
  const tmp = init[component];
  return tmp && tmp.title ? <h3>tmp.title</h3> : <></>;
};

const DDTransformation = ({
  title,
  name,
  order,
  init,
  initialState,
}: DDTransformationProps): ReactElement => {
  const [state, setState] = useReducer(
    (
      oldState: DDTransformationState,
      newState: Partial<DDTransformationState>
    ): DDTransformationState => ({ ...oldState, ...newState }),
    { ...DEFAULT_STATE, ...initialState }
  );

  if (order === undefined) {
    order = DEFAULT_ORDER;
  }

  const attributes = {
    attributes1: useAttributes(state["context1"]),
    attributes2: useAttributes(state["context2"]),
  };

  return (
    <>
      {order.map((component) => {
        if (component === "context1" || component === "context2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <ContextSelector
                value={state[component]}
                onChange={(e) => {
                  setState({ [component]: e.target.value });
                }}
              />
            </>
          );
        } else if (component === "collection1" || component === "collection2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <CollectionSelector
                context={contextFromCollection(component)}
                value={component}
                onChange={(e) => setState({ [component]: e.target.value })}
              />
            </>
          );
        } else if (component === "attribute1" || component === "attribute2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <AttributeSelector
                context={contextFromAttribute(component)}
                value={state[component]}
                onChange={(s) => setState({ [component]: s })}
              />
            </>
          );
        } else if (
          component === "attributeSet1" ||
          component === "attributeSet2"
        ) {
          return (
            <>
              {titleFromComponent(component, init)}
              <MultiAttributeSelector
                context={contextFromAttributeSet(component)}
                setSelected={(s) => setState({ [component]: s })}
                selected={state[component]}
              />
            </>
          );
        } else if (component === "textInput1" || component === "textInput2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <CodapFlowTextInput
                value={state[component]}
                onChange={(e) => setState({ [component]: e.target.value })}
              />
            </>
          );
        } else if (component === "dropdown1" || component === "dropdown2") {
          const tmp = init[component];
          return tmp && tmp.options && tmp.defaultValue ? (
            <>
              {titleFromComponent(component, init)}
              <CodapFlowSelect
                onChange={(e) => setState({ [component]: e.target.value })}
                options={tmp.options}
                value={state[component]}
                defaultValue={tmp.defaultValue}
              />
            </>
          ) : (
            `${component} used but undefined`
          );
        } else if (
          component === "typeContract1" ||
          component === "typeContract2"
        ) {
          const tmp = init[component];
          return tmp && tmp.outputTypes && tmp.inputTypes ? (
            <>
              {titleFromComponent(component, init)}
              <TypeSelector
                inputTypes={tmp.inputTypes}
                selectedInputType={state[component].outputType}
                inputTypeOnChange={(e) => {
                  setState({ [component]: e.target.value });
                }}
                inputTypeDisabled={init[component]?.inputTypeDisabled}
                outputTypes={tmp.outputTypes}
                selectedOutputType={state[component].outputType}
                outputTypeOnChange={(e) => {
                  setState({ [component]: e.target.value });
                }}
                outputTypeDisabled={init[component]?.outputTypeDisabled}
              />
            </>
          ) : (
            `${component} used but undefined`
          );
        } else if (component === "expression1" || component === "expression2") {
          return (
            <>
              {titleFromComponent(component, init)}
              <ExpressionEditor
                value={state[component]}
                onChange={(s) => setState({ [component]: s })}
                attributeNames={attributes[
                  attributeFromExpression(component) as
                    | "attributes1"
                    | "attributes2"
                ].map((a) => a.name)}
              />
            </>
          );
        } else {
          return "UNRECOGNIZED COMPONENT";
        }
      })}
    </>
  );
};

export default DDTransformation;
