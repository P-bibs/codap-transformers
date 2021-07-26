import React, { ReactElement } from "react";
import Popover from "../ui-components/Popover";
import { IconButton } from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";
import "./styles/TransformerInfo.css";

/**
 * Splits a string into several <p> tags, one for each line of text.
 */
function splitIntoParagraphs(text: string): JSX.Element[] {
  return text.split("\n").map((paragraph, i) => (
    <>
      <p key={i}>{paragraph}</p>
    </>
  ));
}

type TransformerInfoProps = {
  transformerName: string;
  summary: string;
  consumes: string;
  produces: string;
  docLink: string;
};

/**
 * TransformerInfo renders a popover element which contains documentation for
 * a given transformer. This documentation is defined in transformerList.ts
 * and consists of a summary, what the transformer consumes/produces, and a
 * link to external standalone documentation.
 */
function TransformerInfo({
  transformerName,
  summary,
  consumes,
  produces,
  docLink,
}: TransformerInfoProps): ReactElement {
  return (
    <Popover
      button={
        <IconButton style={{ padding: "0" }} size="small">
          <InfoIcon htmlColor="var(--blue-green)" fontSize="inherit" />
        </IconButton>
      }
      buttonStyles={{ marginLeft: "5px", display: "inline" }}
      tooltip={`More Info on ${transformerName}`}
      innerContent={
        <>
          <div className="transformer-info-section">
            {splitIntoParagraphs(summary)}
          </div>
          <div className="transformer-info-section">
            <b>Consumes: </b>
            {splitIntoParagraphs(consumes)}
          </div>
          <div className="transformer-info-section">
            <b>Produces: </b>
            {splitIntoParagraphs(produces)}
          </div>
          <div className="transformer-info-section">
            <a href={docLink} target="_blank" rel="noreferrer">
              More Info
            </a>
          </div>
        </>
      }
    />
  );
}

export default TransformerInfo;
