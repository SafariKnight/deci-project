import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const hookData = useContext(AuthContext);
  if (!hookData) {
    throw new Error("AuthContext used outside of AuthProvider");
  }
  return hookData;
}
