import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, setAccessToken } from "../../access.ts";
import { CreateProductPage } from "../../routes/product/create/+page.tsx";
import { vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("wouter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("wouter")>();
  return {
    ...mod,
    useLocation: () => ["/", mockNavigate],
  };
});

describe("CreateProductPage", () => {
  beforeEach(() => {
    clearAccessToken();
    setAccessToken("valid-token");
    mockNavigate.mockClear();
  });

  it("renders the form with all required fields", async () => {
    renderWithProviders(<CreateProductPage />);

    expect(screen.getByText("Create New Product")).toBeInTheDocument();
    expect(screen.getByText("Product Name")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Product Image")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });
});
