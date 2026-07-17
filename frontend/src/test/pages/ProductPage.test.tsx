import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";
import { ProductPage } from "../../routes/product/[id]/+page.tsx";
import { vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("wouter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("wouter")>();
  return {
    ...mod,
    useLocation: () => ["/", mockNavigate],
    useParams: () => ({ id: "123" }),
  };
});

const mockProduct = {
  id: "123",
  name: "Mock Product",
  price: 29.99,
  description: "A mock product for testing",
  imageFilename: "mock.png",
  owner: 1,
  details: { color: "red" },
  uploadedAt: Date.now(),
};

const mockOtherProduct = {
  ...mockProduct,
  owner: 99,
};

const defaultUser: User = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "USER",
};

const otherUser: User = {
  id: 99,
  username: "otheruser",
  email: "other@test.com",
  role: "USER",
};

describe("ProductPage", () => {
  beforeEach(() => {
    clearAccessToken();
    mockNavigate.mockClear();
    server.resetHandlers();
  });

  it("shows product details", async () => {
    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText("Mock Product")).toBeInTheDocument();
    });
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("shows owner name and links to their page", async () => {
    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });
  });

  it("shows You're the owner! for the product owner", async () => {
    setAccessToken("valid-token");
    server.use(
      http.get("/product/:id", () => {
        return HttpResponse.json(mockProduct);
      }),
    );

    renderWithProviders(<ProductPage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("You're the owner!")).toBeInTheDocument();
    });
  });

  it("shows review form for logged-in users", async () => {
    setAccessToken("valid-token");
    server.use(
      http.get("/product/:id", () => {
        return HttpResponse.json(mockOtherProduct);
      }),
    );

    renderWithProviders(<ProductPage />, { user: otherUser });

    await waitFor(() => {
      expect(screen.getByText("Submit Review")).toBeInTheDocument();
    });
  });

  it("displays reviews list", async () => {
    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText("Great!")).toBeInTheDocument();
    });
    expect(screen.getByText("Okay")).toBeInTheDocument();
  });
});
