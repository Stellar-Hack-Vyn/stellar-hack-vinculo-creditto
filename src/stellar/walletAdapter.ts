import albedo from "@albedo-link/intent";
import { isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";

export type WalletProvider = "freighter" | "albedo";

const STORAGE_KEY = "vyn_wallet_provider";

/** Usado al abrir el modal: Albedo por defecto en navegadores móviles típicos. */
export function getDefaultWalletProviderForUserAgent(userAgent: string): WalletProvider {
  if (!userAgent) return "freighter";
  return /Mobile|Android|iPhone|iPad/i.test(userAgent) ? "albedo" : "freighter";
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `vyn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getStoredWalletProvider(): WalletProvider {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "albedo" || v === "freighter") return v;
  return "freighter";
}

export function setStoredWalletProvider(p: WalletProvider): void {
  localStorage.setItem(STORAGE_KEY, p);
}

export async function requestPublicKey(
  provider: WalletProvider
): Promise<{ address: string | null; error?: string }> {
  if (provider === "albedo") {
    try {
      const { pubkey } = await albedo.publicKey({ token: randomToken() });
      return { address: pubkey };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Albedo canceló la conexión";
      return { address: null, error: msg };
    }
  }

  const connected = await isConnected();
  if (!connected) {
    return { address: null, error: "Freighter no está instalado. Usa Albedo en móvil o instala la extensión." };
  }

  const access = await requestAccess();
  if (access.error || !access.address) {
    return { address: null, error: "Conexión rechazada en Freighter." };
  }
  return { address: access.address };
}

/**
 * Firma una transacción ya preparada (Soroban u otra) en testnet.
 * Para Albedo, pasa `pubkey` con la cuenta registrada para que coincida con el origen de la tx.
 */
export async function signPreparedTransaction(
  xdr: string,
  provider: WalletProvider,
  options?: { pubkey?: string }
): Promise<{ signedTxXdr: string | null; error?: string }> {
  if (provider === "albedo") {
    try {
      const { signed_envelope_xdr } = await albedo.tx({
        xdr,
        network: "testnet",
        submit: false,
        pubkey: options?.pubkey,
      });
      return { signedTxXdr: signed_envelope_xdr };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Firma cancelada en Albedo";
      return { signedTxXdr: null, error: msg };
    }
  }

  const res = await signTransaction(xdr, { networkPassphrase: Networks.TESTNET });
  if (res.error || !res.signedTxXdr) {
    return { signedTxXdr: null, error: "Firma cancelada en Freighter." };
  }
  return { signedTxXdr: res.signedTxXdr };
}
