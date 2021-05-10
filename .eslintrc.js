module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    'plugin:@typescript-eslint/recommended',
    "prettier",

    "plugin:react/recommended",
    "plugin:react-hooks/recommended",    
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "react-hooks", "@typescript-eslint"],
  rules: {
    "prettier/prettier": [
      2,
      {
        semi: true,
        singleQuote: false,
      },
    ],
    "dot-notation": "off",
    "no-unused-vars": "warn",
  },
};
