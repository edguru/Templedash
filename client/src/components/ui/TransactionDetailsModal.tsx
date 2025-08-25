import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, Clock, Copy } from 'lucide-react';

interface TransactionDetails {
  hash: string;
  network: string;
  type: string;
  value: string;
  character?: string;
  explorer: string;
  gasUsed: string;
  status: string;
  signerAddress?: string;
}

interface TransactionDetailsModalProps {
  transaction: TransactionDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetailsModal({ transaction, isOpen, onClose }: TransactionDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Transaction Successful</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 font-medium">{transaction.status}</span>
          </div>

          {/* Transaction Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <p className="text-gray-900">{transaction.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Network</label>
              <p className="text-gray-900">{transaction.network}</p>
            </div>
          </div>

          {/* Value and Character */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Value</label>
              <p className="text-gray-900">{transaction.value}</p>
            </div>
            {transaction.character && (
              <div>
                <label className="text-sm font-medium text-gray-500">Character</label>
                <p className="text-gray-900">{transaction.character}</p>
              </div>
            )}
          </div>

          {/* Transaction Hash */}
          <div>
            <label className="text-sm font-medium text-gray-500">Transaction Hash</label>
            <div className="flex items-center space-x-2 mt-1 p-2 bg-gray-50 rounded">
              <code className="text-sm text-gray-800 break-all">{transaction.hash}</code>
              <button
                onClick={() => copyToClipboard(transaction.hash)}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
            )}
          </div>

          {/* Session Signer */}
          {transaction.signerAddress && (
            <div>
              <label className="text-sm font-medium text-gray-500">Session Signer</label>
              <p className="text-gray-900 text-sm">{transaction.signerAddress}</p>
              <p className="text-xs text-gray-500">Transaction signed automatically with your session key</p>
            </div>
          )}

          {/* Gas */}
          <div>
            <label className="text-sm font-medium text-gray-500">Gas</label>
            <p className="text-gray-900 text-sm">{transaction.gasUsed}</p>
          </div>

          {/* Explorer Link */}
          <a
            href={transaction.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View on Block Explorer</span>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}