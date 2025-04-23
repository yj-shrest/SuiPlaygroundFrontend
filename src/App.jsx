import React from 'react'
import HomePage from './HomePage'
import {Routes, Route } from "react-router";
import Create from './Create'
import GamePage from './Game';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<Create />} />
      <Route path="/game/:gameId" element={<GamePage />} />
    </Routes>
  )
}

export default App
