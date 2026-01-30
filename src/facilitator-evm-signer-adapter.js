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

import { Contract, verifyTypedData as ethersVerifyTypedData } from 'ethers'

import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'

/** @typedef {import('@tetherto/wdk-wallet-evm').EvmWalletConfig} EvmWalletConfig */

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
 * Adapter that extends WalletAccountEvm to conform to the FacilitatorEvmSigner
 * interface required by x402 facilitators.
 *
 * Translates the WalletAccountEvm API (ethers.js based) into the
 * FacilitatorEvmSigner interface used by x402 for verifying and settling payments.
 *
 * @extends WalletAccountEvm
 * @implements {FacilitatorEvmSigner}
 */
export default class FacilitatorEvmSignerAdapter extends WalletAccountEvm {
  /**
   * Creates a new facilitator EVM signer adapter.
   *
   * @param {string | Uint8Array} seed - The wallet's BIP-39 seed phrase.
   * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
   * @param {EvmWalletConfig} [config] - The configuration object.
   */
  constructor (seed, path, config = {}) {
    super(seed, path, config)
  }

  /**
   * Get all addresses this facilitator can use for signing.
   * Enables dynamic address selection for load balancing and key rotation.
   *
   * @returns {string[]}
   */
  getAddresses () {
    return [this._account.address]
  }

  /**
   * Read contract state.
   *
   * @param {ReadContractArgs} args - The contract read arguments.
   * @returns {Promise<unknown>}
   */
  async readContract (args) {
    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider to read contracts.')
    }

    const { address, abi, functionName, args: fnArgs = [] } = args
    const contract = new Contract(address, abi, this._provider)

    return await contract[functionName](...fnArgs)
  }

  /**
   * Verify an EIP-712 typed data signature.
   *
   * @param {VerifyTypedDataArgs} args - The verification arguments.
   * @returns {Promise<boolean>}
   */
  async verifyTypedData (args) {
    const { address, domain, types, message, signature } = args

    const typesWithoutEIP712Domain = { ...types }
    delete typesWithoutEIP712Domain.EIP712Domain

    const recoveredAddress = ethersVerifyTypedData(
      domain,
      typesWithoutEIP712Domain,
      message,
      signature
    )

    return recoveredAddress.toLowerCase() === address.toLowerCase()
  }

  /**
   * Write to a contract (send a state-changing transaction).
   *
   * @param {WriteContractArgs} args - The contract write arguments.
   * @returns {Promise<string>} The transaction hash.
   */
  async writeContract (args) {
    if (!this._account.provider) {
      throw new Error('The wallet must be connected to a provider to write contracts.')
    }

    const { address, abi, functionName, args: fnArgs } = args
    const contract = new Contract(address, abi, this._account)
    const tx = await contract[functionName](...fnArgs)

    return tx.hash
  }

  /**
   * Send a raw transaction.
   *
   * @param {SendTransactionArgs} args - The transaction arguments.
   * @returns {Promise<string>} The transaction hash.
   */
  async sendTransaction (args) {
    if (!this._account.provider) {
      throw new Error('The wallet must be connected to a provider to send transactions.')
    }

    const { to, data } = args
    const tx = await this._account.sendTransaction({ to, data })

    return tx.hash
  }

  /**
   * Wait for a transaction to be mined and return its receipt.
   *
   * @param {WaitForTransactionReceiptArgs} args - The receipt arguments.
   * @returns {Promise<TransactionReceiptResult>}
   */
  async waitForTransactionReceipt (args) {
    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider to wait for transaction receipts.')
    }

    const { hash } = args
    const receipt = await this._provider.waitForTransaction(hash)

    return { status: receipt.status === 1 ? 'success' : 'reverted' }
  }

  /**
   * Get the bytecode at a given address.
   *
   * @param {GetCodeArgs} args - The address arguments.
   * @returns {Promise<string | undefined>}
   */
  async getCode (args) {
    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider to get contract code.')
    }

    const { address } = args
    const code = await this._provider.getCode(address)

    if (code === '0x') return undefined

    return code
  }
}
