import React, { ReactElement } from "react";
import "./Error.css";

type ErrorProps = {
  message: string | null;
};

/**
 * Error represents an error message to be shown to the user
 * within the plugin.
 */
function Error(props: ErrorProps): ReactElement {
  // render only if the error message is non-null
  return props.message === null ? (
    <></>
  ) : (
    <div className="Error">
      <p>
        <b>{props.message}</b>
      </p>
    </div>
  );
}

export default Error;
