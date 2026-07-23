// oxlint-disable react/jsx-key
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Link, useLocation, useSearchParams } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { validatorParseErrors } from "../../../utils/error";
import { Notification } from "../../../components/Notification";
import styles from "./page.module.css";

export function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [_location, navigate] = useLocation();
  const [notificationMessages, setNotificationMessages] = useState<ReactNode[]>(
    [],
  );
  const [searchParams] = useSearchParams();
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const redirect = searchParams.get("redirect") ?? "/";

  useEffect(() => {
    if (user) {
      navigate(redirect, { replace: true });
    }
  }, [navigate, user, redirect]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const error = await login(email, password);
      if (error) throw error;
    },
    onError: (error: unknown) => {
      const loginError = error as
        | { type: "login_error"; error: LoginAPIError }
        | { type: "validation_error"; errors: string[] };
      if (loginError.type === "login_error") {
        switch (loginError.error) {
          case "email_missing":
            setNotificationMessages(["Email was not found."]);
            break;
          case "wrong_password":
            setNotificationMessages(["Wrong password."]);
            break;
        }
      }
      if (loginError.type === "validation_error") {
        setNotificationMessages(
          validatorParseErrors(loginError.errors).map((err) => err),
        );
      }
      notificationRef.current?.showPopover();
    },
  });

  function onSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    loginMutation.mutate();
  }
  return (
    <form onSubmit={onSubmit} className={styles.form}>
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
        />
      </div>
      <button
        className={styles.formSubmit}
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Submitting..." : "Submit"}
      </button>

      <div className={styles.formSignupLink}>
        Don't have an account? <Link href="/auth/signup">Sign up</Link>
      </div>

      <Notification ref={notificationRef} seconds={5}>
        <ul className={styles.notificationList}>
          {notificationMessages.map((msg, i) => (
            // oxlint-disable-next-line react/no-array-index-key
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </Notification>
    </form>
  );
}
