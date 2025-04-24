import { useState } from "react";
import { useEnokiFlow } from "@mysten/enoki/react";
import { useLogin } from "./UserContext"; // Assuming UserContext provides userDetails
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from '@mysten/sui/bcs';

// Base64 utils are imported but not used in this snippet, kept in case needed elsewhere
// import { fromBase64, toBase64 } from "@mysten/sui/utils";

// --- Configuration Constants ---
const NETWORK = "testnet"; // Or "mainnet", "devnet"
const FULLNODE_URL = getFullnodeUrl(NETWORK);
const AI_GAME_GENERATOR_PACKAGE_ID = "0x2ef798a02023d27e258ebeba18db93aaef4d193e82c3f7f3a8013e8018083d2c";
const GAME_BOOK_OBJECT_ID = "0x4af8e47294b15c2e77218f981474e22d0ffec3fe9074d43f92564e6e2c65a877"; // Ensure this is correct for the chosen NETWORK
const DEFAULT_GAME_PROMPT = "My Awesome Game Idea"; // Example prompt

// --- Component ---
const MintGame = () => {
    const flow = useEnokiFlow();
    const { userDetails } = useLogin(); // Get user details from context
    const [txnDigest, setTxnDigest] = useState(); // Store the transaction digest
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState (); // Store potential errors

        // Function to handle game creation
        const handleCreateGame = async () => {
            if (!userDetails) {
                 setError("Please log in first.");
                 return;
            }
            if (!flow) {
                setError("Enoki Flow not available.");
                return;
            }
    
            setLoading(true);
            setTxnDigest(null); // Reset previous digest
            setError(null); // Reset previous error
    
            try {
                console.log(`Using network: ${NETWORK} (${FULLNODE_URL})`);
                const suiClient = new SuiClient({ url: FULLNODE_URL });
                // Ensure flow is available before calling getKeypair
                if (!flow) throw new Error("Enoki flow is not initialized.");
                const keypair = await flow.getKeypair({ network: NETWORK });
    
                console.log("User Address:", keypair.getPublicKey().toSuiAddress());
                console.log("GameBook Object ID:", GAME_BOOK_OBJECT_ID);
                console.log("Package ID:", AI_GAME_GENERATOR_PACKAGE_ID);
    
                const txb = new Transaction();
    
                // Define the arguments for the move call
                const gamePromptBytes = new TextEncoder().encode(DEFAULT_GAME_PROMPT);
                // const optionNoneU64 = { None: true }; // REMOVED - This is not serializable by pure
    
                
                txb.moveCall({
                    target: `${AI_GAME_GENERATOR_PACKAGE_ID}::ai_game_generator::create_game`,
                    arguments: [
                        txb.object(GAME_BOOK_OBJECT_ID),
                        txb.pure(gamePromptBytes),
                        // Use a proper BCS-encoded Option<u64>
                        // For None, we specify the option type and serialize null
                        txb.pure(bcs.option(bcs.u64()).serialize(null))
                    ],
                });
    
                console.log("Transaction block prepared. Signing and executing...");
    
                // Sign and execute the transaction
                const txnRes = await suiClient.signAndExecuteTransaction({
                    signer: keypair,
                    transaction: txb,
                    options: {
                        showEffects: true,
                        gasBudget: 100000000,
                    }
                });
    
                console.log("Transaction Response:", txnRes);
    
                // Check for successful execution and digest
                if (txnRes?.digest) {
                    console.log("Game creation successful. Digest:", txnRes.digest);
                    setTxnDigest(txnRes.digest);
                } else {
                     throw new Error("Transaction failed or digest not found in response.");
                }
    
            } catch (err) {
                console.error("Error creating game:", err);
                const errorMessage = err instanceof Error ? err.message : String(err) ?? "An unknown error occurred.";
                // Check if the error message is the one we are fixing
                if (errorMessage.includes("tx.pure must be called either a bcs type name, or a serialized bcs value")) {
                    setError(`Failed to create game: Issue with serializing arguments for the smart contract. Please check how Option<u64> is passed. Details: ${errorMessage}`);
                } else if (errorMessage.includes("RPC error")) {
                     setError(`RPC Error: Could not connect to ${NETWORK} node or issue with the request. Details: ${errorMessage}`);
                } else if (errorMessage.includes("InsufficientGas")) {
                     setError("Transaction failed: Insufficient gas. Please ensure the account has enough SUI.");
                } else {
                     setError(`Failed to create game: ${errorMessage}`);
                }
            } finally {
                setLoading(false);
            }
        };

    // Basic inline styles for demonstration (can be moved to CSS/Styled Components)
    const styles = {
        container: {
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            maxWidth: '500px',
            margin: '20px auto',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center',
        },
        button: (disabled) => ({
            padding: '10px 20px',
            fontSize: '16px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: disabled ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            opacity: disabled ? 0.6 : 1,
            marginTop: '15px',
        }),
        error: {
            color: 'red',
            marginTop: '10px',
            wordBreak: 'break-word',
        },
        success: {
            color: 'green',
            marginTop: '10px',
            wordBreak: 'break-word',
        },
         info: {
            color: '#666',
            marginTop: '10px',
            fontSize: '14px',
        },
        link: {
            color: '#007bff',
            textDecoration: 'none',
        },
    };


    return (
        <div className="mint-game-container" style={styles.container}>
            <h1>Mint New Game</h1>
            <p>This will create a new game entry on the Sui blockchain using your Enoki account.</p>

            {/* Display error message if any */}
            {error && <p style={styles.error}>Error: {error}</p>}

            {/* Display success message and digest */}
            {txnDigest && (
                <p style={styles.success}>
                    Game Created Successfully! <br />
                    Transaction Digest:{" "}
                    <a
                        href={`https://suiscan.xyz/${NETWORK}/tx/${txnDigest}`} // Updated explorer URL
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.link}
                    >
                        {txnDigest}
                    </a>
                </p>
            )}

            {/* Action Button */}
            <button
                onClick={handleCreateGame}
                disabled={loading || !userDetails || !flow} // Also disable if flow isn't ready
                style={styles.button(loading || !userDetails || !flow)}
                title={!userDetails ? "Please log in to create a game" : !flow ? "Enoki flow not ready" : ""}
            >
                {loading ? "Creating..." : "Create Game"}
            </button>

            {/* Inform user if they need to log in */}
            {!userDetails && <p style={styles.info}>Please log in to enable game creation.</p>}
        </div>
    );
}

export default MintGame;