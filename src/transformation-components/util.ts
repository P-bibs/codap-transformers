import { CaseMap, DataSet } from "../transformations/types";
import { DataContext } from "../utils/codapPhone/types";
import {
  createTableWithDataSet,
  updateContextWithDataSet,
  addContextUpdateListener,
  updateText,
  addSelectionListener,
  convertToChildmost,
  createSelectionList,
} from "../utils/codapPhone";

/**
 * This function takes a dataset as well as a `doUpdate` flag and either
 * creates a new table for the dataset or updates an existing one accordingly.
 *
 * @returns The name of the newly created context.
 */
export async function applyNewDataSet(
  dataSet: DataSet,
  name: string | undefined
): Promise<string> {
  // if doUpdate is true then we should update a previously created table
  // rather than creating a new one
  const [newContext] = await createTableWithDataSet(dataSet, name);
  return newContext.name;
}

/**
 * Returns the context's title, if any, or falls back to its name. Also
 * adds parentheses around the name if it determines the name
 * is not a single word.
 *
 * @param context the data context to produce a readable name for
 * @returns readable name of the context
 */
export function readableName(context: DataContext): string {
  return parenthesizeName(context.title ? context.title : context.name);
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
 * @param doTransform - A transformation function that returns the result
 * dataset
 * @param setErrMsg - A function that displays the error message to the user
 */
export function addUpdateListener(
  inputContext: string,
  outputContext: string,
  doTransform: () => Promise<[DataSet, string]>,
  setErrMsg: (msg: string | null) => void
): void {
  addContextUpdateListener(inputContext, async () => {
    setErrMsg(null);
    try {
      const [transformed] = await doTransform();
      updateContextWithDataSet(outputContext, transformed);
    } catch (e) {
      setErrMsg(`Error updating ${outputContext}: ${e.message}`);
    }
  });
}

export function addUpdateTextListener(
  inputContext: string,
  textName: string,
  doTransform: () => Promise<[number, string]>,
  setErrMsg: (msg: string) => void
): void {
  addContextUpdateListener(inputContext, async () => {
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

/**
 * Sets up a listener for case selection notifications that converts
 * selected IDs to childmost IDs, translates these into IDs in output contexts,
 * and then updates the selection lists of these output contexts accordingly.
 */
export function setupSelectionListener(
  inContext: string,
  parentToChildMap: Record<number, Set<number>>,
  idMap: CaseMap
): void {
  console.log(`Setting up selection listener for context ${inContext}`);

  addSelectionListener(inContext, (cases) => {
    const ids = cases.map((c) => c.id);
    const childmostIDs = convertToChildmost(ids, parentToChildMap);
    const updatedSelections: Record<string, number[]> = {};

    for (const id of childmostIDs) {
      // map to IDs from output contexts
      const translated = idMap.get(inContext)?.get(id);

      // some cases may have no corresponding output cases
      if (translated === undefined) {
        continue;
      }

      // add output contexts/IDs to collection of output contexts that need updating
      for (const [outContext, outIDs] of translated) {
        if (updatedSelections[outContext] === undefined) {
          updatedSelections[outContext] = [];
        }
        updatedSelections[outContext] =
          updatedSelections[outContext].concat(outIDs);
      }
    }

    // apply the new selection lists to the updated output contexts
    for (const [outContext, outIDs] of Object.entries(updatedSelections)) {
      // FIXME: check if we are making a no-op update and abort

      console.log(
        `Updating selection list of ${outContext} to be ${outIDs.join(", ")}`
      );
      createSelectionList(outContext, outIDs);
    }
  });
}

/**
 * Constructs the identity index map for a single input and output context.
 * The identity map maps the records of inContext one-to-one to the records
 * of outContext. I.e. every entry in the case map looks like:
 *
 *    [inContext, i] => [[outContext, [i]]]
 */
export function identityIndexMap(
  inContext: string,
  inDataset: DataSet,
  outContext: string,
  outDataset: DataSet
): CaseMap {
  if (inDataset.records.length !== outDataset.records.length) {
    throw new Error(
      `Tried to construct identity index map for datasets with differing number of cases`
    );
  }
  const indexMap: CaseMap = new Map();
  const mapForInContext = new Map();
  inDataset.records.forEach((record, i) => {
    // map the ith record of inContext to *only* the ith record of outContext
    mapForInContext.set(i, [[outContext, [i]]]);
  });
  indexMap.set(inContext, mapForInContext);

  return indexMap;
}
