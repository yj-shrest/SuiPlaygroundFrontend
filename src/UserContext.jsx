import { useAuthCallback, useEnokiFlow, useZkLogin } from '@mysten/enoki/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

const GOOGLE_CLIENT_ID = "123988858251-p26bres4afcg3j9jtb2d1ibs63j4r300.apps.googleusercontent.com";
const NETWORK = 'testnet'; // or 'mainnet' for production

const LoginContext = createContext();

export const UserProvider = ({ children }) => {
  const flow = useEnokiFlow();
  const zkLogin = useZkLogin();
  useAuthCallback();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userDetails, setUserDetails] = useState(null); // user details state
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      const url = await flow.createAuthorizationURL({
        provider: 'google',
        clientId: GOOGLE_CLIENT_ID,
        redirectUrl: window.location.origin,
        network: NETWORK,
      });
      window.location.href = url;
    } catch (error) {
      console.error("Login error: ", error);
      setLoading(false);
    }
  };

  const logout = () => {
    flow.logout();
    setIsLoggedIn(false);
    setWalletAddress('');
    setUserDetails(null); // Clear user details on logout
  };

  useEffect(() => {
    if (zkLogin.address) {
      setWalletAddress(zkLogin.address);
      setIsLoggedIn(true);
      setUserDetails({
        address: zkLogin.address,
        provider: zkLogin.provider,
        salt: zkLogin.salt,
      }); // Store user details when logged in
    } else {
      setIsLoggedIn(false);
      setWalletAddress('');
      setUserDetails(null); // Reset user details if address is not available
    }
  }, [zkLogin.address]);

  // Persist login state and userDetails to localStorage
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('walletAddress', walletAddress);
      if (userDetails) {
        localStorage.setItem('userDetails', JSON.stringify(userDetails)); // Save userDetails
      }
    } else {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('userDetails'); // Remove userDetails from localStorage
    }
  }, [isLoggedIn, walletAddress, userDetails]);

  return (
    <LoginContext.Provider value={{ isLoggedIn, login, logout, walletAddress, userDetails, loading }}>
      {children}
    </LoginContext.Provider>
  );
};

export const useLogin = () => useContext(LoginContext);
