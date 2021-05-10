module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    'plugin:@typescript-eslint/recommended',

    "plugin:react/recommended",
    "plugin:react-hooks/recommended",   
     
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "react-hooks", "@typescript-eslint"],
  rules: {
    "dot-notation": "off",
    "no-unused-vars": "warn",
    "no-constant-condition": ["error", { "checkLoops": false }],
  },
};
