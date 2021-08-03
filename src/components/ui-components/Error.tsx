import { ArrowLeft, ArrowRight, Close } from "@material-ui/icons";
import React, { ReactElement, useState } from "react";
import { useReducer } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { notifyInteractiveFrameWithSelect } from "../../lib/codapPhone";
import "./styles/Error.css";

type ErrorProps = {
  store: Record<number, string>;
  setErrMsg: (err: string | null, id: number) => void;
};

/**
 * Error represents a set of error messages to be shown to the user
 * within the plugin.
 */
function Error({ store, setErrMsg }: ErrorProps): ReactElement {
  const length = Object.keys(store).length;
  const [index, setIndex] = useState(0);

  // Make sure the index never goes out of range
  useEffect(() => {
    setIndex((index) => Math.max(0, Math.min(length - 1, index)));
  }, [store, length]);

  // Deletes from store the error that's currently displayed
  const deleteItemAtCurrentIndex = () => {
    const entry = Object.entries(store)[index];
    const id: number = parseFloat(entry[0]);
    setErrMsg(null, id);
  };

  return length === 0 ? (
    <></>
  ) : (
    <div className="Error">
      <p>
        {/* Only render error if index is valid */}
        {Object.entries(store)[index] ? Object.entries(store)[index][1] : ""}
      </p>
      <div className="error-index-display">
        <Close
          style={{ cursor: "pointer" }}
          onClick={deleteItemAtCurrentIndex}
        />
        <div className="error-index-pager">
          <span
            className={"error-index-arrow" + (index <= 0 ? " disabled" : "")}
            onClick={() => setIndex(Math.max(0, index - 1))}
          >
            {<ArrowLeft />}
          </span>
          <span>
            {index + 1} of {length}
          </span>
          <span
            className={
              "error-index-arrow" + (index >= length - 1 ? " disabled" : "")
            }
            onClick={() => setIndex((index) => Math.min(length - 1, index + 1))}
          >
            {<ArrowRight />}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Error;

type ErrorStoreActions =
  | { type: "add"; id: number; error: string }
  | { type: "delete"; id: number };

/**
 * A hook to create an object that keeps track of the current errors and a
 * setter that allows adding to and deleting from that object
 */
export function useErrorStore(): [
  Record<number, string>,
  (error: string | null, id: number) => void
] {
  // The store is a plane piece of state that uses a reducer to make it easier
  // to add and delete items in the object. The `setStore` function is never exposed to the
  // user of the hook. They get the wrapped version below instead.
  const [store, setStore] = useReducer(
    (
      oldState: Record<number, string>,
      action: ErrorStoreActions
    ): Record<number, string> => {
      switch (action.type) {
        case "add":
          return { ...oldState, [action.id]: action.error };
        case "delete":
          delete oldState[action.id];
          return oldState;
      }
    },
    {}
  );

  // We return a wrapped setter that takes an id and ties the error message to that id
  // so it can be cleared in the future
  const setErrMsg = (error: string | null, id: number) => {
    if (error === "" || error === null) {
      setStore({ type: "delete", id });
    } else {
      notifyInteractiveFrameWithSelect();
      setStore({ type: "add", id, error });
    }
  };

  return [store, setErrMsg];
}

/**
 * A hook to generate a new unique id and keep it stable across renders
 */
export function useErrorSetterId(): number {
  return useMemo(() => genErrorSetterId(), []);
}

const genErrorSetterId = (() => {
  let id = 0;
  return () => id++;
})();
