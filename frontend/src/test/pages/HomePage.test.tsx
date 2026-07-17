import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";
import { Root } from "../../routes/+page.tsx";

const defaultUser: User = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "USER",
};

describe("HomePage", () => {
  beforeEach(() => {
    clearAccessToken();
    server.resetHandlers();
  });

  it("shows product grid with products", async () => {
    renderWithProviders(<Root />);

    await waitFor(() => {
      expect(screen.getByText("Red Chair")).toBeInTheDocument();
    });
    expect(screen.getByText("Blue Table")).toBeInTheDocument();
  });

  it("shows Loading... while fetching", () => {
    renderWithProviders(<Root />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows No products yet when empty", async () => {
    server.use(
      http.get("/product", () => {
        return HttpResponse.json({ products: [] });
      }),
    );

    renderWithProviders(<Root />);

    await waitFor(() => {
      expect(screen.getByText("No products yet.")).toBeInTheDocument();
    });
  });

  it("shows Create Product button when logged in", async () => {
    setAccessToken("valid-token");

    renderWithProviders(<Root />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("+ Create Product")).toBeInTheDocument();
    });
  });

  it("hides Create Product button when not logged in", async () => {
    renderWithProviders(<Root />);

    await waitFor(() => {
      expect(screen.queryByText("+ Create Product")).not.toBeInTheDocument();
    });
  });

  it("search input triggers refetch with search param", async () => {
    renderWithProviders(<Root />);

    await waitFor(() => {
      expect(screen.getByText("Red Chair")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search products...");
    await userEvent.type(searchInput, "Blue");

    await waitFor(() => {
      expect(screen.getByText("Blue Table")).toBeInTheDocument();
    });
  });
});
