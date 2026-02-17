'use strict'

import { Contract } from 'ethers'

/** @typedef {import('@tetherto/wdk-wallet-evm').default} WalletAccountEvm */
/** @typedef {import('@x402/evm').FacilitatorEvmSigner} FacilitatorEvmSigner */

/**
 * @typedef {Object} ReadContractArgs
 * @property {`0x${string}`} address - The contract address.
 * @property {readonly unknown[]} abi - The contract ABI.
 * @property {string} functionName - The function to call.
 * @property {readonly unknown[]} [args] - The function arguments.
 */

/**
 * @typedef {Object} VerifyTypedDataArgs
 * @property {`0x${string}`} address - The address that allegedly signed the data.
 * @property {Record<string, unknown>} domain - The EIP-712 domain.
 * @property {Record<string, unknown>} types - The EIP-712 types.
 * @property {string} primaryType - The primary type being signed.
 * @property {Record<string, unknown>} message - The structured message that was signed.
 * @property {`0x${string}`} signature - The hex-encoded signature.
 */

/**
 * @typedef {Object} WriteContractArgs
 * @property {`0x${string}`} address - The contract address.
 * @property {readonly unknown[]} abi - The contract ABI.
 * @property {string} functionName - The function to call.
 * @property {readonly unknown[]} args - The function arguments.
 */

/**
 * @typedef {Object} SendTransactionArgs
 * @property {`0x${string}`} to - The recipient address.
 * @property {`0x${string}`} data - The transaction data in hex format.
 */

/**
 * @typedef {Object} WaitForTransactionReceiptArgs
 * @property {`0x${string}`} hash - The transaction hash.
 */

/**
 * @typedef {Object} GetCodeArgs
 * @property {`0x${string}`} address - The address to get the bytecode for.
 */

/**
 * @typedef {Object} TransactionReceiptResult
 * @property {string} status - The transaction status ('success' or 'reverted').
 */

/**
 * Object adapter that wraps a WalletAccountEvm instance to conform to the
 * FacilitatorEvmSigner interface required by x402 facilitators.
 *
 * Translates the WalletAccountEvm API (ethers.js based) into the
 * FacilitatorEvmSigner interface used by x402 for verifying and settling payments.
 *
 * @implements {FacilitatorEvmSigner}
 */
export default class WalletAccountEvmX402Facilitator {
  /**
   * Creates a new facilitator EVM signer adapter.
   *
   * @param {WalletAccountEvm} walletAccount - The WalletAccountEvm instance to adapt.
   */
  constructor (walletAccount) {
    /** @type {WalletAccountEvm} */
    this._adaptee = walletAccount
  }

  /**
   * Get all addresses this facilitator can use for signing.
   *
   * @returns {readonly `0x${string}`[]}
   */
  getAddresses () {
    return [this._adaptee.address]
  }

  /**
   * Get the bytecode at a given address.
   *
   * @param {GetCodeArgs} args - The address arguments.
   * @returns {Promise<`0x${string}` | undefined>}
   */
  async getCode ({ address }) {
    const code = await this._adaptee._provider.getCode(address)
    return code === '0x' ? undefined : code
  }

  /**
   * Read contract state.
   *
   * @param {ReadContractArgs} args - The contract read arguments.
   * @returns {Promise<unknown>}
   */
  async readContract ({ address, abi, functionName, args = [] }) {
    const contract = new Contract(address, abi, this._adaptee._provider)
    return contract[functionName](...args)
  }

  /**
   * Verify an EIP-712 typed data signature.
   *
   * @param {VerifyTypedDataArgs} args - The verification arguments.
   * @returns {Promise<boolean>}
   */
  async verifyTypedData ({ domain, types, message, signature }) {
    const { verifyTypedData } = await import('ethers')
    return verifyTypedData(domain, types, message, signature)
  }

  /**
   * Write to a contract (send a state-changing transaction).
   *
   * @param {WriteContractArgs} args - The contract write arguments.
   * @returns {Promise<`0x${string}`>} The transaction hash.
   */
  async writeContract ({ address, abi, functionName, args }) {
    const contract = new Contract(address, abi, this._adaptee._account)
    const tx = await contract[functionName](...args)
    return tx.hash
  }

  /**
   * Send a raw transaction.
   *
   * @param {SendTransactionArgs} args - The transaction arguments.
   * @returns {Promise<`0x${string}`>} The transaction hash.
   */
  async sendTransaction ({ to, data }) {
    const { hash } = await this._adaptee.sendTransaction({ to, value: 0, data })
    return hash
  }

  /**
   * Wait for a transaction to be mined and return its receipt.
   *
   * @param {WaitForTransactionReceiptArgs} args - The receipt arguments.
   * @returns {Promise<TransactionReceiptResult>}
   */
  async waitForTransactionReceipt ({ hash }) {
    const receipt = await this._adaptee._provider.waitForTransaction(hash)
    return { status: receipt.status === 1 ? 'success' : 'reverted' }
  }
}
