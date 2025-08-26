import { useState, useCallback } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareTransaction } from 'thirdweb';
import { baseCamp } from '../lib/chains';

interface TransactionData {
  type: string;
  transaction: {
    to: string;
    value: string;
    data: string;
    gasLimit: string;
    chainId: number;
  } | null;
  description: string;
  isCompanionNFT: boolean;
  rawMessage?: string;
}

interface ManualTransactionPayload {
  requiresManualSigning: boolean;
  transactionId: string;
  transactionData: TransactionData;
  taskId: string;
}

export interface TransactionStatus {
  status: 'idle' | 'preparing' | 'pending' | 'confirming' | 'confirmed' | 'failed';
  transactionHash?: string;
  error?: string;
}

export const useManualTransaction = () => {
  const [status, setStatus] = useState<TransactionStatus>({ status: 'idle' });
  const activeAccount = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  const executeManualTransaction = useCallback(async (
    payload: ManualTransactionPayload,
    onSuccess?: (txHash: string) => void,
    onError?: (error: string) => void
  ) => {
    if (!activeAccount) {
      const error = 'No active wallet connected';
      setStatus({ status: 'failed', error });
      onError?.(error);
      return;
    }

    if (!payload.transactionData.transaction) {
      const error = 'Invalid transaction data';
      setStatus({ status: 'failed', error });
      onError?.(error);
      return;
    }

    try {
      setStatus({ status: 'preparing' });

      const { transaction } = payload.transactionData;
      
      // Prepare the transaction for Thirdweb
      const tx = prepareTransaction({
        to: transaction.to as `0x${string}`,
        value: BigInt(transaction.value),
        data: transaction.data as `0x${string}`,
        gas: BigInt(transaction.gasLimit),
        chain: baseCamp,
      });

      console.log('[useManualTransaction] Prepared transaction:', {
        to: transaction.to,
        value: transaction.value,
        chainId: transaction.chainId,
        isCompanionNFT: payload.transactionData.isCompanionNFT
      });

      setStatus({ status: 'pending' });

      // Send the transaction and wait for confirmation
      const result = await sendTransaction(tx);
      const transactionHash = result.transactionHash;

      console.log('[useManualTransaction] Transaction sent:', transactionHash);
      setStatus({ status: 'confirming', transactionHash });

      // Confirm the transaction with the backend
      await confirmTransactionWithBackend(
        payload.transactionId, 
        transactionHash, 
        payload.transactionData.isCompanionNFT
      );

      setStatus({ status: 'confirmed', transactionHash });
      onSuccess?.(transactionHash);

    } catch (error: any) {
      console.error('[useManualTransaction] Transaction failed:', error);
      const errorMessage = error.message || 'Transaction failed';
      setStatus({ status: 'failed', error: errorMessage });
      onError?.(errorMessage);
    }
  }, [activeAccount, sendTransaction]);

  const confirmTransactionWithBackend = async (
    transactionId: string,
    transactionHash: string,
    isCompanionNFT: boolean
  ) => {
    try {
      const response = await fetch('/api/agents/confirm-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          transactionHash,
          isCompanionNFT
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend confirmation failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[useManualTransaction] Backend confirmation:', result);
      
      return result;
    } catch (error) {
      console.error('[useManualTransaction] Backend confirmation error:', error);
      throw error;
    }
  };

  const reset = useCallback(() => {
    setStatus({ status: 'idle' });
  }, []);

  return {
    status,
    executeManualTransaction,
    reset
  };
};