import { render, screen } from "@testing-library/react";
import { Notification } from "../../components/Notification.tsx";

describe("Notification", () => {
  it("renders children content", () => {
    render(<Notification seconds={5}>Hello World</Notification>);

    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders complex children (html elements)", () => {
    render(
      <Notification seconds={3}>
        <ul>
          <li>Error 1</li>
          <li>Error 2</li>
        </ul>
      </Notification>,
    );

    expect(screen.getByText("Error 1")).toBeInTheDocument();
    expect(screen.getByText("Error 2")).toBeInTheDocument();
  });
});
