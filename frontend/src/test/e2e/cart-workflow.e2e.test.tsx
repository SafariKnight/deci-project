import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";
import { CartPage } from "../../routes/cart/+page.tsx";

const cartItemId = "507f1f77bcf86cd799439011";

describe("Cart workflow: view cart, interact with items, buy", () => {
  beforeEach(() => {
    clearAccessToken();
    setAccessToken("valid-token");
    server.resetHandlers();
  });

  function setupCartWithItems(
    overrides: Partial<{
      quantity: number;
      productName: string;
      price: number;
    }> = {},
  ) {
    const quantity = overrides.quantity ?? 2;
    const productName = overrides.productName ?? "Cart Item";
    const price = overrides.price ?? 25;

    server.use(
      http.get("/cart", () => {
        return HttpResponse.json({
          userId: 1,
          products: [{ productId: cartItemId, quantity, addedAt: Date.now() }],
        });
      }),
      http.get(`*/product/${cartItemId}`, () => {
        return HttpResponse.json({
          id: cartItemId,
          name: productName,
          price,
          description: "",
          imageFilename: "",
          owner: 1,
          details: {},
          uploadedAt: Date.now(),
        });
      }),
    );
  }

  it("Step 3: removes an item by decrementing to zero", async () => {
    let currentQty = 1;
    server.use(
      http.get("/cart", () => {
        return HttpResponse.json({
          userId: 1,
          products:
            currentQty > 0
              ? [
                  {
                    productId: cartItemId,
                    quantity: currentQty,
                    addedAt: Date.now(),
                  },
                ]
              : [],
        });
      }),
      http.get(`*/product/${cartItemId}`, () => {
        return HttpResponse.json({
          id: cartItemId,
          name: "Remove Me",
          price: 15,
          description: "",
          imageFilename: "",
          owner: 1,
          details: {},
          uploadedAt: Date.now(),
        });
      }),
      http.delete("/cart/items", async ({ request }) => {
        const body = (await request.json()) as any;
        if (body.quantity && body.quantity >= currentQty) {
          currentQty = 0;
        } else {
          currentQty -= body.quantity || 1;
        }
        return HttpResponse.json({
          userId: 1,
          products:
            currentQty > 0
              ? [
                  {
                    productId: cartItemId,
                    quantity: currentQty,
                    addedAt: Date.now(),
                  },
                ]
              : [],
        });
      }),
    );

    renderWithProviders(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText("Remove Me")).toBeInTheDocument();
    });

    const minusBtn = screen.getByText("-");
    await userEvent.click(minusBtn);

    await waitFor(() => {
      expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    });
  });

  it("Step 4: buy button shows notification", async () => {
    setupCartWithItems({ quantity: 1, productName: "Buyable Item", price: 30 });

    renderWithProviders(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText("Buyable Item")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Buy"));

    expect(screen.getByText("You bought the items!")).toBeInTheDocument();
  });
});
