import { Request, Response } from 'express';
import { MessageBroker } from '../agents/core/MessageBroker';
import { v4 as uuidv4 } from 'uuid';

interface ConfirmTransactionRequest {
  transactionId: string;
  transactionHash: string;
  isCompanionNFT: boolean;
}

export async function confirmTransactionHandler(req: Request, res: Response): Promise<void> {
  try {
    const { transactionId, transactionHash, isCompanionNFT } = req.body as ConfirmTransactionRequest;

    if (!transactionId || !transactionHash) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing transactionId or transactionHash' 
      });
      return;
    }

    console.log('[ConfirmTransaction] Processing transaction confirmation:', {
      transactionId,
      transactionHash,
      isCompanionNFT
    });

    // Send message to NebulaMCP to confirm the transaction
    const messageBroker = MessageBroker.getInstance();
    const confirmationMessage = {
      id: uuidv4(),
      type: 'transaction_confirmation',
      timestamp: new Date().toISOString(),
      payload: {
        transactionId,
        transactionHash,
        isCompanionNFT
      },
      sourceId: 'api-endpoint',
      targetId: 'nebula-mcp'
    };

    // Publish the message to NebulaMCP
    await messageBroker.publish('nebula_request', confirmationMessage);

    console.log('[ConfirmTransaction] ✅ Transaction confirmation sent to NebulaMCP');

    res.json({
      success: true,
      message: 'Transaction confirmation processed',
      transactionId,
      transactionHash
    });

  } catch (error) {
    console.error('[ConfirmTransaction] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during transaction confirmation'
    });
  }
}