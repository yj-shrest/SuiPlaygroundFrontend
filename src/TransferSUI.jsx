import { useEffect, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { useEnokiFlow } from "@mysten/enoki/react";
import { requestSuiFromFaucetV0, getFaucetHost } from "@mysten/sui/faucet";
import { useLogin } from "./UserContext"; // Assuming you have a UserContext for login state
const FULLNODE_URL = "https://fullnode.testnet.sui.io";
const NETWORK = "testnet"; // or "mainnet" for production

const TransferSUI = () => {
  const flow = useEnokiFlow();
  const { userDetails } = useLogin();
  const [userBalance, setUserBalance] = useState(0);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [txnDigest, setTxnDigest] = useState("");
  const [loading, setLoading] = useState(false);

  const getBalance = async (walletAddress) => {
    const suiClient = new SuiClient({ url: FULLNODE_URL });
    const balanceObj = await suiClient.getCoins({
      owner: walletAddress,
      limit: 100,
    });

    const balance = balanceObj.data
      .filter((coinObj) => coinObj.coinType === "0x2::sui::SUI")
      .reduce((acc, obj) => acc + parseInt(obj.balance), 0);
    setUserBalance(balance);
  };

  const transferSUI = async () => {
    try {
      setLoading(true);
      const suiClient = new SuiClient({ url: FULLNODE_URL });
      const keypair = await flow.getKeypair({ network: NETWORK });

      const txb = new Transaction();
      const coin = txb.splitCoins(txb.gas, [0.2 * 10 ** 9]);
      txb.transferObjects([coin], recipientAddress);
      console.log("coin", coin);

      const txnRes = await suiClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: txb,
      });

      console.log("txnRes", txnRes);

      if (txnRes && txnRes?.digest) {
        setTxnDigest(txnRes?.digest);
        alert(`Transfer Success. Digest: ${txnRes?.digest}`);
        getBalance(userDetails.address);
      }
    } catch (err) {
      console.log("Error transferring SUI.", err);
      alert("Error transferring SUI. Check logs for details.");
    } finally {
      setLoading(false);
    }
  };

  const requestSUIFromFaucet = async (receiverAddress) => {
    try {
      await requestSuiFromFaucetV0({
        host: getFaucetHost("testnet"),
        recipient: receiverAddress,
      });
      getBalance(userDetails.address);
      alert("SUI request success.");
    } catch (err) {
      alert("SUI request failed.");
    }
  };

  useEffect(() => {
    if (userDetails && userDetails.address) {
      getBalance(userDetails.address);
    }
  }, [userDetails]);
  

  return (
    <div>
      <h3>Transfer SUI</h3>
      <p>User Balance: {userBalance * 10 ** -9}</p>
      <p>
        Note: Please transfer some SUI or{" "}
        <span
          style={{ textDecoration: "underline", cursor: "pointer" }}
          onClick={() => requestSUIFromFaucet(userDetails.address)}
        >
          request from faucet
        </span>{" "}
        to the address above before running the Transfer SUI action.
      </p>

      <div>
        <p>Normal Transaction</p>
        <input
          name="recipientAddress"
          value={recipientAddress}
          placeholder="0x000000..."
          onChange={(e) => setRecipientAddress(e.target.value)}
        />
        <button onClick={transferSUI}>Transfer SUI</button>
        <div>{txnDigest && <div>Transaction Digest: {txnDigest}</div>}</div>
        {loading && <div>Loading...</div>}
      </div>
    </div>
  );
};

export default TransferSUI;
