import React, { useEffect, useState } from "react";
import { SmartTransfer, GetBalanceAction } from "../core/agentkit";
import { ethers } from "ethers";

export default function WalletConnect() {
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();

  // Example testnet ERC20 token (Mumbai USDC test token)
  const TEST_TOKEN_ADDRESS = "0xFE724a82981Cf18eB3c223d35c8A9A56C1B23b97"; // Replace with any token you like
  const RECIPIENT_ADDRESS = "0x000000000000000000000000000000000000dead"; // Test recipient

  useEffect(() => {
    if ((window as any).ethereum) {
      const p = new ethers.providers.Web3Provider((window as any).ethereum);
      setProvider(p);
    } else {
      console.warn("MetaMask not found");
    }
  }, []);

  const connectWallet = async () => {
    if (!provider) return;
    const accounts = await provider.send("eth_requestAccounts", []);
    setAddress(accounts[0]);
    const bal = await getBalanceAction(accounts[0]);
    setBalance(bal);
  };

  const sendToken = async () => {
    if (!address) return;
    try {
      const tx = await smartTransfer({
        to: RECIPIENT_ADDRESS,
        tokenAddress: TEST_TOKEN_ADDRESS,
        amount: "0.01" // Send 0.01 token for testing
      });
      console.log("Transaction sent:", tx.hash);
      alert(`Transaction sent! Hash: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      alert(`Transaction failed: ${err}`);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>VibeCoding Wallet</h2>
      <button onClick={connectWallet}>Connect Wallet</button>
      {address && (
        <div>
          <p><strong>Address:</strong> {address}</p>
          <p><strong>Balance:</strong> {balance} ETH</p>
          <button onClick={sendToken}>Send 0.01 Test Token</button>
        </div>
      )}
    </div>
  );
}
