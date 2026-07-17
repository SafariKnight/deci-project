import { setAccessToken, getAccessToken, clearAccessToken } from "../../access.ts";

beforeEach(() => {
  clearAccessToken();
});

describe("access", () => {
  it("returns null initially", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("stores and retrieves a token", () => {
    setAccessToken("my-token");
    expect(getAccessToken()).toBe("my-token");
  });

  it("can store multiple tokens (last one wins)", () => {
    setAccessToken("first");
    setAccessToken("second");
    expect(getAccessToken()).toBe("second");
  });

  it("clears the stored token", () => {
    setAccessToken("my-token");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
