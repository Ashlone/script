"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bs58 = require('bs58');
// Configure your RPC connection to the Solana network
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
// Compromised Wallet - replace with the actual private key of the compromised wallet
const compromisedWallet = Keypair.fromSecretKey(bs58.decode("Qk6xwRF4Pbcx8gsFTLqVdntS3pVaeuSDRVxjgqCuTY6RvZt2Dign7rnpkt8V3qZ2Xm1c2uikP3NSZFvVGRjGRhC"));
// Safe Wallet - this is where you want to send the assets
const safeWalletPublicKey = new PublicKey("91xVvgKTF88F284gTK6ihnUxQ4AqyYn311yy69AHguST");
// Function to transfer funds from the compromised wallet to the safe wallet
function transferFunds() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check balance of the compromised wallet
            const balance = yield connection.getBalance(compromisedWallet.publicKey);
            console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
            if (balance <= 0) {
                console.log('No funds available to transfer.');
                return;
            }
            // Create a transaction to transfer all SOL from the compromised wallet to the safe wallet
            const transaction = new Transaction().add(SystemProgram.transfer({
                fromPubkey: compromisedWallet.publicKey,
                toPubkey: safeWalletPublicKey,
                lamports: balance - 5000, // Leave a small amount for transaction fees
            }));
            // Sign and send the transaction
            const signature = yield connection.sendTransaction(transaction, [compromisedWallet]);
            console.log('Transfer transaction sent. Signature:', signature);
            // Confirm the transaction
            const confirmation = yield connection.confirmTransaction(signature, 'confirmed');
            console.log('Transfer confirmed:', confirmation);
        }
        catch (error) {
            console.error('Error during transfer:', error);
        }
    });
}
// Execute the transfer function
transferFunds();
