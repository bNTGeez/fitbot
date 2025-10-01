import { useUser } from "@auth0/nextjs-auth0";

// Client-side user check (for client components)
export function useCheckUser() {
  const { user, isLoading, error } = useUser();

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
