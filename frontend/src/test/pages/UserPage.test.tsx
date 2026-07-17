import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";
import { UserPage } from "../../routes/auth/user/+page.tsx";
import { vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("wouter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("wouter")>();
  return {
    ...mod,
    useLocation: () => ["/", mockNavigate],
    useParams: () => ({ id: "42" }),
  };
});

describe("UserPage", () => {
  beforeEach(() => {
    clearAccessToken();
    mockNavigate.mockClear();
    server.resetHandlers();
  });

  it("shows user profile and products", async () => {
    renderWithProviders(<UserPage />);

    await waitFor(() => {
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });
  });

  it("shows Controls for an admin visitor", async () => {
    setAccessToken("admin-token");
    server.use(
      http.get("/auth/me", () => {
        return HttpResponse.json({
          id: 2,
          username: "admin",
          email: "admin@test.com",
          role: "ADMIN",
        });
      }),
    );

    renderWithProviders(<UserPage />);

    await waitFor(() => {
      expect(screen.getByText("Change Role")).toBeInTheDocument();
    });
  });

  it("does not show Controls for a regular user", async () => {
    setAccessToken("regular-token");

    renderWithProviders(<UserPage />);

    await waitFor(() => {
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });
    expect(screen.queryByText("Change Role")).not.toBeInTheDocument();
  });

  it("navigates to 404 when user is not found", async () => {
    server.use(
      http.get("/auth/users/:id", () => {
        return HttpResponse.json(
          { message: "User Not Found" },
          { status: 404 },
        );
      }),
    );

    renderWithProviders(<UserPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/404");
    });
  });
});
