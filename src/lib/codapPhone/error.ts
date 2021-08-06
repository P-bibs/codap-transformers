import { t } from "../../strings";

export class CodapEvalError extends Error {
  expression: string;
  error: string;

  constructor(expression: string, error: string) {
    super(t("errors:codapPhone.evalExpression.fail", { expression, error }));
    this.expression = expression;
    this.error = error;
  }
}
