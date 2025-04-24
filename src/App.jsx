import React from 'react'
import HomePage from './HomePage'
import {Routes, Route } from "react-router";
import Create from './Create'
import GamePage from './Game';
import MintGame from './MintGame';
import Retrieve from './temp';
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<Create />} />
      <Route path="/game/:gameId" element={<GamePage />} />
      <Route path="/mint" element={<MintGame />} />
      <Route path="/temp" element={<Retrieve />} />
      {/* Add more routes as needed */}
    </Routes>
  )
}

export default App
