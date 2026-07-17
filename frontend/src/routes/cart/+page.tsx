import { useRef, useState } from "react";
import { Link } from "wouter";
import { apiClient } from "../../axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { Notification } from "../../components/Notification";
import styles from "./page.module.css";

interface CartItemWithProduct extends CartItem {
  product?: Product;
}

interface CartWithProducts extends Cart {
  products: CartItemWithProduct[];
}

export function CartPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const buyNotificationRef = useRef<HTMLDivElement | null>(null);
  const [buyMessage, setBuyMessage] = useState("");

  const {
    data: cartData,
    isLoading,
    error,
  } = useQuery<CartWithProducts>({
    queryKey: ["cart"],
    queryFn: async () => {
      const cartRes = await apiClient.get<Cart>("/cart");
      const cart = cartRes.data;

      const itemsWithProducts: CartItemWithProduct[] = await Promise.all(
        cart.products.map(async (item) => {
          try {
            const productRes = await apiClient.get<Product>(
              `/product/${item.productId}`,
            );
            return { ...item, product: productRes.data };
          } catch {
            return { ...item, product: undefined };
          }
        }),
      );

      return { ...cart, products: itemsWithProducts };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiClient.delete("/cart/items", { data: { productId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const incrementMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiClient.post("/cart/items", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiClient.delete("/cart/items", {
        data: { productId, quantity: 1 },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete("/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const total =
    cartData?.products.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0,
    ) ?? 0;

  if (!user) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.empty}>
          <Link href="/auth/login">Log in</Link> to view your cart.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.empty}>Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.empty}>Failed to load cart.</p>
      </div>
    );
  }

  const items = cartData?.products ?? [];

  return (
    <div className={styles.wrapper}>
      <h1>Shopping Cart</h1>

      {items.length === 0 ? (
        <p className={styles.empty}>
          Your cart is empty. <Link href="/">Browse products</Link>
        </p>
      ) : (
        <>
          <div className={styles.cartList}>
            {items.map((item) => (
              <div key={item.productId} className={styles.cartItem}>
                {item.product?.imageFilename ? (
                  <img
                    src={`${apiClient.defaults.baseURL}/image/by-name/${item.product.imageFilename}`}
                    alt={item.product.name}
                    className={styles.itemImage}
                  />
                ) : (
                  <div className={styles.itemImagePlaceholder}>No image</div>
                )}

                <div className={styles.itemInfo}>
                  <h3>
                    <Link href={`/product/${item.productId}`}>
                      {item.product?.name ?? "Unknown Product"}
                    </Link>
                  </h3>
                  {item.product && (
                    <p className={styles.itemPrice}>
                      ${item.product.price.toFixed(2)}
                    </p>
                  )}
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => decrementMutation.mutate(item.productId)}
                      disabled={decrementMutation.isPending}
                    >
                      -
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => incrementMutation.mutate(item.productId)}
                      disabled={incrementMutation.isPending}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={styles.itemActions}>
                  <p className={styles.itemSubtotal}>
                    ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                  </p>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeMutation.mutate(item.productId)}
                    disabled={removeMutation.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.controls}>
            <button
              className={styles.clearButton}
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
            >
              Clear Cart
            </button>
            <button
              className={styles.buyButton}
              onClick={() => {
                setBuyMessage("You bought the items!");
                buyNotificationRef.current?.showPopover();
              }}
            >
              Buy
            </button>
            <div className={styles.total}>
              Total:{" "}
              <span className={styles.totalAmount}>${total.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}

      <Notification ref={buyNotificationRef} seconds={4}>
        {buyMessage}
      </Notification>
    </div>
  );
}
