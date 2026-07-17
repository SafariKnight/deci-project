import { useEffect, useRef, forwardRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Notification.module.css";

const ONE_SECOND = 1000; // 1 second in miliseconds

export const Notification = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    seconds: number;
  }
>(({ children, seconds }, ref) => {
  const localRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  function handleToggle(e: React.ToggleEvent<HTMLDivElement>) {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (e.newState === "open")
      timerRef.current = setTimeout(() => {
        if (localRef.current && localRef.current.matches(":popover-open"))
          localRef.current?.hidePopover();
      }, seconds * ONE_SECOND);
  }

  useEffect(() => {
    setPortalTarget(document.getElementById("notification-root"));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleClick() {
    localRef.current?.hidePopover();
  }

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  const content = (
    <div
      className={styles.notification}
      popover="manual"
      ref={setRefs}
      onBeforeToggle={handleToggle}
      onClick={handleClick}
    >
      {children}
    </div>
  );

  return portalTarget ? createPortal(content, portalTarget) : content;
});

Notification.displayName = "Notification";
