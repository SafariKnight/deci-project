import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";
import { CartPage } from "../../routes/cart/+page.tsx";

const defaultUser: User = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "USER",
};

describe("CartPage", () => {
  beforeEach(() => {
    clearAccessToken();
    server.resetHandlers();
  });

  it("shows log in prompt for guests", async () => {
    renderWithProviders(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText(/Log in/)).toBeInTheDocument();
    });
  });

  it("shows empty cart message for logged-in user with empty cart", async () => {
    setAccessToken("valid-token");

    renderWithProviders(<CartPage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    });
  });

  it("shows items with product info in the cart", async () => {
    setAccessToken("valid-token");
    server.use(
      http.get("/cart", () => {
        return HttpResponse.json({
          userId: 1,
          products: [
            {
              productId: "507f1f77bcf86cd799439011",
              quantity: 2,
              addedAt: Date.now(),
            },
          ],
        });
      }),
      http.get("/product/507f1f77bcf86cd799439011", () => {
        return HttpResponse.json({
          id: "507f1f77bcf86cd799439011",
          name: "Cart Product",
          price: 15.99,
          description: "",
          imageFilename: "img.png",
          owner: 1,
          details: {},
          uploadedAt: Date.now(),
        });
      }),
    );

    renderWithProviders(<CartPage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("Cart Product")).toBeInTheDocument();
    });
    expect(screen.getAllByText("$31.98").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("shows total of all items", async () => {
    setAccessToken("valid-token");
    server.use(
      http.get("/cart", () => {
        return HttpResponse.json({
          userId: 1,
          products: [
            { productId: "1", quantity: 2, addedAt: Date.now() },
            { productId: "2", quantity: 1, addedAt: Date.now() },
          ],
        });
      }),
      http.get("/product/1", () => {
        return HttpResponse.json({
          id: "1",
          name: "Item 1",
          price: 10,
          description: "",
          imageFilename: "",
          owner: 1,
          details: {},
          uploadedAt: Date.now(),
        });
      }),
      http.get("/product/2", () => {
        return HttpResponse.json({
          id: "2",
          name: "Item 2",
          price: 20,
          description: "",
          imageFilename: "",
          owner: 1,
          details: {},
          uploadedAt: Date.now(),
        });
      }),
    );

    renderWithProviders(<CartPage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("$40.00")).toBeInTheDocument();
    });
  });

  it("buy button shows notification when clicked", async () => {
    setAccessToken("valid-token");
    server.use(
      http.get("/cart", () => {
        return HttpResponse.json({
          userId: 1,
          products: [
            {
              productId: "507f1f77bcf86cd799439011",
              quantity: 1,
              addedAt: Date.now(),
            },
          ],
        });
      }),
      http.get("/product/507f1f77bcf86cd799439011", () => {
        return HttpResponse.json({
          id: "507f1f77bcf86cd799439011",
          name: "Buy Item",
          price: 10,
          description: "",
          imageFilename: "img.png",
          owner: 1,
          details: {},
          uploadedAt: Date.now(),
        });
      }),
    );

    renderWithProviders(<CartPage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("Buy")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Buy"));

    expect(screen.getByText("You bought the items!")).toBeInTheDocument();
  });

  it("clear button refetches cart", async () => {
    setAccessToken("valid-token");
    server.use(
      http.get("/cart", () => {
        return HttpResponse.json({
          userId: 1,
          products: [
            {
              productId: "507f1f77bcf86cd799439011",
              quantity: 1,
              addedAt: Date.now(),
            },
          ],
        });
      }),
      http.get("/product/507f1f77bcf86cd799439011", () => {
        return HttpResponse.json({
          id: "507f1f77bcf86cd799439011",
          name: "Removable Item",
          price: 5,
          description: "",
          imageFilename: "",
          owner: 1,
          details: {},
          uploadedAt: Date.now(),
        });
      }),
    );

    renderWithProviders(<CartPage />, { user: defaultUser });

    await waitFor(() => {
      expect(screen.getByText("Removable Item")).toBeInTheDocument();
    });

    expect(screen.getByText("Clear Cart")).toBeInTheDocument();
  });
});
