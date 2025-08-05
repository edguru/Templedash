import { useState, useEffect } from "react";
import { useAuth } from "../../lib/stores/useAuth";

interface Wallet {
  id: number;
  name: string;
  address: string;
  publicKey: string;
  createdAt: string;
  isActive: boolean;
}

interface Contract {
  id: number;
  name: string;
  contractAddress: string;
  chainId: number;
  rpcUrl: string;
  networkName: string;
  blockExplorerUrl?: string;
  deployedAt: string;
  isActive: boolean;
}

export default function WalletManagerScreen({ onBack }: { onBack: () => void }) {
  const { token } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [isDeployingContract, setIsDeployingContract] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState('sepolia');
  const [contractName, setContractName] = useState('Temple Runner NFT');
  const [contractSymbol, setContractSymbol] = useState('TRN');
  const [message, setMessage] = useState('');

  // Load wallets and contracts on mount
  useEffect(() => {
    loadWallets();
    loadContracts();
  }, []);

  const loadWallets = async () => {
    try {
      const response = await fetch('/api/wallets');
      if (response.ok) {
        const data = await response.json();
        setWallets(data);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
    }
  };

  const generateWallet = async () => {
    setIsGeneratingWallet(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/wallets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Temple Runner Wallet'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Wallet generated: ${data.wallet.address}`);
        loadWallets(); // Refresh wallet list
      } else {
        const error = await response.json();
        setMessage(`❌ Failed: ${error.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  const deployContract = async () => {
    if (!selectedWallet) {
      setMessage('❌ Please select a wallet first');
      return;
    }

    setIsDeployingContract(true);
    setMessage('🚀 Deploying contract... This may take a few minutes.');
    
    try {
      const response = await fetch('/api/contracts/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: selectedWallet,
          networkName,
          contractName,
          contractSymbol
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Contract deployed! Address: ${data.deployment.contractAddress}`);
        loadContracts(); // Refresh contract list
      } else {
        const error = await response.json();
        setMessage(`❌ Deployment failed: ${error.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeployingContract(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-4 border-blue-500 rounded-lg p-6 max-w-2xl w-full mx-auto text-center shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-blue-400 mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
            WALLET & CONTRACT MANAGER
          </h1>
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="bg-black/70 p-3 rounded mb-4 text-sm text-white" style={{ fontFamily: 'Courier New, monospace' }}>
            {message}
          </div>
        )}

        {/* Wallet Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-green-400 mb-3" style={{ fontFamily: 'Courier New, monospace' }}>
            WALLETS
          </h2>
          
          <button
            onClick={generateWallet}
            disabled={isGeneratingWallet}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 mb-3 border-2 border-green-400 font-bold text-sm transition-all"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            {isGeneratingWallet ? '⏳ GENERATING...' : '🔑 GENERATE NEW WALLET'}
          </button>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`p-2 rounded border text-xs cursor-pointer transition-all ${
                  selectedWallet === wallet.id
                    ? 'bg-blue-800 border-blue-400 text-blue-200'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedWallet(wallet.id)}
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                <div className="font-bold">{wallet.name}</div>
                <div className="truncate">{wallet.address}</div>
                <div className="text-xs opacity-75">
                  Created: {new Date(wallet.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Deployment Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-purple-400 mb-3" style={{ fontFamily: 'Courier New, monospace' }}>
            DEPLOY ERC721 CONTRACT
          </h2>
          
          <div className="space-y-2 mb-3">
            <select
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded text-xs"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              <option value="sepolia">Sepolia Testnet</option>
              <option value="goerli">Goerli Testnet</option>
              <option value="mumbai">Mumbai (Polygon)</option>
            </select>
            
            <input
              type="text"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="Contract Name"
              className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded text-xs"
              style={{ fontFamily: 'Courier New, monospace' }}
            />
            
            <input
              type="text"
              value={contractSymbol}
              onChange={(e) => setContractSymbol(e.target.value)}
              placeholder="Symbol (e.g., TRN)"
              className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded text-xs"
              style={{ fontFamily: 'Courier New, monospace' }}
            />
          </div>

          <button
            onClick={deployContract}
            disabled={isDeployingContract || !selectedWallet}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white px-4 py-2 border-2 border-purple-400 font-bold text-sm transition-all"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            {isDeployingContract ? '🚀 DEPLOYING...' : '📝 DEPLOY CONTRACT'}
          </button>
        </div>

        {/* Deployed Contracts */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-3" style={{ fontFamily: 'Courier New, monospace' }}>
            DEPLOYED CONTRACTS
          </h2>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="p-2 rounded border bg-gray-800 border-gray-600 text-gray-300 text-xs"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                <div className="font-bold">{contract.name}</div>
                <div className="truncate">{contract.contractAddress}</div>
                <div className="text-xs opacity-75">
                  Network: {contract.networkName} | Chain ID: {contract.chainId}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 border-2 border-gray-400 font-bold text-base transition-all"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          ◄ BACK TO GAME
        </button>
      </div>
    </div>
  );
}