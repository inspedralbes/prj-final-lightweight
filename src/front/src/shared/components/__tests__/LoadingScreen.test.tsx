import { render, screen } from "@testing-library/react";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

describe("LoadingScreen", () => {
  it("no es renderitza quan isVisible és false", () => {
    const { container } = render(
      <LoadingScreen isVisible={false} message="Carregant..." />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("es renderitza amb el missatge quan isVisible és true", () => {
    render(<LoadingScreen isVisible={true} message="Iniciant sessió..." />);

    expect(screen.getByText("Iniciant sessió...")).toBeInTheDocument();
  });

  it("usa el missatge per defecte quan no es proporciona cap", () => {
    render(<LoadingScreen isVisible={true} />);

    expect(screen.getByText("Iniciando sesión...")).toBeInTheDocument();
  });
});
