// Vercel Serverless Function: POST /api/evaluate-and-mint
// Extracted from backend/server.js

import {
  Keypair,
  rpc,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
  nativeToScVal,
} from "@stellar/stellar-sdk";

function weightedMean(deposits = []) {
  if (!deposits || deposits.length === 0) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const { amount, daysAgo } of deposits) {
    const weight = 1 / (daysAgo + 1);
    weightedSum += (amount || 0) * weight;
    totalWeight += weight;
  }
  return totalWeight === 0 ? 0 : weightedSum / totalWeight;
}

function meanAbsoluteDeviation(deposits = []) {
  if (!deposits || deposits.length === 0) return 0;
  const amounts = deposits.map((d) => d.amount || 0);
  const mean = amounts.reduce((acc, v) => acc + v, 0) / amounts.length;
  return amounts.reduce((acc, v) => acc + Math.abs(v - mean), 0) / amounts.length;
}

function computeScoreAndTier(wMean, mad, n) {
  let score = 0;
  if (wMean > 0 && mad <= wMean) {
    score = (wMean * (1 - mad / wMean)) * Math.log(n + 1);
  }
  let tier = 0;
  let tierName = "Bronce";
  if (score >= 1000) { tier = 4; tierName = "Platino"; }
  else if (score >= 500) { tier = 3; tierName = "Diamante"; }
  else if (score >= 150) { tier = 2; tierName = "Oro"; }
  else if (score >= 50) { tier = 1; tierName = "Plata"; }
  return { score: parseFloat(score.toFixed(4)), tier, tierName };
}

async function mintNftOnChain(userAddress, tier) {
  try {
    // GUARD CLAUSES: Validaciones estrictas antes de tocar el SDK de Stellar
    if (!process.env.SECRET_KEY_ADMIN) {
      throw new Error("VARIABLE FALTANTE EN VERCEL: process.env.SECRET_KEY_ADMIN no está definida.");
    }
    if (!process.env.NFT_CONTRACT_ID) {
      throw new Error("VARIABLE FALTANTE EN VERCEL: process.env.NFT_CONTRACT_ID no está definida.");
    }
    if (!userAddress) {
      throw new Error("DATO FALTANTE: No se recibió la wallet del usuario (userAddress).");
    }

    const RPC_URL = "https://soroban-testnet.stellar.org";
    const server = new rpc.Server(RPC_URL);
    
    // Si SECRET_KEY_ADMIN es undefined, aquí tronaría con "encoded argument must be of type String"
    const adminKeypair = Keypair.fromSecret(process.env.SECRET_KEY_ADMIN);
    const account = await server.getAccount(adminKeypair.publicKey());

    let transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: process.env.NFT_CONTRACT_ID,
          function: "mint",
          args: [
            nativeToScVal(adminKeypair.publicKey(), { type: "address" }),
            nativeToScVal(userAddress, { type: "address" }),
            nativeToScVal(tier, { type: "u32" }),
          ],
        })
      )
      .setTimeout(30)
      .build();

    transaction = await server.prepareTransaction(transaction);
    transaction.sign(adminKeypair);

    const submitRes = await server.sendTransaction(transaction);
    return { success: true, hash: submitRes.hash };
  } catch (error) {
    console.error("[ERROR] Mint:", error.message);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { userAddress, deposits } = req.body;
  const wMean = weightedMean(deposits);
  const mad = meanAbsoluteDeviation(deposits);
  const { tier } = computeScoreAndTier(wMean, mad, (deposits || []).length);

  if (tier >= 1) {
    const mintResult = await mintNftOnChain(userAddress, tier);
    if (mintResult.success) {
      return res.json({ txHash: mintResult.hash, status: "minted" });
    }
    return res.status(500).json({ error: mintResult.error, status: "error" });
  }

  return res.json({ message: "Nivel insuficiente", status: "pending" });
}
