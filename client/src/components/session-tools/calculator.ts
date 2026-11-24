export function calculate(expression: string): number {
  if (expression.length > 160) throw new Error("INVALID_EXPRESSION");
  const tokens = expression
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replaceAll(",", ".")
    .match(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[^\s]/gi) ?? [];
  let cursor = 0;

  function take(token: string) {
    if (tokens[cursor] !== token) return false;
    cursor++;
    return true;
  }

  function operand(): number {
    if (take("+")) return operand();
    if (take("-")) return -operand();
    if (take("(")) {
      const value = sum();
      if (!take(")")) throw new Error("INVALID_EXPRESSION");
      return value;
    }
    const token = tokens[cursor++];
    if (!token || !/^[\d.]/.test(token) || !Number.isFinite(Number(token)))
      throw new Error("INVALID_EXPRESSION");
    return Number(token);
  }

  function product() {
    let value = operand();
    while (cursor < tokens.length) {
      if (take("*")) value *= operand();
      else if (take("/")) {
        const divisor = operand();
        if (divisor === 0) throw new Error("DIVIDE_BY_ZERO");
        value /= divisor;
      } else break;
    }
    return value;
  }

  function sum() {
    let value = product();
    while (cursor < tokens.length) {
      if (take("+")) value += product();
      else if (take("-")) value -= product();
      else break;
    }
    return value;
  }

  const value = sum();
  if (cursor !== tokens.length || !Number.isFinite(value))
    throw new Error("INVALID_EXPRESSION");
  return Number(value.toPrecision(15));
}
