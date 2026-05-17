import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

describe("ConfirmModal", () => {
  const defaultProps = {
    title: "Eliminar element",
    message: "Estàs segur que vols eliminar aquest element?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderitza el títol, el missatge i els botons", () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText("Eliminar element")).toBeInTheDocument();
    expect(
      screen.getByText("Estàs segur que vols eliminar aquest element?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();
  });

  it("crida onConfirm en fer clic al botó de confirmació", () => {
    render(<ConfirmModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("crida onCancel en fer clic al botó de cancel·lació", () => {
    render(<ConfirmModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("desactiva els botons quan loading és true", () => {
    render(<ConfirmModal {...defaultProps} loading={true} />);

    // El botó de cancel·lació segueix amb text "Cancelar"
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    // El botó de confirmació mostra "..." quan loading és true; es verifiquen els 2 desactivats
    const disabled = screen
      .getAllByRole("button")
      .filter((b) => b.hasAttribute("disabled"));
    expect(disabled).toHaveLength(2);
  });

  it("usa les etiquetes personalitzades quan es proporcionen", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Sí, elimina"
        cancelLabel="No, torna"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Sí, elimina" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "No, torna" }),
    ).toBeInTheDocument();
  });
});
