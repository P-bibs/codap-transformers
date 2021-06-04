import React, { ReactElement } from "react";
import Transformation from "./Transformation";
import { SavedTransformation } from "./transformation-components/types";

export const App = (): ReactElement => {
  const parsedUrl = new URL(window.location.href);

  const transformation = parsedUrl.searchParams.get("transform");

  if (transformation === null) {
    return <Transformation />;
  } else {
    const parsedTransformation: SavedTransformation = JSON.parse(
      decodeURIComponent(transformation)
    );

    return <Transformation transformation={parsedTransformation} />;
  }
};
