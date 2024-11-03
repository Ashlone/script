import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
    SendTransactionError,
} from "@solana/web3.js";
import bs58 from "bs58";

const connection = new Connection(
    "https://stylish-wild-bird.solana-mainnet.quiknode.pro/b1b7bb08ea2bfb45b7a177203de466fd304a80e6",
    {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 120000,
    }
);

const compromisedWallet = Keypair.fromSecretKey(
    bs58.decode(
        "xr5MfsZAM94mASQwVPhkPWLKCYgBpE4XURpFnMRc1gRQTo9iUMJQBjmi3iCiDjDiEeKUnkszD73aRkwkGBj4pfc"
    )
);

const safeWalletPublicKey = new PublicKey(
    "91xVvgKTF88F284gTK6ihnUxQ4AqyYn311yy69AHguST"
);

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLatestBlockhash() {
    const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('finalized');
    return { blockhash, lastValidBlockHeight };
}

async function checkTransactionStatus(
    signature: string,
    lastValidBlockHeight: number,
    maxRetries = 30
): Promise<boolean> {
    let retries = 0;

    while (retries < maxRetries) {
        const currentBlockHeight = await connection.getBlockHeight();

        if (currentBlockHeight > lastValidBlockHeight) {
            return false;
        }

        const status = await connection.getSignatureStatus(signature);

        if (status?.value?.confirmationStatus === 'confirmed' ||
            status?.value?.confirmationStatus === 'finalized') {
            return true;
        }

        if (status?.value?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }

        await sleep(1000);
        retries++;
    }

    return false;
}

async function createAndSignTransaction(
    transferAmount: number,
    blockhash: string
): Promise<Transaction> {
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: compromisedWallet.publicKey,
            toPubkey: safeWalletPublicKey,
            lamports: transferAmount,
        })
    );

    transaction.feePayer = compromisedWallet.publicKey;
    transaction.recentBlockhash = blockhash;
    transaction.sign(compromisedWallet);

    return transaction;
}

async function transferFunds(amountToSend = LAMPORTS_PER_SOL, maxAttempts = 5) {
    let attempt = 0;

    while (attempt < maxAttempts) {
        try {
            console.log(`\nAttempt ${attempt + 1}/${maxAttempts}`);

            // Get current balance
            const balance = await connection.getBalance(compromisedWallet.publicKey);
            console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

            // Estimate the fee (using a static value as an example; adjust if necessary)
            const estimatedFee = await connection.getMinimumBalanceForRentExemption(0); // Or a static fee value
            const totalAmount = amountToSend + estimatedFee;

            // Check if there's enough balance to send the specified amount plus fees
            if (balance < totalAmount) {
                throw new Error('Insufficient balance for the transfer and transaction fees.');
            }

            // Get latest blockhash
            const { blockhash, lastValidBlockHeight } = await getLatestBlockhash();

            // Create a transaction to send the specified amount
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: compromisedWallet.publicKey,
                    toPubkey: safeWalletPublicKey, // Ensure this is the correct destination address
                    lamports: amountToSend, // 1 SOL
                })
            );

            transaction.recentBlockhash = blockhash;
            transaction.feePayer = compromisedWallet.publicKey;

            // Sign the transaction
            transaction.sign(compromisedWallet);

            // Log the amount being sent
            console.log(`Sending ${amountToSend / LAMPORTS_PER_SOL} SOL...`);

            // Send transaction
            console.log('Sending transaction...');
            const signature = await connection.sendRawTransaction(
                transaction.serialize()
            );

            console.log(`Transaction sent: ${signature}`);
            console.log('Checking transaction status...');

            // Check transaction status
            const confirmation = await connection.confirmTransaction(signature);
            if (confirmation.value.err) {
                throw new Error('Transaction failed: ' + confirmation.value.err.toString());
            }

            console.log('Transaction confirmed successfully!');
            console.log(`View on Solscan: https://solscan.io/tx/${signature}`);

            // Verify final balance
            const newBalance = await connection.getBalance(compromisedWallet.publicKey);
            console.log(`New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);

            return signature; // Return the transaction signature
        } catch (error:any) {
            console.error(`Attempt ${attempt + 1} failed:`, error.message);
            await sleep(2000); // Wait before retrying
        }

        attempt++;
    }

    throw new Error(`Failed to complete transfer after ${maxAttempts} attempts`);
}

// Execute transfer
console.log('Starting transfer process...');
transferFunds(1 * LAMPORTS_PER_SOL) // Attempt to send 1 SOL
    .then(signature => {
        console.log('Transfer completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Transfer failed after all attempts:', error.message);
        process.exit(1);
    });
