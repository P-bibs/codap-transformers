import React, { ReactElement, useState } from "react";
import SavedDefinitionView from "./views/SavedDefinitionView";
import { SavedTransformer } from "./components/transformer-template/types";
import REPLView from "./views/REPLView";
import { initPhone } from "./lib/codapPhone";
import "./App.css";
import { useEffect } from "react";

export const App = (): ReactElement => {
  type ReadyStatus = "loading" | "ready" | "error";
  const [status, setStatus] = useState<ReadyStatus>("loading");
  const [pluginContent, setPluginContent] = useState<ReactElement>(<></>);

  // On first render, initialize the plugin and parse the URL to see
  // if we need to render a saved transformation
  useEffect(() => {
    /**
     * Initializes a new data interactive (plugin) with the given name,
     * and turns off loading once it has succeeded, or indicates an
     * error should be displayed if it fails.
     */
    const initWithPluginName = (name: string, saved: boolean): void => {
      initPhone(name, saved)
        .then(() => {
          setStatus("ready");
        })
        .catch(() => {
          setStatus("error");
        });
    };

    const parsedUrl = new URL(window.location.href);
    const transformer = parsedUrl.searchParams.get("transform");
    if (transformer === null) {
      initWithPluginName("Transformers", false);
      setPluginContent(<REPLView />);
    } else {
      const parsedTransformer: SavedTransformer = JSON.parse(
        decodeURIComponent(transformer)
      );

      initWithPluginName(`Transformer: ${parsedTransformer.name}`, true);
      setPluginContent(<SavedDefinitionView transformer={parsedTransformer} />);
    }
  }, []);

  if (status === "error") {
    return (
      <p className="initError">
        Could not connect to CODAP. Please make sure you are using Transformers
        within CODAP.
      </p>
    );
  } else if (status === "loading") {
    return <p className="codap-connection-loading">Connecting to CODAP...</p>;
  } else {
    return pluginContent;
  }
};
