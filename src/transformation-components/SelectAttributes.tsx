import React, { useState, useEffect, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  setContextItems,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithDataSet,
  getDataContext,
} from "../utils/codapPhone";
import { useDataContexts, useInput } from "../utils/hooks";
import { selectAttributes } from "../transformations/selectAttributes";

interface SelectAttributesProps {
  setErrMsg: (s: string | null) => void;
}

export function SelectAttributes({
  setErrMsg,
}: SelectAttributesProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, attributesChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );
  const dataContexts = useDataContexts();
  const [lastContextName, setLastContextName] = useState<string | null>(null);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }

      console.log(`Data context to select attributes from: ${inputDataCtxt}`);

      const dataset = {
        collections: (await getDataContext(inputDataCtxt)).collections,
        records: await getDataFromContext(inputDataCtxt),
      };

      // extract attribute names from user's text
      const attributeNames = attributes.split("\n").map((s) => s.trim());

      try {
        console.log("attributes to select:", attributeNames);

        const selected = selectAttributes(dataset, attributeNames);

        console.log("dataset with selected attrs:", selected);

        // if doUpdate is true then we should update a previously created table
        // rather than creating a new one
        if (doUpdate) {
          if (!lastContextName) {
            setErrMsg("Please apply transformation to a new table first.");
            return;
          }

          // TODO: this doesn't update the data context, only the records.
          setContextItems(lastContextName, selected.records);
        } else {
          const [newContext] = await createTableWithDataSet(selected);
          setLastContextName(newContext.name);
        }
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, attributes, lastContextName, setErrMsg]
  );

  useEffect(() => {
    if (inputDataCtxt !== null) {
      addContextUpdateListener(inputDataCtxt, () => {
        transform(true);
      });
      return () => removeContextUpdateListener(inputDataCtxt);
    }
  }, [transform, inputDataCtxt]);

  return (
    <>
      <p>Table to Select Attributes From</p>
      <select
        id="inputDataContext"
        onChange={inputChange}
        defaultValue="default"
      >
        <option disabled value="default">
          Select a Data Context
        </option>
        {dataContexts.map((dataContext) => (
          <option key={dataContext.name} value={dataContext.name}>
            {dataContext.title} ({dataContext.name})
          </option>
        ))}
      </select>

      <p>Attributes to Include in Output (1 per line)</p>
      <textarea onChange={attributesChange}></textarea>

      <br />
      <button onClick={() => transform(false)}>Select attributes!</button>
      <button onClick={() => transform(true)} disabled={!lastContextName}>
        Update previous table
      </button>
    </>
  );
}
