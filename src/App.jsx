import React from 'react'
import HomePage from './HomePage'
import {Routes, Route } from "react-router";
import Create from './Create'
import GamePage from './Game';
import MintGame from './MintGame';
import Retrieve from './temp';
import Navbar from './navbar';
import Remix from './Remix';
function App() {
  return (
    <div>
      <Navbar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<Create />} />
      <Route path="/game/:gameId" element={<GamePage />} />
      <Route path="/mint" element={<MintGame />} />
      <Route path="/temp" element={<Retrieve />} />
      <Route path="/remix/:gameId" element={<Remix />} />
      {/* Add more routes as needed */}
    </Routes>
    </div>
  )
}

export default App
