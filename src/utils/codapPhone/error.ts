export class CodapEvalError extends Error {
  expression: string;
  error: string;

  constructor(expression: string, error: string) {
    super(`${expression} failed with error: ${error}`);
    this.expression = expression;
    this.error = error;
  }
}
