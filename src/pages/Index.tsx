import React, { useState } from "react";
import WalletConnect from "../components/WalletConnect";
import { sendTransaction, readContract, smartTransfer, sendUserOpToRelayer } from "../core/agentkit";
import { ethers } from "ethers";

// Example simple contract ABI and bytecode for testing
const SIMPLE_CONTRACT_ABI = [
  "function store(uint256 value)",
  "function retrieve() view returns (uint256)"
];
const SIMPLE_CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b5061011e806100206000396000f3fe60806040..."; // Truncated example

export default function IndexPage() {
  const [deployedAddress, setDeployedAddress] = useState<string>("");
  const [contractValue, setContractValue] = useState<string>("");
  const [gaslessStatus, setGaslessStatus] = useState<string>("");

  const deployContract = async () => {
    try {
      // Create deployment transaction
      const factory = new ethers.ContractFactory(SIMPLE_CONTRACT_ABI, SIMPLE_CONTRACT_BYTECODE);
      const tx = await sendTransaction({
        to: "", // empty because it's a deployment
        data: factory.getDeployTransaction().data!
      });
      setDeployedAddress(tx.contractAddress || "Deployed (no address returned)");
      alert(`Contract deployed! TxHash: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      alert(`Deployment failed: ${err}`);
    }
  };

  const readStoredValue = async () => {
    if (!deployedAddress) return alert("Deploy contract first!");
    const value = await readContract({
      address: deployedAddress,
      abi: SIMPLE_CONTRACT_ABI,
      functionName: "retrieve",
    });
    setContractValue(value.toString());
  };

  const sendGaslessTransaction = async () => {
    try {
      setGaslessStatus("Sending...");
      const userOp = {
        sender: "0xYourSmartAccountAddressHere",
        callData: "0xYourEncodedFunctionDataHere"
      };
      const result = await sendUserOpToRelayer(userOp);
      setGaslessStatus(`UserOp sent! TxHash: ${result.txHash || "Unknown"}`);
    } catch (err) {
      console.error(err);
      setGaslessStatus(`Failed: ${err}`);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>VibeCoding Dapp Demo</h1>
      <WalletConnect />

      <hr style={{ margin: "20px 0" }} />

      <h2>Deploy Test Contract</h2>
      <button onClick={deployContract}>Deploy Simple Contract</button>
      {deployedAddress && <p>Deployed Contract Address: {deployedAddress}</p>}
      <button onClick={readStoredValue}>Read Stored Value</button>
      {contractValue && <p>Stored Value: {contractValue}</p>}

      <hr style={{ margin: "20px 0" }} />

      <h2>Gasless Transaction (Relayer)</h2>
      <button onClick={sendGaslessTransaction}>Send Gasless TX</button>
      {gaslessStatus && <p>{gaslessStatus}</p>}

      <hr style={{ margin: "20px 0" }} />

      <h2>Send Test Token</h2>
      <p>Use the WalletConnect buttons above to send test tokens via AgentKit</p>
    </div>
  );
}
