import { useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../axios";
import { validatorParseErrors } from "../../../utils/error";
import { Notification } from "../../../components/Notification";
import styles from "./page.module.css";
import axios from "axios";

export function SignupPage() {
  const [_location, navigate] = useLocation();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [notificationMessages, setNotificationMessages] = useState<ReactNode[]>(
    [],
  );
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const signupMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/auth/register", { username, email, password });
    },
    onSuccess: () => {
      navigate("/auth/login");
    },
    onError: (err: unknown) => {
      if (
        axios.isAxiosError(err) &&
        err.response?.data?.type === "validation_error"
      ) {
        setNotificationMessages(
          validatorParseErrors(err.response.data.errors).map((msg) => msg),
        );
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        setNotificationMessages([err.response.data.message]);
      } else {
        setNotificationMessages(["An unexpected error occurred"]);
      }
      notificationRef.current?.showPopover();
    },
  });

  function onSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setNotificationMessages([]);
    signupMutation.mutate();
  }
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.formUsername}>
        <label htmlFor="username" className={styles.usernameLabel}>
          Username
        </label>
        <input
          className={styles.usernameInput}
          value={username}
          id="username"
          type="text"
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className={styles.formEmail}>
        <label htmlFor="email" className={styles.emailLabel}>
          Email
        </label>
        <input
          className={styles.emailInput}
          value={email}
          id="email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className={styles.formPassword}>
        <label htmlFor="password" className={styles.passwordLabel}>
          Password
        </label>
        <input
          className={styles.passwordInput}
          value={password}
          id="password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button
        className={styles.formSubmit}
        type="submit"
        disabled={signupMutation.isPending}
      >
        {signupMutation.isPending ? "Signing Up..." : "Sign Up"}
      </button>

      <Notification ref={notificationRef} seconds={5}>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "lightcoral" }}>
          {notificationMessages.map((msg, i) => (
            // oxlint-disable-next-line react/no-array-index-key
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </Notification>
    </form>
  );
}
