import "#src/config/index.ts";
import { postgres } from '#src/config/postgres.js';
import { hashPassword } from './passwordService.js';
import {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByAccessTokenPayload,
  changeUserRole,
  register,
  login,
  refresh,
} from './userService.js';
import { ERROR_CODES } from '#src/utils/errorCodes.js';

beforeEach(async () => {
  await postgres.refreshToken.deleteMany({});
  await postgres.user.deleteMany({});
});

const defaultUser = {
  username: "testuser",
  email: "test@example.com",
  password: "password123",
};

describe("createUser", () => {
  it("creates a user and returns it without the password", async () => {
    const result = await createUser({
      username: "testuser",
      email: "test@example.com",
      password: await hashPassword("password123"),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.username).toBe("testuser");
      expect(result.user.email).toBe("test@example.com");
      expect((result.user as any).password).toBeUndefined();
    }
  });
});

describe("getUserById", () => {
  it("returns a user when found", async () => {
    const user = await postgres.user.create({
      data: {
        ...defaultUser,
        password: await hashPassword(defaultUser.password),
      },
    });

    const result = await getUserById(user.id, {
      id: true,
      username: true,
      email: true,
      role: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.username).toBe("testuser");
    }
  });

  it("returns NOT_FOUND when user doesn't exist", async () => {
    const result = await getUserById(99999, { id: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.USER.NOT_FOUND);
    }
  });
});

describe("getUserByEmail", () => {
  it("returns a user when found", async () => {
    await postgres.user.create({
      data: {
        ...defaultUser,
        password: await hashPassword(defaultUser.password),
      },
    });

    const result = await getUserByEmail("test@example.com", {
      id: true,
      email: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("test@example.com");
    }
  });

  it("returns NOT_FOUND when email doesn't exist", async () => {
    const result = await getUserByEmail("nonexistent@example.com", {
      id: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.USER.NOT_FOUND);
    }
  });
});

describe("getUserByAccessTokenPayload", () => {
  it("returns a user when payload sub matches an email", async () => {
    const user = await postgres.user.create({
      data: {
        ...defaultUser,
        password: await hashPassword(defaultUser.password),
      },
    });

    const result = await getUserByAccessTokenPayload({ sub: user.email });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe(user.email);
      expect((result.user as any).password).toBeUndefined();
    }
  });

  it("returns NOT_FOUND when email doesn't exist", async () => {
    const result = await getUserByAccessTokenPayload({
      sub: "nonexistent@example.com",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.USER.NOT_FOUND);
    }
  });
});

describe("changeUserRole", () => {
  it("changes the user's role successfully", async () => {
    const user = await postgres.user.create({
      data: {
        ...defaultUser,
        password: await hashPassword(defaultUser.password),
      },
    });

    const result = await changeUserRole(user.id, "ADMIN");

    expect(result.ok).toBe(true);

    const updated = await postgres.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    expect(updated!.role).toBe("ADMIN");
  });

  it("returns MISSING for non-existent user", async () => {
    const result = await changeUserRole(99999, "ADMIN");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.USER.MISSING);
    }
  });
});

describe("register", () => {
  it("creates a user with hashed password", async () => {
    const result = await register(
      "newuser",
      "newuser@example.com",
      "password123",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.username).toBe("newuser");
      expect(result.user.email).toBe("newuser@example.com");
      expect((result.user as any).password).toBeUndefined();
    }

    const stored = await postgres.user.findUnique({
      where: { email: "newuser@example.com" },
    });
    expect(stored).toBeDefined();
    expect(stored!.password).not.toBe("password123");
  });

  it("returns EMAIL_IN_USE for duplicate email", async () => {
    await register("user1", "dupe@example.com", "password123");

    const result = await register("user2", "dupe@example.com", "password456");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.AUTH.EMAIL_IN_USE);
    }
  });
});

describe("login", () => {
  beforeEach(async () => {
    await postgres.user.create({
      data: {
        username: "loginuser",
        email: "login@example.com",
        password: await hashPassword("correctpassword"),
      },
    });
  });

  it("returns tokens and user for valid credentials", async () => {
    const result = await login("login@example.com", "correctpassword");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe("string");
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe("login@example.com");
      expect(result.user.username).toBe("loginuser");
    }
  });

  it("returns EMAIL_MISSING for unknown email", async () => {
    const result = await login("unknown@example.com", "password123");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.AUTH.EMAIL_MISSING);
    }
  });

  it("returns WRONG_PASSWORD for incorrect password", async () => {
    const result = await login("login@example.com", "wrongpassword");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.AUTH.WRONG_PASSWORD);
    }
  });
});

describe("refresh", () => {
  it("returns a new access token for a valid refresh token", async () => {
    const user = await postgres.user.create({
      data: {
        username: "refreshuser",
        email: "refresh@example.com",
        password: await hashPassword("password"),
      },
    });

    const { makeRefreshToken } = await import("./tokenService.ts");
    const refreshToken = await makeRefreshToken();
    await postgres.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    const result = await refresh(refreshToken);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe("string");
    }
  });

  it("returns INVALID_TOKEN for a non-existent refresh token", async () => {
    const result = await refresh(
      "0000000000000000000000000000000000000000000000000000000000000000",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.AUTH.INVALID_TOKEN);
    }
  });
});
