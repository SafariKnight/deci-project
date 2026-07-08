type Validator = { check: (data: unknown) => boolean, message: string};

export type Schema<T> = {
  [K in keyof T]: T[K] extends object
  ? Schema<T[K]>
  : Validator[]
}

type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export function validate<T>(data: any, schema: Schema<T>, path: string = ""): Result<T> {
  if (!data) {
    return { ok: false, errors: [ "data doesn't exist"] }
  }

  if (typeof data !== "object") {
    return { ok: false, errors: ["data isn't an object"] }
  }

  let messages: string[] = []

  for (const field in schema) {
    const validators = schema[field]
    const value = data[field]
    let currentPath: string

    if (path) {
      currentPath = `${path}.${field}`
    } else {
      currentPath = field
    }


    if (!value) {
      messages.push(`"${field}" doesn't exist`)
    }

    if (Array.isArray(validators)) {
      validators.forEach((v) => {
        const res = v.check(value)
        if (res) {
          messages.push(`["${currentPath}"]: ${v.message}`)
        }
      })
    } else {
      const res = validate(value, validators as Schema<T>, currentPath)
      if (!res.ok) {
        messages = messages.concat(res.errors)
      }
    }
  }
  if (messages.length === 0) {
    return { ok: true, value: data }
  }
  return { ok: false, errors: messages }
}

export const isString: Validator = {
  check: (data) => typeof data !== "string",
  message: "must be a string"
}
export const isNonEmpty: Validator = {
  check: (data) => (data as string).trim() !== "",
  message: "must be non-empty"
}
export const isEmail: Validator = {
  check: (data) => (data as string).includes("@") && (data as string).substring((data as string).indexOf("@")).includes("."),
  message: "must be a valid email"
}
