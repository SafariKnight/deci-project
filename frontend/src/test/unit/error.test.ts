import { prettifyString, validatorParseErrors } from "../../utils/error.ts";

describe("prettifyString", () => {
  it("returns empty string for empty input", () => {
    expect(prettifyString("")).toBe("");
    expect(prettifyString(null as unknown as string)).toBe("");
    expect(prettifyString(undefined as unknown as string)).toBe("");
  });

  it("converts camelCase to spaced words", () => {
    expect(prettifyString("firstName")).toBe("First Name");
    expect(prettifyString("productName")).toBe("Product Name");
  });

  it("converts snake_case to spaced words", () => {
    expect(prettifyString("email_address")).toBe("Email Address");
    expect(prettifyString("user_id")).toBe("User Id");
  });

  it("handles single word", () => {
    expect(prettifyString("hello")).toBe("Hello");
    expect(prettifyString("email")).toBe("Email");
  });

  it("handles multiple consecutive capital letters", () => {
    expect(prettifyString("userID")).toBe("User Id");
  });
});

describe("validatorParseErrors", () => {
  it("parses a single error from the backend format", () => {
    const errors = validatorParseErrors(['["email"]: must be a string']);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/email/i);
    expect(errors[0]).toMatch(/must be a string/i);
  });

  it("parses multiple errors", () => {
    const errors = validatorParseErrors([
      '["email"]: must be a string',
      '["password"]: must be atleast 8 characters long',
    ]);

    expect(errors).toHaveLength(2);
  });

  it("handles nested field paths", () => {
    const errors = validatorParseErrors([
      '["details.size"]: must be a string',
    ]);

    expect(errors).toHaveLength(1);
  });

  it("returns empty array for empty input", () => {
    expect(validatorParseErrors([])).toEqual([]);
  });
});
