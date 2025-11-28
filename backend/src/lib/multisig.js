// Multi-Signature Service
// Handles multi-signature transaction management

class MultiSigService {
  constructor() {
    this.signers = ['0x742d35Cc6634C0532925a3b844Bc200e0f7ff11c'];
    this.requiredSignatures = 2;
    this.transactions = new Map();
    this.transactionCounter = 0;
  }

  /**
   * Get all signers
   * @returns {array} - Array of signer addresses
   */
  getSigners() {
    return this.signers;
  }

  /**
   * Add a new signer
   * @param {string} signerAddress - Address of new signer
   * @returns {object} - Result with updated signers
   */
  addSigner(signerAddress) {
    if (!signerAddress) {
      throw new Error('Signer address required');
    }
    if (this.signers.includes(signerAddress)) {
      throw new Error('Signer already exists');
    }
    this.signers.push(signerAddress);
    return {
      success: true,
      message: 'Signer added successfully',
      signers: this.signers,
      requiredSignatures: this.requiredSignatures
    };
  }

  /**
   * Create a new transaction
   * @param {string} description - Transaction description
   * @param {object} data - Transaction data
   * @returns {object} - Created transaction
   */
  createTransaction(description, data) {
    try {
      const txId = `tx_${++this.transactionCounter}`;
      const transaction = {
        id: txId,
        description: description,
        data: data,
        signatures: [],
        status: 'pending', // pending, approved, executed, cancelled
        createdAt: new Date(),
        createdBy: this.signers[0],
        executedAt: null
      };

      this.transactions.set(txId, transaction);
      return {
        success: true,
        message: 'Transaction created',
        txId: txId,
        transaction: transaction
      };
    } catch (error) {
      throw new Error(`Transaction creation failed: ${error.message}`);
    }
  }

  /**
   * Get a transaction by ID
   * @param {string} txId - Transaction ID
   * @returns {object} - Transaction object
   */
  getTransaction(txId) {
    return this.transactions.get(txId);
  }

  /**
   * Get all transactions
   * @returns {array} - Array of transactions
   */
  getAllTransactions() {
    return Array.from(this.transactions.values());
  }

  /**
   * Sign a transaction
   * @param {string} txId - Transaction ID
   * @param {string} signerAddress - Signer address
   * @returns {object} - Result with transaction update
   */
  signTransaction(txId, signerAddress) {
    try {
      const transaction = this.transactions.get(txId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction is not in pending state');
      }

      if (!this.signers.includes(signerAddress)) {
        throw new Error('Signer not authorized');
      }

      // Check if already signed by this signer
      const alreadySigned = transaction.signatures.some(sig => sig.signer === signerAddress);
      if (alreadySigned) {
        throw new Error('Already signed by this signer');
      }

      // Add signature
      transaction.signatures.push({
        signer: signerAddress,
        signedAt: new Date(),
        signature: `0x${Math.random().toString(16).slice(2)}`
      });

      // Update status if enough signatures
      if (transaction.signatures.length >= this.requiredSignatures) {
        transaction.status = 'approved';
      }

      return {
        success: true,
        message: 'Transaction signed',
        transaction: transaction,
        signaturesNeeded: Math.max(0, this.requiredSignatures - transaction.signatures.length)
      };
    } catch (error) {
      throw new Error(`Sign transaction failed: ${error.message}`);
    }
  }

  /**
   * Execute a transaction
   * @param {string} txId - Transaction ID
   * @returns {object} - Result with executed transaction
   */
  executeTransaction(txId) {
    try {
      const transaction = this.transactions.get(txId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'approved') {
        throw new Error('Transaction is not approved');
      }

      if (transaction.signatures.length < this.requiredSignatures) {
        throw new Error('Not enough signatures');
      }

      transaction.status = 'executed';
      transaction.executedAt = new Date();

      return {
        success: true,
        message: 'Transaction executed',
        transaction: transaction
      };
    } catch (error) {
      throw new Error(`Execute transaction failed: ${error.message}`);
    }
  }

  /**
   * Cancel a transaction
   * @param {string} txId - Transaction ID
   * @returns {object} - Result with cancelled transaction
   */
  cancelTransaction(txId) {
    try {
      const transaction = this.transactions.get(txId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'executed' || transaction.status === 'cancelled') {
        throw new Error('Cannot cancel executed or already cancelled transaction');
      }

      transaction.status = 'cancelled';

      return {
        success: true,
        message: 'Transaction cancelled',
        transaction: transaction
      };
    } catch (error) {
      throw new Error(`Cancel transaction failed: ${error.message}`);
    }
  }

  /**
   * Get transaction details with statistics
   * @param {string} txId - Transaction ID
   * @returns {object} - Detailed transaction info
   */
  getTransactionDetails(txId) {
    const transaction = this.transactions.get(txId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return {
      ...transaction,
      signaturesCount: transaction.signatures.length,
      signaturesRequired: this.requiredSignatures,
      canExecute: transaction.signatures.length >= this.requiredSignatures && transaction.status === 'approved'
    };
  }

  /**
   * Get multisig statistics
   * @returns {object} - Statistics
   */
  getStats() {
    const transactions = Array.from(this.transactions.values());
    return {
      totalSigners: this.signers.length,
      requiredSignatures: this.requiredSignatures,
      totalTransactions: transactions.length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      approvedTransactions: transactions.filter(t => t.status === 'approved').length,
      executedTransactions: transactions.filter(t => t.status === 'executed').length,
      cancelledTransactions: transactions.filter(t => t.status === 'cancelled').length
    };
  }
}

export default new MultiSigService();
