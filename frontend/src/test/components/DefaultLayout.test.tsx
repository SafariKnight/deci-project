import { screen, waitFor } from "@testing-library/react";
import { DefaultLayout } from "../../layouts/DefaultLayout.tsx";
import { renderWithProviders } from "../utils.tsx";
import { clearAccessToken } from "../../access.ts";

const loggedInUser: User = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "USER",
};

describe("DefaultLayout", () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it("shows Guest link when not logged in", async () => {
    renderWithProviders(
      <DefaultLayout>
        <p>Page content</p>
      </DefaultLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText("Guest")).toBeInTheDocument();
    });
    expect(screen.getByText("BOBER KURWAZON")).toBeInTheDocument();
  });

  it("shows username when logged in", async () => {
    renderWithProviders(
      <DefaultLayout>
        <p>Page content</p>
      </DefaultLayout>,
      { user: loggedInUser },
    );

    await waitFor(() => {
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });
    expect(screen.queryByText("Guest")).not.toBeInTheDocument();
  });

  it("shows Cart link in the header", () => {
    renderWithProviders(
      <DefaultLayout>
        <p>Page content</p>
      </DefaultLayout>,
    );

    expect(screen.getByText("Cart")).toBeInTheDocument();
  });

  it("renders children in main section", async () => {
    renderWithProviders(
      <DefaultLayout>
        <p>Page content</p>
      </DefaultLayout>,
    );

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
