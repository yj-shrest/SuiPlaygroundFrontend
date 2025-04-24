import { useState, useEffect } from 'react';
import { Send, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { useEnokiFlow } from "@mysten/enoki/react";
import { useLogin } from "./UserContext"; 
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from '@mysten/sui/bcs';

const NETWORK = "testnet"; 
const FULLNODE_URL = getFullnodeUrl(NETWORK);
const AI_GAME_GENERATOR_PACKAGE_ID = "0x2ef798a02023d27e258ebeba18db93aaef4d193e82c3f7f3a8013e8018083d2c";
const GAME_BOOK_OBJECT_ID = "0x789a6d929373f6dfac6750b5258605e0315e3dec896e2d4d758823be65168541"; 
const DEFAULT_GAME_PROMPT = "My Awesome Game Idea"; 

export default function Create() {
  const [prompt, setPrompt] = useState('');
  const [gameConfig, setGameConfig] = useState(null);
  const [gameHtml, setGameHtml] = useState(null);
  const [blobId, setBlobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackPrompt, setFeedbackPrompt] = useState('');
  const [error, setError] = useState(null);
  const flow = useEnokiFlow();
  const { userDetails } = useLogin(); 
  const [txnDigest, setTxnDigest] = useState(); 

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ prompt: prompt }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setGameConfig(data);
        setLoading(false);
      } else {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
      }
    } catch (err) {
      setError("Failed to generate game configuration. Please try again.", err);
      console.error("Error:", err);
      setLoading(false);
    }
  };
  
  const handleConfigSubmit = async () => {
    if (!gameConfig) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/create_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameConfig: gameConfig }),
      });
        if (response.ok) {
            const data = await response.json(); 
            console.log(data);
            setGameHtml(data.html); 
            setLoading(false);
        } else {
            const errorText = await response.text();
            console.error("Backend error:", errorText);
        }
      
    } catch (err) {
      setError("Failed to generate game. Please try again.");
      setLoading(false);
    }
  };
  
  const handleFeedbackSubmit = async () => {
    if (!feedbackPrompt.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
     const response = await fetch('http://127.0.0.1:5000/update_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackPrompt: feedbackPrompt, gameHtml: gameHtml }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setGameHtml(data.html); 
        setLoading(false);
      } else {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
      }
      
    } catch (err) {
      setError("Failed to update game. Please try again.");
      setLoading(false);
    }
  };

  const store_blob = async () => {
    if (!gameHtml) return;

    try {
      const response = await fetch('http://127.0.1:5000/store_blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameHtml: gameHtml }),
      });
      if (response.ok) {
        const data = await response.json(); 
        console.log(data);
        setBlobId(data.blobId); 
      }
      else {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
      }
    } catch (err) {
      setError("Failed to get blob. Please try again.");
    }
  };

  const handleMint = async () => {
    try {
      await store_blob(); 
      console.log("Blob ID:", blobId); 
      await handleCreateGame();
    }
    catch (err) {
      setError("Failed to mint game. Please try again.");
      console.error("Error:", err);
    }
  };
  
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
    setTxnDigest(null); 
    setError(null); 

    try {
        console.log(`Using network: ${NETWORK} (${FULLNODE_URL})`);
        const suiClient = new SuiClient({ url: FULLNODE_URL });
        if (!flow) throw new Error("Enoki flow is not initialized.");
        const keypair = await flow.getKeypair({ network: NETWORK });

        console.log("User Address:", keypair.getPublicKey().toSuiAddress());
        console.log("GameBook Object ID:", GAME_BOOK_OBJECT_ID);
        console.log("Package ID:", AI_GAME_GENERATOR_PACKAGE_ID);

        const txb = new Transaction();

        const gamePromptBytes = new TextEncoder().encode(blobId);

        txb.moveCall({
            target: `${AI_GAME_GENERATOR_PACKAGE_ID}::ai_game_generator::create_game`,
            arguments: [
                txb.object(GAME_BOOK_OBJECT_ID),       
                txb.pure(gamePromptBytes, 'vector<u8>'),    
                txb.pure(bcs.option(bcs.u64()).serialize(null), 'Option<u64>')
            ],
        });

        console.log("Transaction block prepared. Signing and executing...");

        const txnRes = await suiClient.signAndExecuteTransaction({
            signer: keypair,
            transaction: txb,
            options: {
                showEffects: true,
            }
        });

        console.log("Transaction Response:", txnRes);

        if (txnRes?.digest) {
            console.log("Game creation successful. Digest:", txnRes.digest);
            setTxnDigest(txnRes.digest);
        } else {
             throw new Error("Transaction failed or digest not found in response.");
        }

    } catch (err) {
        console.error("Error creating game:", err);
        const errorMessage = err instanceof Error ? err.message : String(err) ?? "An unknown error occurred.";
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
  
  const updateConfigValue = (key, value) => {
    setGameConfig({
      ...gameConfig,
      [key]: value
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="mr-4">
              <ArrowLeft size={20} />
            </a>
            <h1 className="text-2xl font-bold">Create Your Game</h1>
          </div>
          <button className="px-4 py-2 bg-sky-500 rounded-md hover:bg-purple-600 transition">
            Connect Wallet
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 flex-1">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}
        
        {!gameConfig && !gameHtml && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Describe Your Game</h2>
            <p className="text-gray-600 mb-4">
              Provide a detailed description of the game you want to create. Include gameplay mechanics, 
              visual style, characters, and any other important details.
            </p>
            
            <div className="mb-4">
              <textarea
                className="w-full p-4 border border-gray-300 rounded-lg h-32"
                placeholder="Example: Create a space shooter game where the player controls a spaceship and fights alien enemies. The game should have power-ups, multiple levels, and a boss at the end."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <button 
                className="px-6 py-3 bg-purple-600 text-white rounded-lg flex items-center hover:bg-purple-700 transition disabled:bg-gray-400"
                onClick={handlePromptSubmit}
                disabled={loading || !prompt.trim()}
              >
                {loading ? 'Generating...' : (
                  <>
                    <Send size={18} className="mr-2" /> Generate Game
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {gameConfig && !gameHtml && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Customize Your Game</h2>
            <p className="text-gray-600 mb-4">
              Review and edit the generated game configuration before creating your game.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
              {Object.entries(gameConfig).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  {Array.isArray(value) ? (
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={value.join(', ')}
                      onChange={(e) => updateConfigValue(key, e.target.value.split(', '))}
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={value}
                      onChange={(e) => updateConfigValue(key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button 
                className="px-6 py-3 bg-purple-600 text-white rounded-lg flex items-center hover:bg-purple-700 transition disabled:bg-gray-400"
                onClick={handleConfigSubmit}
                disabled={loading}
              >
                {loading ? 'Creating...' : (
                  <>
                    <Save size={18} className="mr-2" /> Create Game
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {gameHtml && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Your Game</h2>
              
              <div className="border border-gray-300 rounded-lg mb-6 overflow-hidden">
              <iframe
                srcDoc={gameHtml}
                title="Game Preview"
                className="w-full h-160 border-0"
                sandbox="allow-scripts allow-same-origin"
                allow="autoplay"
                onLoad={() => {
                    document.querySelector('iframe').focus();
                }}
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <textarea
                    className="w-full p-4 border border-gray-300 rounded-lg h-20"
                    placeholder="Describe any changes you'd like to make to your game..."
                    value={feedbackPrompt}
                    onChange={(e) => setFeedbackPrompt(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition disabled:bg-gray-400"
                    onClick={handleFeedbackSubmit}
                    disabled={loading || !feedbackPrompt.trim()}
                  >
                    {loading ? 'Updating...' : 'Update Game'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold mb-2">Ready to mint your game?</h2>
                  <p className="opacity-80 mb-4 md:mb-0">
                    Minting will require some SUI tokens as fees. Your game will be stored on the Sui blockchain.
                  </p>
                </div>
                <button 
                  className="px-8 py-4 bg-white text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition"
                  onClick={handleMint}
                >
                  Mint This Game
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>SuiPlayground - Generate, Remix, Mint AI Games on Sui</p>
        </div>
      </footer>
    </div>
  );
}