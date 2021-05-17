import React, { useState, useEffect, useCallback, ReactElement } from "react";
import {
  getDataFromContext,
  setContextItems,
  addContextUpdateListener,
  removeContextUpdateListener,
  createTableWithData,
  getDataContext,
} from "../utils/codapPhone";
import { useAttributes, useCollections, useDataContexts } from "../utils/hooks";
import { diff } from "../transformations/diff";

interface FilterProps {
  setErrMsg: (s: string | null) => void;
}

export function Filter({ setErrMsg }: FilterProps): ReactElement {
  const [inputDataContext, setInputDataContext] = useState<null | string>(null);
  const [inputCollection, setInputCollection] = useState<null | string>(null);
  const [inputAttribute1, setInputAttribute1] = useState<null | string>(null);
  const [inputAttribute2, setInputAttribute2] = useState<null | string>(null);

  const dataContexts = useDataContexts();
  const collections = useCollections(inputDataContext);
  const attributes = useAttributes(inputDataContext, inputCollection);

  const transform = useCallback(async () => {
    if (inputDataContext === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }

    console.log(`Data context to filter: ${inputDataContext}`);

    const dataset = {
      collections: (await getDataContext(inputDataContext)).collections,
      records: await getDataFromContext(inputDataContext),
    };

    // TODO: NOT YET IMPLEMENTED
  }, [
    inputDataContext,
    inputCollection,
    inputAttribute1,
    inputAttribute2,
    setErrMsg,
  ]);

  return (
    <>
      <p>Table to Diff</p>
      <select
        id="inputDataContext"
        onChange={(e) => setInputDataContext(e.target.value)}
      >
        <option selected disabled>
          Select a Data Context
        </option>
        {dataContexts.map((dataContext) => (
          <option key={dataContext.name} value={dataContext.name}>
            {dataContext.title} ({dataContext.name})
          </option>
        ))}
      </select>

      <p>Collection to Diff</p>
      <select
        id="inputCollection"
        onChange={(e) => setInputCollection(e.target.value)}
      >
        <option selected disabled>
          Select a collection
        </option>
        {collections.map((collection) => (
          <option key={collection.name} value={collection.name}>
            {collection.title} ({collection.name})
          </option>
        ))}
      </select>

      <p>First attribute to Diff</p>
      <select
        id="inputAttribute1"
        onChange={(e) => setInputAttribute1(e.target.value)}
      >
        <option selected disabled>
          Select a attribute
        </option>
        {attributes.map((attribute) => (
          <option key={attribute} value={attribute}>
            {attribute}
          </option>
        ))}
      </select>

      <p>Second attribute to Diff</p>
      <select
        id="inputAttribute2"
        onChange={(e) => setInputAttribute2(e.target.value)}
      >
        <option selected disabled>
          Select a attribute
        </option>
        {attributes.map((attribute) => (
          <option key={attribute} value={attribute}>
            {attribute}
          </option>
        ))}
      </select>

      <br />
      <button onClick={() => 1}>Create Diff</button>
    </>
  );
}
