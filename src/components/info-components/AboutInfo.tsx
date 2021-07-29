import React, { ReactElement } from "react";
import Popover from "../ui-components/Popover";
import "./styles/AboutInfo.css";

function AboutInfo(): ReactElement {
  return (
    <Popover
      button={<button style={{ fontSize: "11px" }}>About</button>}
      tooltip={`About the Transformers Plugin`}
      innerContent={
        <div id="about-info">
          <h3>About</h3>
          <p>
            The Transformers plugin allows you to transform datasets to produce
            new, distinct output datasets or values, instead of modifying the
            original input dataset itself. This enables easy “what if”
            exploration and comparison of datasets that may represent distinct
            transformations performed on the same source dataset.
          </p>

          <p>
            The result of one transformer can be used as an input to another,
            and in this way transformers can be composed, resulting in a
            sequence of datasets, each a transformed version of the previous.
            This way of manipulating a dataset can be useful for making clear
            the specific steps that were used to process the data or change its
            structure.
          </p>

          <p>
            Any updates made to the input dataset of a transformer will flow
            through and affect its outputs. If you have a chain of transformed
            datasets and you change the original dataset, the updates will flow
            through the chain.
          </p>

          <p>
            You can also save a particular configuration of a transformer, and
            reuse this custom transformer on several datasets. This allows you
            to abstract over a particular computation you might want to perform
            on your data (the way functions in Algebra are abstractions over
            computations in arithmetic), and also enables tweaking and refining
            your transformer using smaller test datasets, and then later
            applying it to real-world data.{" "}
          </p>

          <h3>Getting Started</h3>
          <p>
            To get started with the Transformers plugin, check out the various
            transformers in the “Transformer Type” dropdown. To learn more about
            a specific transformer, click the “i” icon next to the dropdown.
          </p>

          <h3>Authors</h3>
          <p>
            This plugin is brought to you by Paul Biberstein, Thomas Castleman,
            and Jason Chen of{" "}
            <a
              href="https://cs.brown.edu/research/plt/"
              target="_blank"
              rel="noreferrer"
            >
              Brown University PLT
            </a>{" "}
            in collaboration with{" "}
            <a href="https://concord.org/" target="_blank" rel="noreferrer">
              The Concord Consortium
            </a>{" "}
            and{" "}
            <a
              href="https://bootstrapworld.org/"
              target="_blank"
              rel="noreferrer"
            >
              Bootstrap
            </a>
            .
          </p>
        </div>
      }
    />
  );
}

export default AboutInfo;
