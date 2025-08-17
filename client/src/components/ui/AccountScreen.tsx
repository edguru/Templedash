import React, { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { 
  User, 
  Key, 
  Shield, 
  Settings, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit, 
  Save, 
  X,
  Clock,
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { sessionManager } from '../../lib/sessionSigners';

interface UserSecret {
  id: string;
  name: string;
  type: 'api_key' | 'private_key' | 'oauth_token';
  description: string;
  createdAt: string;
  lastUsed?: string;
  masked: boolean;
}

interface SessionKey {
  id: string;
  address: string;
  permissions: string[];
  expiresAt: Date;
  isActive: boolean;
}

export default function AccountScreen() {
  const account = useActiveAccount();
  const [activeTab, setActiveTab] = useState<'profile' | 'secrets' | 'sessions'>('profile');
  const [secrets, setSecrets] = useState<UserSecret[]>([]);
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [showAddSecret, setShowAddSecret] = useState(false);
  const [newSecret, setNewSecret] = useState({
    name: '',
    type: 'api_key' as const,
    value: '',
    description: ''
  });
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (account?.address) {
      loadUserData();
    }
  }, [account]);

  const loadUserData = async () => {
    if (!account?.address) return;
    
    setIsLoading(true);
    try {
      // Load session keys
      const activeSessions = sessionManager.getActiveSessions();
      const sessionList: SessionKey[] = Array.from(activeSessions.entries()).map(([address, session]) => ({
        id: `session-${Date.now()}`,
        address: session.address,
        permissions: session.permissions,
        expiresAt: session.expiresAt,
        isActive: session.isActive
      }));
      setSessionKeys(sessionList);

      // Load secrets from backend
      const response = await fetch(`/api/user/${account.address}/secrets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSecrets(data.secrets || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSecret = async () => {
    if (!account?.address || !newSecret.name || !newSecret.value) return;

    try {
      const response = await fetch('/api/user/secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          userId: account.address,
          secretName: newSecret.name,
          secretValue: newSecret.value,
          secretType: newSecret.type,
          description: newSecret.description
        })
      });

      if (response.ok) {
        setNewSecret({ name: '', type: 'api_key', value: '', description: '' });
        setShowAddSecret(false);
        loadUserData();
      }
    } catch (error) {
      console.error('Error adding secret:', error);
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    if (!account?.address) return;

    try {
      const response = await fetch(`/api/user/secrets/${secretId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        loadUserData();
      }
    } catch (error) {
      console.error('Error deleting secret:', error);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!account?.address) return;
    
    sessionManager.revokeSession(account.address);
    loadUserData();
  };

  const handleCreateNewSession = async () => {
    if (!account?.address) return;

    try {
      await sessionManager.createSessionKey(account.address);
      await sessionManager.registerSessionWithBackend(account.address);
      loadUserData();
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const toggleSecretVisibility = (secretId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(secretId)) {
      newVisible.delete(secretId);
    } else {
      newVisible.add(secretId);
    }
    setVisibleSecrets(newVisible);
  };

  const formatTimeUntilExpiry = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!account) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Connect your wallet to view account settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600">{account.address?.slice(0, 6)}...{account.address?.slice(-4)}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'secrets', label: 'API Keys', icon: Key },
            { id: 'sessions', label: 'Sessions', icon: Shield }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                activeTab === id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Wallet Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                    {account.address}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Network
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    Base Camp Testnet (Chain ID: 123420001114)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Security Status</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Wallet Connected</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Session Keys Enabled</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span>AWS KMS Encryption</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'secrets' && (
          <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold">API Keys & Secrets</h2>
                <p className="text-gray-600">Manage your encrypted API keys for MCP agents</p>
              </div>
              <button
                onClick={() => setShowAddSecret(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Secret</span>
              </button>
            </div>

            {/* Add Secret Modal */}
            {showAddSecret && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Add New Secret</h3>
                    <button
                      onClick={() => setShowAddSecret(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newSecret.name}
                        onChange={(e) => setNewSecret({...newSecret, name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., OpenAI API Key"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={newSecret.type}
                        onChange={(e) => setNewSecret({...newSecret, type: e.target.value as any})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="api_key">API Key</option>
                        <option value="private_key">Private Key</option>
                        <option value="oauth_token">OAuth Token</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value
                      </label>
                      <input
                        type="password"
                        value={newSecret.value}
                        onChange={(e) => setNewSecret({...newSecret, value: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter secret value"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newSecret.description}
                        onChange={(e) => setNewSecret({...newSecret, description: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="What is this secret used for?"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handleAddSecret}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Add Secret
                    </button>
                    <button
                      onClick={() => setShowAddSecret(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Secrets List */}
            <div className="space-y-4">
              {secrets.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No API keys stored yet</p>
                  <p className="text-gray-400 text-sm">Add your first API key to enable MCP agents</p>
                </div>
              ) : (
                secrets.map((secret) => (
                  <div key={secret.id} className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{secret.name}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {secret.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{secret.description}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            Created: {new Date(secret.createdAt).toLocaleDateString()}
                          </span>
                          {secret.lastUsed && (
                            <span className="text-xs text-gray-500">
                              Last used: {new Date(secret.lastUsed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleSecretVisibility(secret.id)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                        >
                          {visibleSecrets.has(secret.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteSecret(secret.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {visibleSecrets.has(secret.id) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded font-mono text-sm">
                        ••••••••••••••••••••••••••••••••
                        <span className="text-xs text-gray-500 ml-2">(Encrypted with AWS KMS)</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold">Active Sessions</h2>
                <p className="text-gray-600">Manage your blockchain automation sessions</p>
              </div>
              <button
                onClick={handleCreateNewSession}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </button>
            </div>

            <div className="space-y-4">
              {sessionKeys.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active sessions</p>
                  <p className="text-gray-400 text-sm">Create a session key for automated transactions</p>
                </div>
              ) : (
                sessionKeys.map((session) => (
                  <div key={session.id} className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${session.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-medium font-mono text-sm">
                            {session.address.slice(0, 10)}...{session.address.slice(-8)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            session.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {session.isActive ? 'Active' : 'Expired'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {session.isActive 
                                ? `Expires in ${formatTimeUntilExpiry(session.expiresAt)}`
                                : 'Expired'
                              }
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Key className="w-4 h-4" />
                            <span>{session.permissions.length} permissions</span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Permissions:</div>
                          <div className="flex flex-wrap gap-1">
                            {session.permissions.map((permission) => (
                              <span
                                key={permission}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {permission.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        {session.isActive && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50 text-sm transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}