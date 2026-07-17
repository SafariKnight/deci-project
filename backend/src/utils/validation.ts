type Validator = { check: (data: unknown) => boolean; message: string };

export type Schema<T> = {
  [K in keyof T]: T[K] extends object ? Schema<T[K]> : Validator[];
};

type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export function validate<T>(
  data: any,
  schema: Schema<T>,
  path: string = "",
): Result<T> {
  if (!data) {
    return { ok: false, errors: ["data doesn't exist"] };
  }

  if (typeof data !== "object") {
    return { ok: false, errors: ["data isn't an object"] };
  }

  let messages: string[] = [];

  outer: for (const field in schema) {
    const validators = schema[field];
    const value = data[field];
    let currentPath: string;

    if (!value) {
      messages.push(`["${field}"] doesn't exist`);
      continue;
    }

    if (path) {
      currentPath = `${path}.${field}`;
    } else {
      currentPath = field;
    }

    if (Array.isArray(validators)) {
      for (const v of validators) {
        const res = v.check(value);
        if (!res) {
          messages.push(`["${currentPath}"]: ${v.message}`);
          continue outer;
        }
      }
    } else {
      messages = validateField<T>(value, validators, currentPath, messages);
    }
  }
  if (messages.length === 0) {
    return { ok: true, value: data };
  }
  return { ok: false, errors: messages };
}

export const isString: Validator = {
  check: (data) => typeof data === "string",
  message: "must be a string",
};
export const isNonEmpty: Validator = {
  check: (data) => (data as string).trim() !== "",
  message: "must be non-empty",
};
export const isEmail: Validator = {
  check: (data) =>
    (data as string).includes("@") &&
    (data as string).substring((data as string).indexOf("@")).includes("."),
  message: "must be a valid email",
};

export const minLength: (minimum: number) => Validator = (minimum: number) => {
  return {
    check: (data) => (data as string).length >= minimum,
    message: `must be atleast ${minimum} characters long`,
  };
};

export const isNum: Validator = {
  check: (data) => typeof data === "number",
  message: "must be a number",
};

export const oneOf: (validElements: unknown[]) => Validator = (
  validElements,
) => {
  return {
    check: (data) => validElements.includes(data),
    message: `must be one of ${validElements}`,
  };
};

export const isObject: Validator = {
  check: (data) => typeof data === "object",
  message: "must be an object",
};

export const isPositive: Validator = {
  check: (data) => (data as number) > 0,
  message: "must be an a positive number",
};
export function validateField<T>(
  value: any,
  validators: Schema<T>[Extract<keyof T, string>],
  currentPath: string,
  messages: string[] = [],
) {
  const res = validate(value, validators as Schema<T>, currentPath);
  if (!res.ok) {
    messages = messages.concat(res.errors);
  }
  return messages;
}
