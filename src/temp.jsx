import React, { useEffect, useState } from "react";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

const NETWORK = "testnet";
const FULLNODE_URL = getFullnodeUrl(NETWORK);
const objectId =
  "0x6beae9325f296d0978e0d26c2277f204923e8e83472e3f60b713b8e334e942e2";
const Retrieve = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);

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
        return game.image_blob_id.length > 20 && game.game_id >1;});
      console.log(filteredGames);
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



  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Retrieve Game</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game, index) => (
            <div key={index} className="border p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{game.game_name}</h2>
              <p>Game ID: {game.game_id}</p>
              <p>Game Creator: {game.creator_name}</p>
              <p>: {game.game_prompt}</p>
              {images[index] && (
                <img
                  src={images[index]}
                  alt="Game Thumbnail"
                  className="w-full h-auto rounded-md"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Retrieve;
