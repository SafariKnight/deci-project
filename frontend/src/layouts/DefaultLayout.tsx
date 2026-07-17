import { Link } from "wouter";
import { useAuth } from "../hooks/useAuth";
import styles from "./DefaultLayout.module.css";

export function DefaultLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  let userElement: React.ReactNode;

  if (user?.username) {
    userElement = (
      <Link href="/auth/me" className={styles.userNameUser}>
        {user.username}
      </Link>
    );
  } else {
    userElement = (
      <Link href="/auth/login" className={styles.userNameGuest}>
        Guest
      </Link>
    );
  }

  return (
    <>
      <header>
        <div className={styles.headerLogo}>
          <Link href="/" className={styles.logo}>
            BOBER KURWAZON
          </Link>
        </div>
        <div className={styles.headerNav}>
          <Link href="/cart" className={styles.cartLink}>
            Cart
          </Link>
        </div>
        <div className={styles.headerUser}>{userElement}</div>
      </header>
      <div id="notification-root"></div>
      <main>{children}</main>
      <footer>Bober Kurwazon &reg;</footer>
    </>
  );
}
