# Transformers

Transformers is a plugin for [CODAP](https://codap.concord.org/) which allows you to transform datasets to produce new, distinct output datasets or values, instead of modifying the original input dataset itself.

Individual transformers can be composed, and updates made to the input(s) of a transformer will flow through to its outputs accordingly. Transformers
can also be saved and reused on several datasets.

For more information on the plugin and the available transformers themselves, see [the documentation](https://docs.google.com/document/d/1NZA9gxtu6jD3M-5SQyx0tvV2N5qYKMgRm1XUwMnLgJU/edit?usp=sharing).

# Working on Transformers

## Project Structure

- `src/`
  - `components/`
    - `info-components/`: "About" info / inline transformers documentation components.
    - `transformer-template/`: Houses `TransformerTemplate` (and related components), the main component for rendering a transformer's UI given a description of its inputs.
    - `ui-components/`: Generic components for UI elements. 
  - `lib/`
    - `codapPhone/`: A wrapper around [iframe-phone](https://github.com/concord-consortium/iframe-phone) for communicating with CODAP.
    - `utils/`: Small, widely-used utility functions.
  - `transformers/`: Core implementations of the actual transformers. Each has an external implementation (responsible for consuming UI inputs and checking them) and an inner, unchecked implementation which performs the actual transformer's functionality.
  - `transformerStore/`: Keeps track of which transformers were used to produce which datasets, and uses this info to propagate updates through transformers. 
  - `views/`: The two main views of the plugin: 
    - The `REPLView` is the main UI through which you can choose a transformer, select its inputs, and create saved transformers. 
    - The `SavedDefinitionView` is what you see for a saved transformer (including name, purpose statement, inputs, editing UI).
  - `transformerList.ts`: A list of all transformers and their corresponding data, including group, inputs, underlying implementation function, and documentation info.

## Running locally with CODAP

To launch the plugin in a local instance of CODAP, start both the plugin and [CODAP](https://github.com/concord-consortium/codap) and navigate in a browser to
```
http://localhost:4020/dg?di=http://localhost:3000
```

## 

## Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode. See above section for opening the plugin inside CODAP.

#### `npm test`

Launches the test runner.

#### `npm run format`

Formats all ts/tsx files.

#### `npm run lint`

Runs the linter.

# Authors

This plugin is brought to you by Paul Biberstein, Thomas Castleman, and Jason Chen of the [Brown University PLT](https://cs.brown.edu/research/plt/), in collaboration with [The Concord Consortium](https://concord.org/) and [Bootstrap](https://bootstrapworld.org/).
