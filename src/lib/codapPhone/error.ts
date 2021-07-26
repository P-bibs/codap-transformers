export class CodapEvalError extends Error {
  expression: string;
  error: string;

  constructor(expression: string, error: string) {
    super(`Evaluating \`${expression}\` failed: ${error}`);
    this.expression = expression;
    this.error = error;
  }
}
