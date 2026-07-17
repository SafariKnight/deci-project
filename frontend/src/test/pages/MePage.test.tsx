import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";
import { MePage } from "../../routes/auth/me/+page.tsx";
import { vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("wouter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("wouter")>();
  return {
    ...mod,
    useLocation: () => ["/", mockNavigate],
  };
});

const defaultUser: User = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "USER",
};

const adminUser: User = {
  id: 2,
  username: "adminuser",
  email: "admin@test.com",
  role: "ADMIN",
};

describe("MePage", () => {
  beforeEach(() => {
    clearAccessToken();
    mockNavigate.mockClear();
    server.resetHandlers();
  });

  it("shows username for a logged-in user", async () => {
    renderWithProviders(<MePage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });
    expect(screen.getByText("My Products")).toBeInTheDocument();
  });

  it("shows role badge for ADMIN role", async () => {
    renderWithProviders(<MePage />, { user: adminUser });

    await waitFor(() => {
      expect(screen.getByText("adminuser")).toBeInTheDocument();
    });
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("shows user's products", async () => {
    server.use(
      http.get("/product/user/:id", () => {
        return HttpResponse.json({
          products: [
            {
              id: "1",
              name: "My Product",
              price: 10,
              description: "",
              imageFilename: "",
              owner: 1,
              details: {},
              uploadedAt: Date.now(),
            },
          ],
        });
      }),
    );

    renderWithProviders(<MePage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("My Product")).toBeInTheDocument();
    });
  });

  it("renders logout button for logged-in users", async () => {
    setAccessToken("valid-token");

    renderWithProviders(<MePage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });
});
