import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken } from "../../access.ts";
import { LoginPage } from "../../routes/auth/login/+page.tsx";
import { vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("wouter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("wouter")>();
  return {
    ...mod,
    useLocation: () => ["/", mockNavigate],
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

const defaultUser: User = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "USER",
};

describe("LoginPage", () => {
  beforeEach(() => {
    clearAccessToken();
    mockNavigate.mockClear();
    server.resetHandlers();
  });

  it("renders form with email and password inputs", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it("shows email not found error on unknown email", async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Email"), "unknown@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Email was not found.")).toBeInTheDocument();
    });
  });

  it("shows wrong password error", async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpassword");
    await userEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Wrong password.")).toBeInTheDocument();
    });
  });

  it("redirects to home when already logged in", async () => {
    renderWithProviders(<LoginPage />, { user: defaultUser });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});
