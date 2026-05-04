import { render, screen } from "@testing-library/react";

describe("Vitest harness", () => {
  it("renders a basic React component", () => {
    render(<div>Hello LightWeight</div>);
    expect(screen.getByText("Hello LightWeight")).toBeInTheDocument();
  });
});
