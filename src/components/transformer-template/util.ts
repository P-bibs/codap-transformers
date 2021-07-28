import {
  DataSet,
  MissingValueLocation,
  MissingValueReport,
} from "../../transformers/types";
import { createTableWithDataSet, createText } from "../../lib/codapPhone";

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
 * Converts a location identifying a missing value into a string.
 *
 * @param loc The location to convert
 * @returns A string describing the location
 */
function missingValueLocToString(loc: MissingValueLocation): string {
  return `${loc.itemIndex}, "${loc.attribute}", "${loc.collection}"`;
}

/**
 * Creates a CODAP element that displays the given missing value report
 * with a given name (ensured unique).
 *
 * @param mvr The missing value report to display
 * @param name Base name of the report
 * @returns The actual (unique) name of the generated component.
 */
export async function createMVRDisplay(
  mvr: MissingValueReport,
  name: string
): Promise<string> {
  const locs = mvr.missingValues
    .map((loc) => missingValueLocToString(loc))
    .join("\n");

  const reportContent = [
    mvr.extraInfo ? `${mvr.extraInfo}\n` : "",
    "Missing Values:",
    "Item, Attribute, Collection",
    locs,
  ]
    .filter((s) => s !== "")
    .join("\n");

  // TODO: should this be a table?
  return await createText(name, reportContent);
}
