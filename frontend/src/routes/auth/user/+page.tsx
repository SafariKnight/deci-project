import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { apiClient } from "../../../axios";
import axios from "axios";
import styles from "./page.module.css";
import { useAuth } from "../../../hooks/useAuth";
import { Controls } from "./Controls";
import { useQuery } from "@tanstack/react-query";

export function UserPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userId = parseInt(id as string);
  const [_location, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const {
    data: requestedUser,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await apiClient.get<User>(`/auth/users/${userId}`);
      return res.data;
    },
    enabled: !!userId && !isNaN(userId),
    retry: false,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<{
    products: Product[];
  }>({
    queryKey: ["user-products", userId, page],
    queryFn: async () => {
      const res = await apiClient.get(`/product/user/${userId}`, {
        params: { page },
      });
      return res.data;
    },
    enabled: !!userId && !isNaN(userId),
  });

  if (!id) {
    return <>Provide an id.</>;
  }

  if (isNaN(userId)) {
    return <>ID must be a number.</>;
  }

  if (isLoading) {
    return <>Loading...</>;
  }

  if (error) {
    if (axios.isAxiosError(error) && error.status === 404) {
      navigate("/404");
    }
    return <>Error loading user.</>;
  }

  let adminControls: React.ReactNode;
  if (
    user?.id !== requestedUser?.id &&
    (user?.role === "ADMIN" || user?.role === "OWNER")
  ) {
    adminControls = <Controls userId={id} />;
  }

  const getRoleClass = () => {
    if (!requestedUser?.role || requestedUser.role === "USER") return "";
    switch (requestedUser.role) {
      case "ADMIN":
        return styles.roleAdmin;
      case "OWNER":
        return styles.roleOwner;
      default:
        return "";
    }
  };

  const filteredProducts = productsData?.products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className={styles.user}>
        <h1 className={styles.userName}>
          {requestedUser?.username}
          {requestedUser?.role !== "USER" && (
            <span className={`${styles.roleIndicator} ${getRoleClass()}`}>
              {requestedUser?.role}
            </span>
          )}
        </h1>
        {adminControls}
      </div>

      <section className={styles.products}>
        <h2>Products</h2>

        <div className={styles.toolbar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {productsLoading ? (
          <p>Loading products...</p>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <>
            <div className={styles.productGrid}>
              {filteredProducts.map((product) => (
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
                disabled={!productsData?.products || productsData.products.length < 8}
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
    </>
  );
}
