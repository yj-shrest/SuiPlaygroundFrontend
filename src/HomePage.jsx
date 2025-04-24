import { useState, useEffect, use } from 'react';
import { Search, Plus, ChevronRight, User, LogOut } from 'lucide-react';
import { useLogin } from './UserContext';
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
const NETWORK = "testnet";
const FULLNODE_URL = getFullnodeUrl(NETWORK);
const objectId =
  "0x6beae9325f296d0978e0d26c2277f204923e8e83472e3f60b713b8e334e942e2";
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const { isLoggedIn, login, logout, userDetails } = useLogin();
  const FULLNODE_URL = "https://fullnode.testnet.sui.io"; 
  const NETWORK = "testnet"; 
  
  useEffect(() => {
      const fetch = async () => {
        const suiClient = new SuiClient({ url: FULLNODE_URL });
        const packageId =
          "0x7b1f0507ef23d66e600f77e8209f52a864e117719ac017604ee8327a2d3c55e9";
  
        const obj = await suiClient.getObject({
          id: objectId,
          options: { showContent: true },
        });
  
        const fields = obj.data?.content?.fields;
        console.log("Game ID Counter:", fields.id_counter);
        const owners = fields.game_ids;
        console.log("Owners:", owners);
  
        //get unique owners
        const uniqueOwners = [...new Set(owners)];
  
        // fetch gameobjects using unique owners
        const gameObjectsdata = await Promise.all(
          uniqueOwners.map(async (owner) => {
            const gameObj = await suiClient.getOwnedObjects({
              owner: owner,
              options: { showContent: true, showType: true },
            });
            return gameObj.data;
          })
        );
        console.log("Game Object:", gameObjectsdata);
        //filter the game objects to get the ones that are created by the packageId
        console.log(gameObjectsdata.flat());
        const filteredGameObj = gameObjectsdata.flat().filter((obj) => {
          return obj.data?.type === `${packageId}::ai_game_generator::Game`
        });
        console.log("Filtered Game Object:", filteredGameObj);
        //fetch game objects using filteredGameObj data.objectId
        const gameObjects = await Promise.all(
          filteredGameObj.map(async (obj) => {
            const gameObj = await suiClient.getObject({
              id: obj.data.objectId,
              options: { showContent: true },
            });
            return gameObj.data.content.fields;
          })
        );
        const filteredGames = gameObjects.filter((game) => {
          return game.image_blob_id.length > 20 && game.game_id >3;});
        console.log(filteredGames);
        localStorage.setItem("games", JSON.stringify(filteredGames));
        setGames(filteredGames);
      };
  
      fetch();
    }, []);
  
    useEffect(() => {
      const loadAllImages = async () => {
          const newImages = {};
          for (let i = 0; i < games.length; i++) {
              const game = games[i];
              const decoder = new TextDecoder();
              const image_blob_id_decoded = decoder.decode(new Uint8Array(game.image_blob_id));
              const res = await fetch(`http://127.0.0.1:5000/get_image/${image_blob_id_decoded}`);
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              newImages[i] = url;
          }
          setImages(newImages);
          setLoading(false);
      };
  
      if (games.length > 0) {
          loadAllImages();
      }
  }, [games]);


  const getBalance = async (walletAddress) => {
      const suiClient = new SuiClient({ url: FULLNODE_URL });
      const balanceObj = await suiClient.getCoins({
        owner: walletAddress,
        limit: 100,
      });
  
      const balance = balanceObj.data
        .filter((coinObj) => coinObj.coinType === "0x2::sui::SUI")
        .reduce((acc, obj) => acc + parseInt(obj.balance), 0);
      setUserBalance(balance * 10 ** -9);
    };
    
  const featuredGames = [
    { id: 1, title: "Cosmic Defenders", creator: "@space_game_dev", thumbnail: "/1.png" },
    { id: 2, title: "Pixel Survivors", creator: "@retro_gamer", thumbnail: "/2.png" },
    { id: 3, title: "Blockchain Battles", creator: "@crypto_creator", thumbnail: "/3.png" },
    { id: 4, title: "NFT Racers", creator: "@digital_speedster", thumbnail: "/4.png" },
    { id: 5, title: "Fantasy Quest", creator: "@fantasy_dev", thumbnail: "/5.png" },
    { id: 6, title: "Mystic Realms", creator: "@mystic_dev", thumbnail: "/6.png" },
    { id: 7, title: "Adventure Awaits", creator: "@adventure_dev", thumbnail: "/7.png" },
    { id: 8, title: "Epic Battles", creator: "@epic_dev", thumbnail: "/8.png" }
  ];

  useEffect(() => {
    if (userDetails) {
      getBalance(userDetails.address);
    }
  }, [userDetails]);

  const toggleWalletInfo = () => {
    setShowWalletInfo(!showWalletInfo);
  };

  const handleLogout = () => {
    logout();
    setShowWalletInfo(false);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <main className="container mx-auto p-4 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search games..."
              className="w-full p-3 pl-10 rounded-lg border border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          </div>
          <button onClick={() => window.location.href = "/create"} className="ml-4 px-6 py-3 bg-blue-500 text-white rounded-lg flex items-center hover:bg-green-600 transition">
            <Plus size={20} className="mr-2" /> Create
          </button>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Featured Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {games.length>0 && (games.map((game, index) => (
              <div
                onClick={() => window.location.href = "/game/" + game.game_id}
                key={game.game_id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer"
              >
                {images[index] && (
                <img
                  src={images[index]}
                  alt="Game Thumbnail"
                  className="w-full h-50 object-cover"
                />
              )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{game.title}</h3>
                  <p className="text-gray-600">{game.creator_name}</p>
                </div>
              </div>
            )))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Create Your Own Game</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white text-purple-700 rounded-full p-3 mr-4">
                <span className="font-bold text-lg">1</span>
              </div>
              <span className="font-semibold text-lg">PromptAI</span>
            </div>
            <ChevronRight className="hidden md:block text-purple-300" />
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white text-purple-700 rounded-full p-3 mr-4">
                <span className="font-bold text-lg">2</span>
              </div>
              <span className="font-semibold text-lg">Builds</span>
            </div>
            <ChevronRight className="hidden md:block text-purple-300" />
            <div className="flex items-center">
              <div className="bg-white text-purple-700 rounded-full p-3 mr-4">
                <span className="font-bold text-lg">3</span>
              </div>
              <span className="font-semibold text-lg">You Mint</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold mb-4">Turn your ideas into blockchain games</h3>
            <p className="mb-6">AI generates code, art & logic. Mint directly to Sui blockchain.</p>
            <button
              className="px-8 py-4 bg-white text-purple-700 font-bold rounded-lg hover:bg-purple-100 transition text-lg"
              onClick={() => window.location.href = "/create"}
            >
              Create Your Game
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">SuiPlayground</h2>
              <p className="text-gray-400">Generate, Remix, Mint AI Games on Sui</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-purple-400 transition">About</a>
              <a href="#" className="hover:text-purple-400 transition">Documentation</a>
              <a href="#" className="hover:text-purple-400 transition">Community</a>
              <a href="#" className="hover:text-purple-400 transition">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}