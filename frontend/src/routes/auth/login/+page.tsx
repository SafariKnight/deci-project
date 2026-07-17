// oxlint-disable react/jsx-key
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Link, useLocation, useSearchParams } from "wouter";
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
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const redirect = searchParams.get("redirect") ?? "/";

  useEffect(() => {
    if (user) {
      navigate(redirect, { replace: true });
    }
  }, [navigate, user, redirect]);

  async function onSubmit(e: React.SubmitEvent) {
    setSubmitDisabled(true);
    e.preventDefault();
    try {
      const error = await login(email, password);
      if (error) {
        if (error.type === "login_error") {
          switch (error.error) {
            case "email_missing":
              setNotificationMessages(["Email was not found."]);
              break;
            case "wrong_password":
              setNotificationMessages(["Wrong password."]);
              break;
          }
        }
        if (error.type === "validation_error") {
          setNotificationMessages(
            validatorParseErrors(error.errors).map((err) => err),
          );
        }
        notificationRef.current?.showPopover();
      }
    } finally {
      setSubmitDisabled(false);
    }
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
        disabled={submitDisabled}
      >
        Submit
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
