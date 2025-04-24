import { useAuthCallback, useEnokiFlow, useZkLogin } from '@mysten/enoki/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

const GOOGLE_CLIENT_ID = "123988858251-p26bres4afcg3j9jtb2d1ibs63j4r300.apps.googleusercontent.com";
const NETWORK = 'testnet'; 

const LoginContext = createContext();

export const UserProvider = ({ children }) => {
  const flow = useEnokiFlow();
  const zkLogin = useZkLogin();
  useAuthCallback();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userDetails, setUserDetails] = useState(null); 
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
    setUserDetails(null); 
  };

  useEffect(() => {
    if (zkLogin.address) {
      setWalletAddress(zkLogin.address);
      setIsLoggedIn(true);
      setUserDetails({
        address: zkLogin.address,
        provider: zkLogin.provider,
        salt: zkLogin.salt,
      }); 
    } else {
      setIsLoggedIn(false);
      setWalletAddress('');
      setUserDetails(null); 
    }
  }, [zkLogin.address]);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('walletAddress', walletAddress);
      if (userDetails) {
        localStorage.setItem('userDetails', JSON.stringify(userDetails)); 
      }
    } else {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('userDetails'); 
    }
  }, [isLoggedIn, walletAddress, userDetails]);

  return (
    <LoginContext.Provider value={{ isLoggedIn, login, logout, walletAddress, userDetails, loading }}>
      {children}
    </LoginContext.Provider>
  );
};

export const useLogin = () => useContext(LoginContext);
