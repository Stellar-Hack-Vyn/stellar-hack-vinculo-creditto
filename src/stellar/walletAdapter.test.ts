import { describe, it, expect } from "vitest";
import { getDefaultWalletProviderForUserAgent } from "./walletAdapter";

describe("getDefaultWalletProviderForUserAgent", () => {
  it("elige Albedo en user-agents móviles habituales", () => {
    expect(
      getDefaultWalletProviderForUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      )
    ).toBe("albedo");
    expect(
      getDefaultWalletProviderForUserAgent(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
      )
    ).toBe("albedo");
  });

  it("elige Freighter en escritorio", () => {
    expect(
      getDefaultWalletProviderForUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
      )
    ).toBe("freighter");
  });

  it("cadena vacía → Freighter", () => {
    expect(getDefaultWalletProviderForUserAgent("")).toBe("freighter");
  });
});
