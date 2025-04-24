# 🎮 AI Game Generator Frontend

This is the **React.js frontend** for the AI Game Generator project — a platform where users can **generate**, **play**, **update**, and **remix** HTML5 mini-games using natural language prompts.

It communicates with a Flask-based backend that uses **Google's Gemini API** for game generation and a **blockchain blob storage** system for saving and retrieving games.

---

## 🌟 Features

- 🧠 **Natural Language Game Generation**  
  Enter a game idea in plain English and receive a structured mini-game.

- 🛠️ **Game Creation**  
  Build an HTML game using AI-generated JSON from your prompt.

- 🔁 **Remix Mode**  
  Modify and improve games — even if they were made by other users.

- 💾 **Mint to Blockchain Storage**  
  Save games and their thumbnails to decentralized blob storage.

- 📦 **Retrieve Games**  
  Load and preview games using their stored blob ID.

---

## 🧭 Navigation (Routes)

| Route                  | Component     | Description                                 |
|------------------------|----------------|---------------------------------------------|
| `/`                    | `HomePage`     | Landing page with prompt input              |
| `/create`              | `Create`       | Displays the generated game                 |
| `/game/:gameId`        | `GamePage`     | Plays a game by its ID                      |
| `/remix/:gameId`       | `Remix`        | Update or remix an existing game            |
| `/mint`                | `MintGame`     | Stores the game and screenshot to storage   |
| `/temp`                | `Retrieve`     | Temporary route for fetching blob data      |

---

## ⚙️ Setup Instructions

```bash
git clone https://github.com/yourusername/game-ai-frontend.git
cd game-ai-frontend
npm install
npm run dev     # or npm start if using CRA
```

Make sure the backend is running on `http://localhost:5000` or update the base URL in your Axios calls accordingly.

---

## 📂 Project Structure

```
src/
├── App.js             # Defines all frontend routes
├── HomePage.js        # Input prompt to generate game
├── Create.js          # Shows AI-generated game
├── Game.js            # Displays game by ID
├── Remix.js           # Edit games, even others'
├── MintGame.js        # Mint game to blob storage
├── temp.js            # Retrieve blob content
├── navbar.js          # Navigation bar
```

---

## 📦 Backend

Make sure to clone and run the backend from this repo:  
👉 [AI Game Generator Backend](https://github.com/yj-shrest/Backend)

---

## 💡 Example Use Case

1. Go to `/` and type: _“A top-down zombie survival game with health pickups”_
2. Hit **Generate**, then preview the game.
3. Mint it to storage or send the game ID to a friend.
4. Your friend visits `/remix/:gameId` to improve or modify it.
5. Store the remixed version again — infinite creativity loop!

---

## 📄 License

MIT License. Feel free to fork and build upon it! 🧠🎮