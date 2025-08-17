import { useState } from 'react';
import { useActiveAccount, useDisconnect } from 'thirdweb/react';
import { useGameState } from "../../lib/stores/useGameState";
import { useNFT } from "../../lib/stores/useNFT";
import { useRewards } from "../../lib/stores/useRewards";
import { Button } from "./button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { 
  Menu, 
  Play, 
  MessageCircle, 
  Gamepad2, 
  User,
  Coins,
  Trophy,
  Wallet,
  Settings,
  X
} from "lucide-react";

export default function HomePage() {
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();
  const { setGamePhase } = useGameState();
  const { hasCharacterNFT, ownedCharacters } = useNFT();
  const { totalCoins, completedRuns, canOpenMysteryBox } = useRewards();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const handleStartGame = () => {
    setGamePhase('characterSelectPopup');
  };

  const handleOpenMysteryBox = () => {
    setGamePhase('mysteryBox');
  };

  const handleOpenTutorial = () => {
    setGamePhase('tutorial');
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({});
    } catch (error) {
      console.log('Disconnect error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">Puppets AI</h1>
            </div>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden">
          <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="space-y-3">
              <button
                onClick={() => { setActiveTab("home"); setIsMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Home
              </button>
              <button
                onClick={() => { setActiveTab("chat"); setIsMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Chat
              </button>
              <button
                onClick={() => { setActiveTab("games"); setIsMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Mini Games
              </button>
              <button
                onClick={() => { setActiveTab("account"); setIsMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Account
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tab Navigation */}
          <TabsList className="hidden lg:grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Mini Games
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              {/* Hero Image Placeholder */}
              <div className="w-full max-w-2xl mx-auto aspect-video bg-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-slate-400 text-lg">Hero Image Placeholder</div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-slate-900">
                  Effortless Automation for Web3
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Experience the future of blockchain gaming with our AI-powered infinite runner
                </p>
                <Button 
                  size="lg" 
                  onClick={handleStartGame}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-lg"
                >
                  Get Started
                </Button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-slate-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Play className="h-6 w-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg">Infinite Runner</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Experience high-quality 3D graphics with NFT character collection system
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-slate-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg">Earn Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Collect coins and unlock mystery boxes with real crypto rewards
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-slate-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg">Web3 Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Connect your wallet and mint unique NFT characters on Base Camp testnet
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Player Stats */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{totalCoins}</div>
                    <div className="text-sm text-slate-600">Coins Collected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{completedRuns}</div>
                    <div className="text-sm text-slate-600">Completed Runs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{ownedCharacters.length}</div>
                    <div className="text-sm text-slate-600">NFT Characters</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={canOpenMysteryBox ? "default" : "secondary"}>
                      {canOpenMysteryBox ? "Mystery Box Ready" : "Keep Playing"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Community Chat
                </CardTitle>
                <CardDescription>
                  Connect with other players and the Puppets AI community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">Chat feature coming soon</p>
                  <Button 
                    onClick={() => setGamePhase('chat')}
                    variant="outline"
                  >
                    Open Chat Screen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mini Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Game Center
                </CardTitle>
                <CardDescription>
                  Access all available games and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleStartGame}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Play className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Infinite Runner</h3>
                          <p className="text-sm text-slate-600">Main Game</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleOpenTutorial}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Settings className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Tutorial</h3>
                          <p className="text-sm text-slate-600">Learn to Play</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {canOpenMysteryBox && (
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleOpenMysteryBox}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Mystery Box</h3>
                            <p className="text-sm text-slate-600">Claim Rewards</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Wallet Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Wallet Connection</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${account?.address}`} />
                        <AvatarFallback>
                          {account?.address?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">Wallet Connected</div>
                        <div className="text-sm text-slate-600 font-mono">
                          {account?.address?.slice(0, 8)}...{account?.address?.slice(-6)}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Character Status */}
                <div className="space-y-4">
                  <h3 className="font-semibold">NFT Characters</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Characters Owned</div>
                        <div className="text-sm text-slate-600">
                          {ownedCharacters.length} / 3 Characters
                        </div>
                      </div>
                      <Badge variant={hasCharacterNFT ? "default" : "secondary"}>
                        {hasCharacterNFT ? "NFT Unlocked" : "Shadow Mode"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    onClick={() => setGamePhase('profile')}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Full Profile
                  </Button>
                  
                  <Button 
                    onClick={() => setGamePhase('leaderboard')}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    View Leaderboard
                  </Button>
                  
                  <Button 
                    onClick={handleDisconnect}
                    variant="destructive" 
                    className="w-full justify-start"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}