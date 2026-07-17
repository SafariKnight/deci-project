import { useRef, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { apiClient } from "../../../axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/useAuth";
import { Notification } from "../../../components/Notification";
import styles from "./page.module.css";

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [_location, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const cartNotificationRef = useRef<HTMLDivElement | null>(null);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await apiClient.get(`/product/${id}`);
      return res.data;
    },
    enabled: !!id,
    retry: false,
  });

  const { data: reviewsData } = useQuery<{ reviews: Review[] }>({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const res = await apiClient.get(`/review/product/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/review", {
        productId: id,
        rating,
        comment,
      });
      return res.data;
    },
    onSuccess: () => {
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      await apiClient.post("/cart/items", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-product", id] });
    },
  });

  const { data: cartData } = useQuery<Cart>({
    queryKey: ["cart-product", id],
    queryFn: async () => {
      const res = await apiClient.get("/cart");
      return res.data;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const cartItem = cartData?.products?.find((p) => p.productId === id);

  const { data: ownerUser } = useQuery<User>({
    queryKey: ["user", product?.owner],
    queryFn: async () => {
      const res = await apiClient.get(`/auth/users/${product!.owner}`);
      return res.data;
    },
    enabled: !!product,
    retry: false,
  });

  if (!id) {
    return <div className={styles.wrapper}>No product ID provided.</div>;
  }

  if (isLoading) {
    return <div className={styles.wrapper}>Loading...</div>;
  }

  if (error || !product) {
    navigate("/404");
    return null;
  }

  const reviews = reviewsData?.reviews || [];
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.imageSection}>
          {product.imageFilename ? (
            <img
              src={`${apiClient.defaults.baseURL}/image/by-name/${product.imageFilename}`}
              alt={product.name}
              className={styles.mainImage}
            />
          ) : (
            <div className={styles.noImage}>No image available</div>
          )}
        </div>

        <div className={styles.infoSection}>
          <h1 className={styles.title}>{product.name}</h1>
          {ownerUser && (
            <p className={styles.ownerName}>
              by{" "}
              <Link href={`/user/${product.owner}`}>{ownerUser.username}</Link>
            </p>
          )}
          <p className={styles.price}>${product.price.toFixed(2)}</p>

          {avgRating && (
            <p className={styles.avgRating}>
              {"★".repeat(Math.round(Number(avgRating)))}
              {"☆".repeat(5 - Math.round(Number(avgRating)))} {avgRating} (
              {reviews.length} review{reviews.length !== 1 ? "s" : ""})
            </p>
          )}

          {product.description && (
            <div className={styles.description}>
              <h2>Description</h2>
              <p>{product.description}</p>
            </div>
          )}

          {user && user.id === product.owner && (
            <button className={styles.ownerButton} disabled>
              You're the owner!
            </button>
          )}
          {user && user.id !== product.owner && (
            <>
              <button
                className={styles.addToCart}
                onClick={() =>
                  addToCartMutation.mutate(
                    { productId: id! },
                    {
                      onSuccess: () => {
                        setCartMessage(
                          cartItem ? "Increased quantity!" : "Added to cart!",
                        );
                        cartNotificationRef.current?.showPopover();
                      },
                      onError: () => {
                        setCartMessage("Failed to add to cart.");
                        cartNotificationRef.current?.showPopover();
                      },
                    },
                  )
                }
                disabled={addToCartMutation.isPending}
              >
                {addToCartMutation.isPending
                  ? "Adding..."
                  : cartItem
                    ? "Add more"
                    : "Add to Cart"}
              </button>
              {cartItem && (
                <p className={styles.cartQuantity}>
                  In cart: {cartItem.quantity}
                </p>
              )}
            </>
          )}

          {product.details && Object.keys(product.details).length > 0 && (
            <div className={styles.details}>
              <h2>Details</h2>
              <table className={styles.detailsTable}>
                <tbody>
                  {Object.entries(product.details).map(([key, value]) => (
                    <tr key={key}>
                      <td className={styles.detailKey}>{key}</td>
                      <td className={styles.detailValue}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <section className={styles.reviews}>
        <h2>Reviews</h2>

        {user && (
          <div className={styles.reviewForm}>
            <div className={styles.starInput}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${star <= (hoverRating || rating) ? styles.starActive : ""}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className={styles.commentInput}
              placeholder="Write your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <button
              className={styles.submitReview}
              disabled={
                !rating || !comment.trim() || createReviewMutation.isPending
              }
              onClick={() => createReviewMutation.mutate()}
            >
              {createReviewMutation.isPending
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </div>
        )}

        {!user && (
          <p className={styles.loginPrompt}>
            <Link href="/auth/login">Log in</Link> to write a review.
          </p>
        )}

        <div className={styles.reviewList}>
          {reviews.length === 0 ? (
            <p className={styles.noReviews}>No reviews yet.</p>
          ) : (
            reviews.map((review) => (
              <div
                key={review.createdAt + review.userId}
                className={styles.reviewCard}
              >
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewStars}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                  <span className={styles.reviewUser}>{review.username}</span>
                </div>
                <p className={styles.reviewComment}>{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <Notification ref={cartNotificationRef} seconds={3}>
        {cartMessage}
      </Notification>
    </div>
  );
}
