import { useState } from "react";
import { Link } from "wouter";
import { apiClient } from "../axios";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import styles from "./page.module.css";

export function Root() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["products", page, search],
    queryFn: async () => {
      const res = await apiClient.get("/product", {
        params: { page, search: search || undefined },
      });
      return res.data;
    },
  });

  const products = data?.products;
  const filtered = products;

  return (
    <div className={styles.page}>
      <h2>Latest Products</h2>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {user && (
          <Link href="/product/create" className={styles.createButton}>
            + Create Product
          </Link>
        )}
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : filtered && filtered.length > 0 ? (
        <>
          <div className={styles.productGrid}>
            {filtered.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className={styles.productLink}
              >
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
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
    </div>
  );
}
