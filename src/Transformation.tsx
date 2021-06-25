/* eslint use-isnan: 0 */
import React, { ReactElement } from "react";
import { useState } from "react";
import "./Transformation.css";
import CodapFlowErrorDisplay from "./Error";
import { SavedTransformation } from "./transformation-components/types";
import { PolymorphicComponent } from "./transformation-components/PolymorphicComponent";
import transformationList, {
  BaseTransformationName,
  TransformationGroup,
} from "./transformation-components/transformationList";
import { useMemo } from "react";

/**
 * Transformation represents an instance of the plugin, which applies a
 * user-defined transformation to input data from CODAP to yield output data.
 */
function Transformation({
  transformation: urlTransformation,
}: {
  transformation?: SavedTransformation;
}): ReactElement {
  const [transformType, setTransformType] = useState<string | null>(null);

  const [errMsg, setErrMsg] = useState<string | null>(null);

  // These are the base transformation types represented as SavedTransformation
  // objects
  const baseTransformations: SavedTransformation[] = useMemo(
    () =>
      Object.keys(transformationList).map((transform) => ({
        name: transform,
        content: { base: transform as BaseTransformationName },
      })),
    []
  );

  function typeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTransformType(event.target.value);
    setErrMsg(null);
  }

  const transformationGroups: [TransformationGroup, string[]][] =
    useMemo(() => {
      let groupNames = Object.entries(transformationList).map(
        ([, data]) => data.group
      );
      // deduplicate group names
      groupNames = [...new Set(groupNames)];

      return groupNames.map((groupName) => {
        const transformationsMatchingGroup = Object.entries(transformationList)
          .filter(([, data]) => data.group === groupName)
          .map(([transform]) => transform);
        return [groupName, transformationsMatchingGroup];
      });
    }, []);

  return (
    <div className="Transformation">
      {urlTransformation ? (
        <>
          <h2>
            {urlTransformation.name}
            <span id="transformationBase">
              {" "}
              ({urlTransformation.content.base})
            </span>
          </h2>
          {urlTransformation.description && (
            <p>{urlTransformation.description}</p>
          )}
        </>
      ) : (
        <>
          <h3>Transformation Type</h3>

          <select
            onChange={typeChange}
            value={transformType || "Select a transformation"}
          >
            <option disabled value="Select a transformation">
              Select a transformation
            </option>
            {transformationGroups.map(([groupName, transformations]) => (
              <optgroup label={groupName} key={groupName}>
                {transformations.map((transformName) => (
                  <option key={transformName} value={transformName}>
                    {transformName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </>
      )}
      {urlTransformation ? (
        <PolymorphicComponent
          setErrMsg={setErrMsg}
          errorDisplay={<CodapFlowErrorDisplay message={errMsg} />}
          transformation={urlTransformation}
        />
      ) : (
        <PolymorphicComponent
          setErrMsg={setErrMsg}
          errorDisplay={<CodapFlowErrorDisplay message={errMsg} />}
          transformation={baseTransformations.find(
            ({ name }) => name === transformType
          )}
        />
      )}
    </div>
  );
}

export default Transformation;
