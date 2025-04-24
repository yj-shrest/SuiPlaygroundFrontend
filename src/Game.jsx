import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Play, Repeat, Loader } from 'lucide-react';

export default function GamePage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem("games");
    return saved ? JSON.parse(saved) : [];
  });
  const [gameHtml, setGameHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      setError(null);
      
      try {
        //extract blobid from gameId from games array
        console.log(games)
        const gameData = games.find((game) => game.game_id === gameId);
        setGame(gameData);
        console.log("Game Data:", gameData);
        const blobId = gameData?.blob_id;
        const decoder = new TextDecoder();
        const blob_id_decoded = decoder.decode(new Uint8Array(blobId));
        const response = await fetch(`http://127.0.0.1:5000/get_blob/${blob_id_decoded}`);
        if (!response.ok) {
          throw new Error("Game not found");
        }
        const data = await response.text();
        console.log(data)
        setGameHtml(data); 
        setLoading(false);
        
      } catch (err) {
        setError("Failed to load game. Please try again later.");
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const handleRemix = () => {
    alert(`Remixing Game #${gameId}... This would take you to the create page with this game as a template.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}

      {/* Main Content */}
      <main className="container mx-auto p-4 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader size={48} className="text-purple-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600">Loading game...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <>
            {/* Game Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
                  <p className="text-gray-600">{game.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Created by {game.creator_name}
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-4 md:mt-0">
                  <button 
                    className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center hover:bg-green-700 transition"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    <Play size={18} className="mr-2" />
                    {isPlaying ? 'Restart' : 'Play Game'}
                  </button>
                  
                  <button 
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg flex items-center hover:bg-purple-700 transition"
                    onClick={handleRemix}
                  >
                    <Repeat size={18} className="mr-2" />
                    Remix
                  </button>
                </div>
              </div>
              
              {isPlaying && gameHtml ?  (
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-black">
                  <iframe
                    srcDoc={gameHtml}
                    title={game.title}
                    className="w-full h-160 border-0"
                    sandbox="allow-scripts allow-same-origin"
                    allow="autoplay"
                  />
                  <div className="bg-gray-800 text-white p-4 text-center">
                    <p>Click inside the game to activate controls.</p>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="relative">
                    <img 
                      src={game.thumbnail} 
                      alt={game.title}
                      className="w-full h-96 object-cover" 
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <button 
                        className="bg-white bg-opacity-90 text-purple-700 rounded-full p-6 hover:bg-white transition"
                        onClick={() => setIsPlaying(true)}
                      >
                        <Play size={32} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Game Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Game Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Creator</h3>
                  <p>{game.creator}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Created On</h3>
                  <p>{game.createdAt}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Minted Status</h3>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${game.mintedStatus ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>{game.mintedStatus ? 'Minted on Sui Blockchain' : 'Not Minted'}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Game ID</h3>
                  <p>#{gameId}</p>
                </div>
              </div>
            </div>
            
            {/* Related Games */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Similar Games</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((relatedId) => (
                  <Link 
                    to={`/game/${parseInt(gameId) + relatedId}`} 
                    key={relatedId}
                    className="block bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition"
                  >
                    <img 
                      src={`/api/placeholder/200/120?text=Game+${parseInt(gameId) + relatedId}`} 
                      alt={`Similar Game ${relatedId}`}
                      className="w-full h-24 object-cover" 
                    />
                    <div className="p-3">
                      <h3 className="font-semibold">Related Game #{parseInt(gameId) + relatedId}</h3>
                      <p className="text-sm text-gray-600">By @creator_{relatedId}</p>
                    </div>
                  </Link>
                ))}
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