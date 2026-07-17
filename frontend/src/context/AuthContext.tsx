import { createContext } from "react";

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<
    | { type: "login_error"; error: LoginAPIError }
    | { type: "validation_error"; errors: string[] }
    | undefined
  >;
  logout: () => Promise<undefined | "missing_token" | "token_not_found">;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
