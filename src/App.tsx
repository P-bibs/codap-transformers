import React, { ReactElement } from "react";
import Transformation from "./Transformation";
import { SavedTransformation } from "./transformation-components/types";
import { initPhone } from "./utils/codapPhone";

// This should be a pure function (ie: only render once)
export const App = (): ReactElement => {
  const parsedUrl = new URL(window.location.href);

  const transformation = parsedUrl.searchParams.get("transform");

  if (transformation === null) {
    initPhone("CODAP flow");
    return <Transformation />;
  } else {
    const parsedTransformation: SavedTransformation = JSON.parse(
      decodeURIComponent(transformation)
    );

    initPhone(parsedTransformation.name);

    return <Transformation transformation={parsedTransformation} />;
  }
};
