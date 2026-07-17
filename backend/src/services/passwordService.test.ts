import { hashPassword, comparePassword } from './passwordService.js';

describe("Password Service", () => {
  it("hashes a password", async () => {
    const password = "mySecretPassword123";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("returns true for matching password", async () => {
    const password = "mySecretPassword123";
    const hash = await hashPassword(password);
    const result = await comparePassword(hash, password);

    expect(result).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const password = "mySecretPassword123";
    const hash = await hashPassword(password);
    const result = await comparePassword(hash, "aDifferentPassword");

    expect(result).toBe(false);
  });

  it("generates different hashes for the same password", async () => {
    const password = "mySecretPassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});
