import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { DefaultLayout } from "./DefaultLayout";
import { useEffect } from "react";

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!user) {
      navigate(`/auth/login?redirect=${location}`, { replace: true });
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <DefaultLayout>{children}</DefaultLayout>;
}
