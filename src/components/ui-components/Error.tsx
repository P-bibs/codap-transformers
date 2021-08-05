import { ArrowLeft, ArrowRight, Close } from "@material-ui/icons";
import React, { ReactElement, useCallback, useState } from "react";
import { useEffect } from "react";
import { useReducer } from "react";
import { useMemo } from "react";
import { notifyInteractiveFrameWithSelect } from "../../lib/codapPhone";
import "./styles/Error.css";

// Messages over this length (in chars) will be cut off. The full message can
// be read by hitting "read more"
const ERROR_MESSAGE_CUTOFF_LENGTH = 100;

type ErrorProps = {
  store: ErrorStore;
  setErrMsg: (err: string | null, id: number) => void;
};
type ErrorStore = [number, string][];

/**
 * Error represents a set of error messages to be shown to the user
 * within the plugin.
 */
function Error({ store, setErrMsg }: ErrorProps): ReactElement {
  const length = store.length;
  const [index, unsafeSetIndex] = useState(0);
  const [displayFullMessage, setDisplayFullMessage] = useState(false);

  /**
   * A safe wrapper around `unsafeSetIndex` that ensures the index always stays
   * within valid bounds.
   * It can accept either a setter function or a raw value.
   */
  const setIndex = useCallback(
    (setterOrValue: number | ((prevIndex: number) => number)): void => {
      // Show the short error message whenever the index changes
      setDisplayFullMessage(false);

      if (typeof setterOrValue === "number") {
        unsafeSetIndex(Math.max(0, Math.min(length - 1, setterOrValue)));
      } else {
        unsafeSetIndex((index) =>
          Math.max(0, Math.min(length - 1, setterOrValue(index)))
        );
      }
    },
    [length]
  );

  // If the store gets a new error then we should show that error (it will be
  // the last element therefore we set index to length - 1)
  useEffect(() => {
    if (store.length > 0) {
      unsafeSetIndex(length - 1);
    }
  }, [store, length, setIndex]);

  // "show less" if all error messages are cleared
  useEffect(() => {
    if (length === 0 && displayFullMessage === true) {
      setDisplayFullMessage(false);
    }
  }, [length, displayFullMessage]);

  // Don't display anything if there are no errors
  if (length === 0) {
    return <></>;
  }

  // Make sure the index never goes out of range
  if (index < 0 || index >= length) {
    // setIndex takes care of boxing the index to a valid range so we can just
    // provide the identity function
    setIndex((index) => index);
  }

  // Deletes from the store the error that's currently displayed
  const deleteItemAtCurrentIndex = () => {
    const [id] = store[index];
    setErrMsg(null, id);
  };

  /**
   * Renders the error message, possibly truncating and including a "read more"
   * button if necessary
   */
  const renderErrorText = () => {
    const safeIndex = Math.max(0, Math.min(length - 1, index));
    const [, message] = store[safeIndex];

    if (displayFullMessage || message.length < ERROR_MESSAGE_CUTOFF_LENGTH) {
      return <p>{message}</p>;
    } else {
      return (
        <>
          <p>{`${message.substr(0, ERROR_MESSAGE_CUTOFF_LENGTH)}... `}</p>
          <p className="read-more" onClick={() => setDisplayFullMessage(true)}>
            read more
          </p>
        </>
      );
    }
  };

  const leftArrowDisabled = index <= 0;
  const rightArrowDisabled = index >= length - 1;
  return (
    <div className="Error">
      <div className="error-index-display">
        <div className="error-index-pager">
          <span
            className={
              "error-index-arrow" + (leftArrowDisabled ? " disabled" : "")
            }
            onClick={() => !leftArrowDisabled && setIndex((index) => index - 1)}
          >
            {<ArrowLeft />}
          </span>
          <span>
            {index + 1} of {length}
          </span>
          <span
            className={
              "error-index-arrow" + (rightArrowDisabled ? " disabled" : "")
            }
            onClick={() =>
              !rightArrowDisabled && setIndex((index) => index + 1)
            }
          >
            {<ArrowRight />}
          </span>
        </div>
        <div className="close-error">
          <Close onClick={deleteItemAtCurrentIndex} />
        </div>
      </div>
      {renderErrorText()}
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
  ErrorStore,
  (error: string | null, id: number) => void
] {
  // The store is a plane piece of state that uses a reducer to make it easier
  // to add and delete items in the object. The `setStore` function is never exposed to the
  // user of the hook. They get the wrapped version below instead.
  const [store, setStore] = useReducer(
    (oldState: ErrorStore, action: ErrorStoreActions): ErrorStore => {
      switch (action.type) {
        case "add":
          // Remove old error with this id (if present) and add new one
          return oldState
            .filter(([key]) => key !== action.id)
            .concat([[action.id, action.error]]);
        case "delete": {
          return oldState.filter(([key]) => key !== action.id);
        }
      }
    },
    []
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
export function useErrorSetterId(deps?: unknown[]): number {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => genErrorSetterId(), deps || []);
}

export const genErrorSetterId = (() => {
  let id = 0;
  return () => id++;
})();
