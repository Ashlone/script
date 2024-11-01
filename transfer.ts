import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
const bs58 = require("bs58");

// Use a more reliable RPC endpoint with higher rate limits
const connection = new Connection(
  "https://solana-mainnet.g.alchemy.com/v2/ZrgRn5nwESME47Br4AE0T-GftbmT9VYi", // Replace with your Alchemy API key
  "confirmed"
);

// Compromised Wallet - replace with the actual private key of the compromised wallet
const compromisedWallet = Keypair.fromSecretKey(
  bs58.decode(
    "Qk6xwRF4Pbcx8gsFTLqVdntS3pVaeuSDRVxjgqCuTY6RvZt2Dign7rnpkt8V3qZ2Xm1c2uikP3NSZFvVGRjGRhC"
  )
);

// Safe Wallet - this is where you want to send the assets
const safeWalletPublicKey = new PublicKey(
  "91xVvgKTF88F284gTK6ihnUxQ4AqyYn311yy69AHguST"
);

async function transferFunds() {
  try {
    // Check balance of the compromised wallet
    const balance = await connection.getBalance(compromisedWallet.publicKey);
    console.log(`Wallet address: ${compromisedWallet.publicKey.toString()}`);
    console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance <= 0) {
      console.log("No funds available to transfer.");
      return;
    }

    // Calculate the minimum balance for rent exemption (to avoid account closure)
    //const minBalanceForRentExemption =await connection.getMinimumBalanceForRentExemption(0);
    //const fee = 5000; // Standard fee in lamports
    //const safetyMargin = 10000; // Extra safety margin in lamports
    //const totalDeduction = minBalanceForRentExemption + fee + safetyMargin;

    // Calculate amount to transfer (leaving enough for fees and rent)
    const transferAmount = 10000;

    if (transferAmount <= 0) {
      console.log("Balance too low to transfer after accounting for fees.");
      return;
    }

    console.log(
      `Attempting to transfer ${transferAmount / LAMPORTS_PER_SOL} SOL`
    );

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: compromisedWallet.publicKey,
        toPubkey: safeWalletPublicKey,
        lamports: transferAmount,
      })
    );

    // Get latest blockhash
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = compromisedWallet.publicKey;

    // Sign and send transaction
    console.log("Sending transaction...");
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [compromisedWallet],
      {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );

    console.log("Transfer successful!");
    console.log("Signature:", signature);
    console.log(`Transaction explorer: https://solscan.io/tx/${signature}`);

    // Verify new balance
    const newBalance = await connection.getBalance(compromisedWallet.publicKey);
    console.log(`New wallet balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
  } catch (error: any) {
    console.error("Error details:", error);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
  }
}

// Execute the transfer
console.log("Starting transfer process...");
transferFunds()
  .then(() => {
    console.log("Transfer process completed.");
  })
  .catch((err) => {
    console.error("Critical error:", err);
  });
