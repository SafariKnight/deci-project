import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Controls.module.css";
import { apiClient } from "../../../axios";
import { Notification } from "../../../components/Notification";
import { useQueryClient } from "@tanstack/react-query";

export function Controls({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const confirmRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [newRole, setNewRole] = useState<Role>("USER");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const confirmEl = confirmRef.current;
    const roleEl = roleRef.current;

    function handleClose(): (this: HTMLDivElement, ev: ToggleEvent) => any {
      return (e) => {
        const event = e as ToggleEvent;

        if (event.newState === "closed") {
          roleEl?.hidePopover();
        }
      };
    }

    confirmEl?.addEventListener("toggle", handleClose());
    return () => {
      confirmEl?.removeEventListener("toggle", handleClose());
    };
  }, []);

  const changeRole = useCallback(async () => {
    try {
      const res = await apiClient.post("/auth/change-role", {
        id: parseInt(userId),
        newRole,
      });

      if (res.status === 204) {
        confirmRef.current?.hidePopover();
        await queryClient.invalidateQueries({ queryKey: ["user", userId] });
        await queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    } catch (e: any) {
      setErrorMessage(e.response?.data?.message || "Failed to change role");
      notificationRef.current?.showPopover();
    }
  }, [userId, newRole, queryClient]);

  return (
    <div>
      <div
        ref={roleRef}
        className={styles.rolePopover}
        id="role-popover"
        popover="auto"
      >
        <button
          popoverTarget="role-confirm"
          popoverTargetAction="show"
          onClick={() => setNewRole("USER")}
        >
          User
        </button>
        <button
          popoverTarget="role-confirm"
          popoverTargetAction="show"
          onClick={() => setNewRole("ADMIN")}
        >
          Admin
        </button>
        <button
          popoverTarget="role-confirm"
          popoverTargetAction="show"
          onClick={() => setNewRole("OWNER")}
        >
          Owner
        </button>
      </div>

      <div
        ref={confirmRef}
        className={styles.roleConfirm}
        id="role-confirm"
        popover="auto"
      >
        <p>Are you sure? ({newRole})</p>
        <div className={styles.confirmButtons}>
          <button className={styles.confirmAccept} onClick={changeRole}>
            ✔
          </button>
          <button
            className={styles.confirmReject}
            popoverTarget="role-confirm"
            popoverTargetAction="hide"
          >
            ✖
          </button>
        </div>
      </div>

      <button
        className={styles.roleButton}
        popoverTarget="role-popover"
        style={{ anchorName: "role-button" }}
      >
        Change Role
      </button>

      <Notification ref={notificationRef} seconds={5}>
        <p>{errorMessage}</p>
      </Notification>
    </div>
  );
}
