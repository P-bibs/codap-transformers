import { DataSet } from "../transformers/types";
import { DataContext } from "../utils/codapPhone/types";
import {
  createTableWithDataSet,
  updateContextWithDataSet,
  addContextUpdateListener,
  updateText,
} from "../utils/codapPhone";

/**
 * This function takes a dataset as well as a `doUpdate` flag and either
 * creates a new table for the dataset or updates an existing one accordingly.
 *
 * @returns The name of the newly created context.
 */
export async function applyNewDataSet(
  dataSet: DataSet,
  name: string | undefined,
  description: string | undefined
): Promise<string> {
  // if doUpdate is true then we should update a previously created table
  // rather than creating a new one
  const [newContext] = await createTableWithDataSet(dataSet, name, description);
  return newContext.name;
}

/**
 * Returns the context's title, if any, or falls back to its name.
 *
 * @param context the data context to produce a readable name for
 * @returns readable name of the context
 */
export function readableName(context: DataContext): string {
  return context.title ? context.title : context.name;
}

/**
 * If the given name contains spaces, this will add parentheses
 * to it, to keep it readable as a unit. Otherwise, returns
 * the name unchanged.
 *
 * @param name the name to parenthesize
 * @returns the input name, with parentheses added or not
 */
export function parenthesizeName(name: string): string {
  return name.includes(" ") ? `(${name})` : name;
}

/**
 * Set up a listener to update `outputContext` when `inputContext` changes.
 *
 * @param inputContext - The input context
 * @param outputContext - The context to update
 * @param doTransform - A transformer function that returns the result
 * dataset
 * @param setErrMsg - A function that displays the error message to the user
 */
export function addUpdateListener(
  inputContext: string,
  outputContext: string,
  doTransform: () => Promise<[DataSet, string, string]>,
  setErrMsg: (msg: string | null) => void,
  extraDeps: string[] = []
): void {
  addContextUpdateListener(
    inputContext,
    [outputContext, ...extraDeps],
    async () => {
      setErrMsg(null);
      try {
        const [transformed] = await doTransform();
        updateContextWithDataSet(outputContext, transformed);
      } catch (e) {
        setErrMsg(`Error updating ${outputContext}: ${e.message}`);
      }
    }
  );
}

export function addUpdateTextListener(
  inputContext: string,
  textName: string,
  doTransform: () => Promise<[number, string, string]>,
  setErrMsg: (msg: string) => void,
  extraDeps: string[] = []
): void {
  addContextUpdateListener(inputContext, [textName, ...extraDeps], async () => {
    try {
      const [result] = await doTransform();
      updateText(textName, String(result));
    } catch (e) {
      setErrMsg(`Error updating ${textName}: ${e.message}`);
    }
  });
}

export function allAttributesFromContext(context: DataContext): string[] {
  return context.collections.flatMap((c) =>
    c.attrs ? c.attrs.map((a) => a.name) : []
  );
}
