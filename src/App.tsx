import React, { ReactElement } from "react";
import Transformer from "./Transformer";
import { SavedTransformer } from "./transformer-components/types";
import { initPhone } from "./utils/codapPhone";

// This should be a pure function (ie: only render once)
export const App = (): ReactElement => {
  const parsedUrl = new URL(window.location.href);

  const transformer = parsedUrl.searchParams.get("transform");

  if (transformer === null) {
    initPhone("Transformers");
    return <Transformer />;
  } else {
    const parsedTransformer: SavedTransformer = JSON.parse(
      decodeURIComponent(transformer)
    );

    initPhone(`Transformer: ${parsedTransformer.name}`);

    return <Transformer transformer={parsedTransformer} />;
  }
};
