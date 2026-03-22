import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import WalletSetupModal from "./WalletSetupModal";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user-id" } }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

vi.mock("@albedo-link/intent", () => ({
  default: {
    publicKey: vi.fn().mockResolvedValue({
      pubkey: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    }),
    tx: vi.fn(),
  },
}));

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn().mockResolvedValue(false),
  requestAccess: vi.fn(),
  signTransaction: vi.fn(),
}));

describe("WalletSetupModal (flujo móvil / Albedo)", () => {
  const mobileUA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  let originalDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "userAgent");
    Object.defineProperty(window.navigator, "userAgent", {
      value: mobileUA,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(window.navigator, "userAgent", originalDescriptor);
    }
    vi.clearAllMocks();
  });

  it("muestra Albedo como opción móvil y completa conexión simulada con Albedo", async () => {
    const albedo = await import("@albedo-link/intent");
    const onComplete = vi.fn();

    render(<WalletSetupModal onComplete={onComplete} />);

    expect(screen.getByText("Ideal en móvil")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Abrir Albedo/i }));

    await waitFor(() => {
      expect(albedo.default.publicKey).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/GAAAA/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Wallet conectada/i)).toBeInTheDocument();
    });
  });
});
