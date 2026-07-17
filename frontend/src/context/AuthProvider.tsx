import { useCallback, useMemo } from "react";
import { AuthContext } from "./AuthContext";
import { apiClient } from "../axios";
import { clearAccessToken, setAccessToken } from "../access";
import axios, { AxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User, AxiosError>({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await apiClient.get<User>("/auth/me");
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logout = useCallback(async () => {
    try {
      await apiClient.get<null>("/auth/logout");
    } catch (e) {
      if (
        axios.isAxiosError<{
          message: string;
          error: "missing_token" | "token_not_found";
        }>(e) &&
        e.response
      ) {
        return e.response.data.error;
      }
    } finally {
      clearAccessToken();
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["cart"] });
    }
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await apiClient.post<LoginResponse>("/auth/login", {
          email,
          password,
        });

        const { accessToken, user: newUser } = result.data;
        setAccessToken(accessToken);
        queryClient.setQueryData(["user"], newUser);
        queryClient.removeQueries({ queryKey: ["cart"] });
      } catch (e) {
        if (
          axios.isAxiosError<{ errors: string[] }>(e) &&
          e.response &&
          e.status === 422
        ) {
          return {
            errors: e.response.data.errors,
            type: "validation_error" as const,
          };
        }
        if (
          axios.isAxiosError<{ message: string; error: LoginAPIError }>(e) &&
          e.response
        ) {
          return { error: e.response.data.error, type: "login_error" as const };
        }
        throw e;
      }
    },
    [queryClient],
  );

  const refresh = useCallback(async () => {
    try {
      const result = await apiClient.get<RefreshResponse>("/auth/refresh");
      setAccessToken(result.data.accessToken);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch {
      clearAccessToken();
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["cart"] });
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ user: user ?? null, login, isLoading, refresh, logout }),
    [user, login, isLoading, refresh, logout],
  );
  return (
    <AuthContext.Provider value={value}> {children} </AuthContext.Provider>
  );
}
