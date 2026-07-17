import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken } from "../../access.ts";
import { SignupPage } from "../../routes/auth/signup/+page.tsx";
import { vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("wouter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("wouter")>();
  return {
    ...mod,
    useLocation: () => ["/", mockNavigate],
  };
});

describe("SignupPage", () => {
  beforeEach(() => {
    clearAccessToken();
    mockNavigate.mockClear();
    server.resetHandlers();
  });

  it("renders form with all required fields", () => {
    renderWithProviders(<SignupPage />);

    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("navigates to login on successful registration", async () => {
    renderWithProviders(<SignupPage />);

    await userEvent.type(screen.getByLabelText("Username"), "newuser");
    await userEvent.type(screen.getByLabelText("Email"), "newuser@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByText("Sign Up"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("shows error message when email is already in use", async () => {
    server.use(
      http.post("/auth/register", () => {
        return HttpResponse.json(
          { message: "Email already in use", error: "email_in_use" },
          { status: 409 },
        );
      }),
    );

    renderWithProviders(<SignupPage />);

    await userEvent.type(screen.getByLabelText("Username"), "existing");
    await userEvent.type(screen.getByLabelText("Email"), "existing@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByText("Sign Up"));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
  });

  it("shows validation errors from the API", async () => {
    server.use(
      http.post("/auth/register", () => {
        return HttpResponse.json(
          {
            errors: ['["password"]: must be atleast 8 characters long'],
            type: "validation_error",
          },
          { status: 422 },
        );
      }),
    );

    renderWithProviders(<SignupPage />);

    await userEvent.type(screen.getByLabelText("Username"), "user");
    await userEvent.type(screen.getByLabelText("Email"), "user@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.click(screen.getByText("Sign Up"));

    await waitFor(() => {
      expect(screen.getByText(/atleast 8 characters/i)).toBeInTheDocument();
    });
  });
});
