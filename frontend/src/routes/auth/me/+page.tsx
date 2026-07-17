import { useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import styles from "./page.module.css";
import { Link, useLocation } from "wouter";
import { Notification } from "../../../components/Notification";
import { apiClient } from "../../../axios";
import { useQuery } from "@tanstack/react-query";

export function MePage() {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState<string>("");
  const [_location, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ["user-products", user?.id, page],
    queryFn: async () => {
      const res = await apiClient.get(`/product/user/${user!.id}`, {
        params: { page },
      });
      return res.data;
    },
    enabled: !!user,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  async function userLogout() {
    const result = await logout();
    if (result) {
      switch (result) {
        case "missing_token":
          setMessage("Token wasn't found.");
          break;
        case "token_not_found":
          setMessage("User in token wasn't found.");
          break;
      }
    }
    navigate("/");
  }

  const products = productsData?.products;
  const filtered = products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className={styles.user}>
        <h1 className={styles.userName}>
          <span>{user?.username}</span>
          {user?.role !== "USER" && (
            <span className={styles.roleIndicator}>
              {user?.role}
            </span>
          )}
        </h1>
        <button className={styles.userLogout} onClick={userLogout}>
          Logout
        </button>
      </div>

      <section className={styles.products}>
        <h2>My Products</h2>

        <div className={styles.toolbar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered && filtered.length > 0 ? (
          <>
            <div className={styles.productGrid}>
              {filtered.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`} className={styles.productLink}>
                  <div className={styles.productCard}>
                    {product.imageFilename && (
                      <img
                        src={`${apiClient.defaults.baseURL}/image/by-name/${product.imageFilename}`}
                        alt={product.name}
                        className={styles.productImage}
                      />
                    )}
                    <div className={styles.productInfo}>
                      <h3>{product.name}</h3>
                      <p className={styles.productPrice}>
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className={styles.pagination}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={products && products.length < 8}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p>No products yet.</p>
        )}
      </section>

      <Notification ref={notificationRef} seconds={5}>
        {message}
      </Notification>
    </>
  );
}
