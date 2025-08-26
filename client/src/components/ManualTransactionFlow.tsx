import React, { useState, useEffect } from 'react';
import { useManualTransaction } from '../hooks/useManualTransaction';
import { TransactionConfirmationModal } from './TransactionConfirmationModal';

interface ManualTransactionFlowProps {
  transactionPayload: any;
  onSuccess: (txHash: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export const ManualTransactionFlow: React.FC<ManualTransactionFlowProps> = ({
  transactionPayload,
  onSuccess,
  onError,
  onCancel
}) => {
  const { status, executeManualTransaction, reset } = useManualTransaction();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (transactionPayload && transactionPayload.requiresManualSigning) {
      setIsModalOpen(true);
      
      // Start the manual transaction process immediately
      executeManualTransaction(
        transactionPayload,
        (txHash) => {
          console.log('[ManualTransactionFlow] Transaction successful:', txHash);
          onSuccess(txHash);
          setTimeout(() => setIsModalOpen(false), 3000); // Keep modal open to show success
        },
        (error) => {
          console.error('[ManualTransactionFlow] Transaction failed:', error);
          onError(error);
          setTimeout(() => setIsModalOpen(false), 2000);
        }
      );
    }
  }, [transactionPayload, executeManualTransaction, onSuccess, onError]);

  const handleClose = () => {
    if (status.status === 'confirmed' || status.status === 'failed') {
      setIsModalOpen(false);
      reset();
    } else if (status.status === 'idle') {
      setIsModalOpen(false);
      onCancel();
    }
  };

  if (!transactionPayload || !transactionPayload.requiresManualSigning) {
    return null;
  }

  return (
    <TransactionConfirmationModal
      isOpen={isModalOpen}
      onClose={handleClose}
      status={status}
      transactionHash={status.transactionHash}
      description={transactionPayload.transactionData?.description}
      isCompanionNFT={transactionPayload.transactionData?.isCompanionNFT}
    />
  );
};