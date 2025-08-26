import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { TransactionStatus } from '../hooks/useManualTransaction';

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  transactionHash?: string;
  description?: string;
  isCompanionNFT?: boolean;
}

export const TransactionConfirmationModal: React.FC<TransactionConfirmationModalProps> = ({
  isOpen,
  onClose,
  status,
  transactionHash,
  description,
  isCompanionNFT
}) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'preparing':
      case 'pending':
        return <Clock className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'confirming':
        return <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />;
      case 'confirmed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'preparing':
        return 'Preparing transaction...';
      case 'pending':
        return 'Please confirm the transaction in your wallet';
      case 'confirming':
        return 'Transaction submitted, waiting for confirmation...';
      case 'confirmed':
        return isCompanionNFT ? 'Companion NFT created successfully!' : 'Transaction confirmed!';
      case 'failed':
        return `Transaction failed: ${status.error}`;
      default:
        return 'Processing...';
    }
  };

  const getExplorerUrl = () => {
    if (!transactionHash) return null;
    // Base Camp testnet explorer
    return `https://basecamp.blockscout.com/tx/${transactionHash}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Transaction Status
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">{description}</p>
            <p className="font-medium">{getStatusMessage()}</p>
          </div>

          {transactionHash && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
              <p className="text-sm font-mono break-all">{transactionHash}</p>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(), '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </div>
          )}

          {isCompanionNFT && status.status === 'confirmed' && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-green-800 text-sm font-medium">
                🤖 Your AI companion has been created and added to your account!
              </p>
            </div>
          )}

          {status.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-red-800 text-sm">
                Please try again or check your wallet connection.
              </p>
            </div>
          )}

          {(status.status === 'confirmed' || status.status === 'failed') && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};