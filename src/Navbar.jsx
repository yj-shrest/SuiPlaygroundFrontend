import { useState, useEffect, use } from 'react';
import { Search, Plus, ChevronRight, User, LogOut } from 'lucide-react';
import { useLogin } from './UserContext';
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import React from 'react'

const NETWORK = "testnet";
const FULLNODE_URL = getFullnodeUrl(NETWORK);
const Navbar = () => {
    const { isLoggedIn, login, logout, userDetails } = useLogin();
    const [showWalletInfo, setShowWalletInfo] = useState(false);
    const [userBalance, setUserBalance] = useState(0);
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


  return (
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
            <button  onClick={() => window.location.href = "/"}>
          <h1  className="text-2xl font-bold">SuiPlayground</h1>
            </button>
          <div className="flex space-x-4">
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  onClick={toggleWalletInfo}
                  className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center hover:bg-sky-600 transition"
                >
                  <User size={20} />
                </button>
                
                {showWalletInfo && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-lg p-4 z-10">
                    <div className="mb-3">
                      <h3 className="font-bold text-gray-700">Wallet Address</h3>
                      <p className="text-sm break-all">{userDetails.address}</p>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-700">Balance</h3>
                      <p className="text-lg font-semibold">{userBalance || '0'} SUI</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition flex items-center justify-center"
                    >
                      <LogOut size={16} className="mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="px-4 py-2 bg-sky-500 rounded-md hover:bg-purple-600 transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>
  )
}

export default Navbar
