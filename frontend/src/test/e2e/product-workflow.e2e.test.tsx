import { screen, waitFor } from "@testing-library/react";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";
import { Root } from "../../routes/+page.tsx";
import { vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("wouter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("wouter")>();
  return {
    ...mod,
    useLocation: () => ["/", mockNavigate],
  };
});

describe("Product workflow: browse, view details, add review, add to cart", () => {
  beforeEach(() => {
    clearAccessToken();
    mockNavigate.mockClear();
    server.resetHandlers();
  });

  it("Step 1: browses products on home page", async () => {
    setAccessToken("valid-token");

    renderWithProviders(<Root />);

    await waitFor(() => {
      expect(screen.getByText("Red Chair")).toBeInTheDocument();
    });
    expect(screen.getByText("Blue Table")).toBeInTheDocument();
    expect(screen.getByText("+ Create Product")).toBeInTheDocument();
  });
});
