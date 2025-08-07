import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { lightTheme } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { client, baseCampTestnet } from "../../lib/thirdweb";
import { useGameState } from "../../lib/stores/useGameState";

// Wallet configuration
const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

interface UserStats {
  totalEarnings: number;
  mysteryBoxesClaimed: number;
  nftsMinted: number;
  gamesPlayed: number;
  highestScore: number;
  totalDistance: number;
  totalCoins: number;
}

interface TokenClaim {
  id: string;
  amount: number;
  tokenType: string;
  rarity: string;
  claimed: boolean;
  createdAt: string;
}

interface NFTOwned {
  id: string;
  tokenId: string;
  characterType: string;
  mintedAt: string;
}

export default function UserProfileScreen() {
  const account = useActiveAccount();
  const { setGamePhase } = useGameState();
  const [userStats, setUserStats] = useState<UserStats>({
    totalEarnings: 0,
    mysteryBoxesClaimed: 0,
    nftsMinted: 0,
    gamesPlayed: 0,
    highestScore: 0,
    totalDistance: 0,
    totalCoins: 0
  });
  const [tokenClaims, setTokenClaims] = useState<TokenClaim[]>([]);
  const [nftOwned, setNftOwned] = useState<NFTOwned[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account?.address) {
      fetchUserData();
    }
  }, [account?.address]);

  const fetchUserData = async () => {
    if (!account?.address) return;

    try {
      setLoading(true);
      
      // Fetch user statistics
      const statsResponse = await fetch(`/api/user/${account.address}/stats`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats(stats);
      }

      // Fetch token claims
      const claimsResponse = await fetch(`/api/user/${account.address}/claims`);
      if (claimsResponse.ok) {
        const claims = await claimsResponse.json();
        setTokenClaims(claims);
      }

      // Fetch NFT ownership
      const nftResponse = await fetch(`/api/user/${account.address}/nfts`);
      if (nftResponse.ok) {
        const nfts = await nftResponse.json();
        setNftOwned(nfts);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!account) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">User Profile</h1>
          <p className="text-gray-600 mb-6">Connect your wallet to view your profile</p>
          
          <ConnectButton
            client={client}
            accountAbstraction={{
              chain: baseCampTestnet,
              sponsorGas: true,
            }}
            connectModal={{ 
              showThirdwebBranding: false, 
              size: "compact"
            }}
            theme={lightTheme({
              colors: {
                accentText: "hsl(258, 90%, 65%)",
                borderColor: "hsl(258, 90%, 65%)",
                primaryButtonBg: "hsl(258, 90%, 65%)",
                primaryButtonText: "hsl(0, 0%, 100%)",
                connectedButtonBg: "hsl(142, 76%, 36%)",
                connectedButtonBgHover: "hsl(142, 76%, 30%)",
              },
            })}
            wallets={wallets}
            chain={baseCampTestnet}
            switchToActiveChain={true}
          />
          
          <button
            onClick={() => setGamePhase('start')}
            className="mt-4 text-purple-600 hover:text-purple-800 transition-colors"
          >
            ← Back to Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 overflow-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">User Profile</h1>
                  <p className="text-gray-600">{formatAddress(account.address)}</p>
                  <p className="text-sm text-green-600">Base Camp Testnet</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <ConnectButton
                  client={client}
                  accountAbstraction={{
                    chain: baseCampTestnet,
                    sponsorGas: true,
                  }}
                  connectModal={{ 
                    showThirdwebBranding: false, 
                    size: "compact"
                  }}
                  theme={lightTheme({
                    colors: {
                      accentText: "hsl(258, 90%, 65%)",
                      borderColor: "hsl(258, 90%, 65%)",
                      primaryButtonBg: "hsl(258, 90%, 65%)",
                      primaryButtonText: "hsl(0, 0%, 100%)",
                      connectedButtonBg: "hsl(142, 76%, 36%)",
                      connectedButtonBgHover: "hsl(142, 76%, 30%)",
                    },
                  })}
                  wallets={wallets}
                />
                <button
                  onClick={() => setGamePhase('start')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Game
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Game Statistics */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Game Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{userStats.gamesPlayed}</div>
                    <div className="text-sm text-gray-600">Games Played</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{userStats.highestScore}</div>
                    <div className="text-sm text-gray-600">Highest Score</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{userStats.totalDistance}m</div>
                    <div className="text-sm text-gray-600">Total Distance</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{userStats.totalCoins}</div>
                    <div className="text-sm text-gray-600">Coins Collected</div>
                  </div>
                </div>
              </div>

              {/* Earnings Overview */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Earnings Overview</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">${userStats.totalEarnings.toFixed(3)}</div>
                    <div className="text-sm text-gray-600">Total PUPPETS Earned</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{userStats.mysteryBoxesClaimed}</div>
                      <div className="text-sm text-gray-600">Mystery Boxes</div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{userStats.nftsMinted}</div>
                      <div className="text-sm text-gray-600">NFTs Minted</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Token Claims */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Token Claims</h2>
                {tokenClaims.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No token claims yet. Play the game to earn rewards!</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {tokenClaims.map((claim) => (
                      <div key={claim.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-800">
                              ${claim.amount} {claim.tokenType}
                            </div>
                            <div className="text-xs text-gray-500">{formatDate(claim.createdAt)}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(claim.rarity)}`}>
                              {claim.rarity}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              claim.claimed 
                                ? 'text-green-600 bg-green-100' 
                                : 'text-yellow-600 bg-yellow-100'
                            }`}>
                              {claim.claimed ? 'Claimed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NFT Collection */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">NFT Collection</h2>
                {nftOwned.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No NFTs minted yet. Visit the mint screen to create your character!</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {nftOwned.map((nft) => (
                      <div key={nft.id} className="border border-gray-200 rounded-lg p-3 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-2xl">🎮</span>
                        </div>
                        <div className="font-semibold text-gray-800 capitalize">{nft.characterType} Character</div>
                        <div className="text-xs text-gray-500">Token #{nft.tokenId}</div>
                        <div className="text-xs text-gray-500">{formatDate(nft.mintedAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}