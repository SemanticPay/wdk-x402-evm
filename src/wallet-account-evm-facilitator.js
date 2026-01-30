// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

import { Contract, verifyTypedData } from 'ethers'

/** @typedef {import('@tetherto/wdk-wallet-evm').default} WalletAccountEvm */

/**
 * @typedef {Object} ReadContractArgs
 * @property {string} address - The contract address.
 * @property {readonly unknown[]} abi - The contract ABI.
 * @property {string} functionName - The function to call.
 * @property {readonly unknown[]} [args] - The function arguments.
 */

/**
 * @typedef {Object} VerifyTypedDataArgs
 * @property {string} address - The address that allegedly signed the data.
 * @property {Record<string, unknown>} domain - The EIP-712 domain.
 * @property {Record<string, unknown>} types - The EIP-712 types.
 * @property {string} primaryType - The primary type being signed.
 * @property {Record<string, unknown>} message - The structured message that was signed.
 * @property {string} signature - The hex-encoded signature.
 */

/**
 * @typedef {Object} WriteContractArgs
 * @property {string} address - The contract address.
 * @property {readonly unknown[]} abi - The contract ABI.
 * @property {string} functionName - The function to call.
 * @property {readonly unknown[]} args - The function arguments.
 */

/**
 * @typedef {Object} SendTransactionArgs
 * @property {string} to - The recipient address.
 * @property {string} data - The transaction data in hex format.
 */

/**
 * @typedef {Object} WaitForTransactionReceiptArgs
 * @property {string} hash - The transaction hash.
 */

/**
 * @typedef {Object} GetCodeArgs
 * @property {string} address - The address to get the bytecode for.
 */

/**
 * @typedef {Object} TransactionReceiptResult
 * @property {string} status - The transaction status ('success' or 'reverted').
 */

/**
 * @typedef {Object} FacilitatorEvmSigner
 * @property {() => string[]} getAddresses - Get all addresses this facilitator can use for signing.
 * @property {(args: ReadContractArgs) => Promise<unknown>} readContract - Read contract state.
 * @property {(args: VerifyTypedDataArgs) => Promise<boolean>} verifyTypedData - Verify an EIP-712 typed data signature.
 * @property {(args: WriteContractArgs) => Promise<string>} writeContract - Write to a contract.
 * @property {(args: SendTransactionArgs) => Promise<string>} sendTransaction - Send a raw transaction.
 * @property {(args: WaitForTransactionReceiptArgs) => Promise<TransactionReceiptResult>} waitForTransactionReceipt - Wait for a transaction receipt.
 * @property {(args: GetCodeArgs) => Promise<string | undefined>} getCode - Get bytecode at an address.
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
export default class WalletAccountEvmFacilitator {
  /**
   * Creates a new facilitator EVM signer adapter.
   *
   * @param {WalletAccountEvm} walletAccount - The WalletAccountEvm instance to adapt.
   */
  constructor (walletAccount) {
    /** @type {WalletAccountEvm} */
    this.adaptee = walletAccount
  }

  /**
   * Get all addresses this facilitator can use for signing.
   *
   * @returns {string[]}
   */
  getAddresses () {
    return [this.adaptee._address]
  }

  /**
   * Get the bytecode at a given address.
   *
   * @param {GetCodeArgs} args - The address arguments.
   * @returns {Promise<string | undefined>}
   */
  async getCode ({ address }) {
    const code = await this.adaptee._provider.getCode(address)
    return code === '0x' ? undefined : code
  }

  /**
   * Read contract state.
   *
   * @param {ReadContractArgs} args - The contract read arguments.
   * @returns {Promise<unknown>}
   */
  async readContract ({ address, abi, functionName, args = [] }) {
    const contract = new Contract(address, abi, this.adaptee._provider)
    return contract[functionName](...args)
  }

  /**
   * Verify an EIP-712 typed data signature.
   *
   * @param {VerifyTypedDataArgs} args - The verification arguments.
   * @returns {Promise<boolean>}
   */
  async verifyTypedData ({ address, domain, types, primaryType, message, signature }) {
    const { [primaryType]: _, ...typesWithoutPrimary } = types
    const recovered = verifyTypedData(domain, typesWithoutPrimary, message, signature)
    return recovered.toLowerCase() === address.toLowerCase()
  }

  /**
   * Write to a contract (send a state-changing transaction).
   *
   * @param {WriteContractArgs} args - The contract write arguments.
   * @returns {Promise<string>} The transaction hash.
   */
  async writeContract ({ address, abi, functionName, args }) {
    const contract = new Contract(address, abi, this.adaptee._account)
    const tx = await contract[functionName](...args)
    return tx.hash
  }

  /**
   * Send a raw transaction.
   *
   * @param {SendTransactionArgs} args - The transaction arguments.
   * @returns {Promise<string>} The transaction hash.
   */
  async sendTransaction ({ to, data }) {
    const { hash } = await this.adaptee.sendTransaction({ to, value: 0, data })
    return hash
  }

  /**
   * Wait for a transaction to be mined and return its receipt.
   *
   * @param {WaitForTransactionReceiptArgs} args - The receipt arguments.
   * @returns {Promise<TransactionReceiptResult>}
   */
  async waitForTransactionReceipt ({ hash }) {
    const receipt = await this.adaptee._provider.waitForTransaction(hash)
    return { status: receipt.status === 1 ? 'success' : 'reverted' }
  }
}
