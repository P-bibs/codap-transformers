import React, { ReactElement, useState } from "react";
import Transformation from "./Transformation";
import { SavedTransformation } from "./transformation-components/types";
import { initPhone } from "./utils/codapPhone";
import "./App.css";

export const App = (): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);
  const loadingMsg = <p className="loading">Connecting to CODAP...</p>;

  const [initError, setInitError] = useState<boolean>(false);
  const initErrorMsg = (
    <p className="initError">
      Could not connect to CODAP. Please make sure you are using CODAP Flow
      within CODAP.
    </p>
  );

  /**
   * Initializes a new data interactive (plugin) with the given name,
   * and turns off loading once it has succeeded, or indicates an
   * error should be displayed if it fails.
   */
  const initWithPluginName = (name: string): void => {
    initPhone(name)
      .then(() => {
        setLoading(false);
      })
      .catch(() => {
        setInitError(true);
      });
  };

  const parsedUrl = new URL(window.location.href);
  const transformation = parsedUrl.searchParams.get("transform");
  let pluginContent: JSX.Element;

  if (transformation === null) {
    initWithPluginName("CODAP Flow");
    pluginContent = <Transformation />;
  } else {
    const parsedTransformation: SavedTransformation = JSON.parse(
      decodeURIComponent(transformation)
    );

    initWithPluginName(parsedTransformation.name);
    pluginContent = <Transformation transformation={parsedTransformation} />;
  }

  if (initError) {
    return initErrorMsg;
  } else if (loading) {
    return loadingMsg;
  } else {
    return pluginContent;
  }
};
