import { DataSet } from "../transformations/types";
import { DataContext } from "../utils/codapPhone/types";
import {
  createTableWithDataSet,
  updateContextWithDataSet,
} from "../utils/codapPhone";

/**
 * This function takes a dataset as well as a `doUpdate` flag and either
 * creates a new table for the dataset or updates an existing one accordingly.
 */
export async function applyNewDataSet(
  dataSet: DataSet,
  name: string | undefined,
  description: string | undefined,
  doUpdate: boolean,
  lastContextName: string | null,
  setLastContextName: (s: string) => void,
  setErrMsg: (s: string | null) => void
): Promise<void> {
  try {
    // if doUpdate is true then we should update a previously created table
    // rather than creating a new one
    if (doUpdate) {
      if (!lastContextName) {
        setErrMsg("Please apply transformation to a new table first.");
        return;
      }
      updateContextWithDataSet(lastContextName, dataSet);
    } else {
      const [newContext] = await createTableWithDataSet(dataSet, name, description);
      setLastContextName(newContext.name);
    }
  } catch (e) {
    setErrMsg(e.message);
  }
}

/**
 * Returns the context's title, if any, or falls back to its name.
 */
export function ctxtTitle(context: DataContext): string {
  return context.title ? context.title : context.name;
}
