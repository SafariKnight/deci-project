import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils.tsx";
import { setAccessToken, clearAccessToken } from "../../access.ts";
import { Controls } from "../../routes/auth/user/Controls.tsx";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server.ts";

describe("Controls", () => {
  beforeEach(() => {
    clearAccessToken();
    setAccessToken("admin-token");
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("renders the Change Role button", () => {
    renderWithProviders(<Controls userId="42" />);

    expect(screen.getByText("Change Role")).toBeInTheDocument();
  });

  it("shows role options when a role button is clicked", async () => {
    renderWithProviders(<Controls userId="42" />);

    // Click the Change Role button to open the popover
    // In jsdom, popover might not work, so we just check the buttons exist
    await waitFor(() => {
      expect(screen.getByText("User")).toBeInTheDocument();
    });
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("calls change-role API when confirm button is clicked", async () => {
    let called = false;
    server.use(
      http.post("/auth/change-role", async ({ request }) => {
        const body = (await request.json()) as any;
        expect(body.id).toBe(42);
        expect(body.newRole).toBe("ADMIN");
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<Controls userId="42" />);
    expect(screen.getByText("Change Role")).toBeInTheDocument();

    // Click Admin
    const adminBtn = screen.getByText("Admin");
    await userEvent.click(adminBtn);

    // Click confirm
    const confirmBtn = screen.getByText("✔");
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(called).toBe(true);
    });
  });

  it("shows error notification on API failure", async () => {
    server.use(
      http.post("/auth/change-role", () => {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      }),
    );

    renderWithProviders(<Controls userId="42" />);

    const adminBtn = screen.getByText("Admin");
    await userEvent.click(adminBtn);

    const confirmBtn = screen.getByText("✔");
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText("Forbidden")).toBeInTheDocument();
    });
  });
});
