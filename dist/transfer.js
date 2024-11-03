"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bs58_1 = __importDefault(require("bs58"));
// Establish connection
const connection = new web3_js_1.Connection("https://stylish-wild-bird.solana-mainnet.quiknode.pro/b1b7bb08ea2bfb45b7a177203de466fd304a80e6", {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 120000,
});
// Wallet keys and target public key
const compromisedWallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode("xr5MfsZAM94mASQwVPhkPWLKCYgBpE4XURpFnMRc1gRQTo9iUMJQBjmi3iCiDjDiEeKUnkszD73aRkwkGBj4pfc"));
const safeWalletPublicKey = new web3_js_1.PublicKey("91xVvgKTF88F284gTK6ihnUxQ4AqyYn311yy69AHguST");
// Function to set authority
async function authorizeTransfer(tokenAccount, newAuthority) {
    // Set the authority for the token account to the safe wallet
    await (0, spl_token_1.setAuthority)(connection, compromisedWallet, // Current authority (compromised wallet)
    tokenAccount, compromisedWallet.publicKey, // Current authority public key
    spl_token_1.AuthorityType.AccountOwner, // Type of authority being transferred
    newAuthority // New authority (safe wallet public key)
    );
    console.log(`Authority granted to ${newAuthority.toBase58()}`);
}
// Function to transfer SPL tokens
async function transferSPLToken(tokenAccount, tokenMint, amount) {
    // Create the transfer instruction and send transaction
    const signature = await (0, spl_token_1.transfer)(connection, compromisedWallet, tokenAccount, safeWalletPublicKey, compromisedWallet.publicKey, amount);
    await connection.confirmTransaction({
        signature,
        blockhash: (await connection.getLatestBlockhash()).blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
    });
    console.log(`SPL Token Transfer successful: ${signature}`);
}
// Execute the authorization and SPL transfer
(async () => {
    // Example token account and mint (replace with actual token account and mint addresses)
    const tokenAccount = new web3_js_1.PublicKey("SavR1E3cvckV6T2JEEM2T8bqeS8BzeiJ9NoTUUNaQwV");
    const tokenMint = new web3_js_1.PublicKey("So11111111111111111111111111111111111111112");
    // Grant authority to safe wallet
    await authorizeTransfer(tokenAccount, safeWalletPublicKey);
    // Transfer tokens to safe wallet
    await transferSPLToken(tokenAccount, tokenMint, 1 * web3_js_1.LAMPORTS_PER_SOL);
})();
