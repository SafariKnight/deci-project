import { screen, waitFor } from "@testing-library/react";
import { AuthenticatedLayout } from "../../layouts/AuthenticatedLayout.tsx";
import { renderWithProviders } from "../utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";

describe("AuthenticatedLayout", () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it("shows children when authenticated", async () => {
    setAccessToken("valid-token");

    renderWithProviders(
      <AuthenticatedLayout>
        <p>Protected content</p>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText("Protected content")).toBeInTheDocument();
    });
  });

  it("shows loading state while auth is being determined", async () => {
    // Don't set a token, but override the MSW handler to delay
    renderWithProviders(
      <AuthenticatedLayout>
        <p>Protected content</p>
      </AuthenticatedLayout>,
    );

    // Should show loading initially while the /auth/me request is in flight
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
