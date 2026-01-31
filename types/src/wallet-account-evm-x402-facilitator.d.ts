/** @typedef {import('@tetherto/wdk-wallet-evm').default} WalletAccountEvm */
/** @typedef {import('@x402/evm').FacilitatorEvmSigner} FacilitatorEvmSigner */
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
 * Object adapter that wraps a WalletAccountEvm instance to conform to the
 * FacilitatorEvmSigner interface required by x402 facilitators.
 *
 * Translates the WalletAccountEvm API (ethers.js based) into the
 * FacilitatorEvmSigner interface used by x402 for verifying and settling payments.
 *
 * @implements {FacilitatorEvmSigner}
 */
export default class WalletAccountEvmX402Facilitator implements FacilitatorEvmSigner {
    /**
     * Creates a new facilitator EVM signer adapter.
     *
     * @param {WalletAccountEvm} walletAccount - The WalletAccountEvm instance to adapt.
     */
    constructor(walletAccount: WalletAccountEvm);
    /** @type {WalletAccountEvm} */
    _adaptee: WalletAccountEvm;
    /**
     * Get all addresses this facilitator can use for signing.
     *
     * @returns {string[]}
     */
    getAddresses(): string[];
    /**
     * Get the bytecode at a given address.
     *
     * @param {GetCodeArgs} args - The address arguments.
     * @returns {Promise<string | undefined>}
     */
    getCode({ address }: GetCodeArgs): Promise<string | undefined>;
    /**
     * Read contract state.
     *
     * @param {ReadContractArgs} args - The contract read arguments.
     * @returns {Promise<unknown>}
     */
    readContract({ address, abi, functionName, args }: ReadContractArgs): Promise<unknown>;
    /**
     * Verify an EIP-712 typed data signature.
     *
     * @param {VerifyTypedDataArgs} args - The verification arguments.
     * @returns {Promise<boolean>}
     */
    verifyTypedData({ domain, types, message, signature }: VerifyTypedDataArgs): Promise<boolean>;
    /**
     * Write to a contract (send a state-changing transaction).
     *
     * @param {WriteContractArgs} args - The contract write arguments.
     * @returns {Promise<string>} The transaction hash.
     */
    writeContract({ address, abi, functionName, args }: WriteContractArgs): Promise<string>;
    /**
     * Send a raw transaction.
     *
     * @param {SendTransactionArgs} args - The transaction arguments.
     * @returns {Promise<string>} The transaction hash.
     */
    sendTransaction({ to, data }: SendTransactionArgs): Promise<string>;
    /**
     * Wait for a transaction to be mined and return its receipt.
     *
     * @param {WaitForTransactionReceiptArgs} args - The receipt arguments.
     * @returns {Promise<TransactionReceiptResult>}
     */
    waitForTransactionReceipt({ hash }: WaitForTransactionReceiptArgs): Promise<TransactionReceiptResult>;
}
export type WalletAccountEvm = import("@tetherto/wdk-wallet-evm").default;
export type FacilitatorEvmSigner = import("@x402/evm").FacilitatorEvmSigner;
export type ReadContractArgs = {
    /**
     * - The contract address.
     */
    address: string;
    /**
     * - The contract ABI.
     */
    abi: readonly unknown[];
    /**
     * - The function to call.
     */
    functionName: string;
    /**
     * - The function arguments.
     */
    args?: readonly unknown[];
};
export type VerifyTypedDataArgs = {
    /**
     * - The address that allegedly signed the data.
     */
    address: string;
    /**
     * - The EIP-712 domain.
     */
    domain: Record<string, unknown>;
    /**
     * - The EIP-712 types.
     */
    types: Record<string, unknown>;
    /**
     * - The primary type being signed.
     */
    primaryType: string;
    /**
     * - The structured message that was signed.
     */
    message: Record<string, unknown>;
    /**
     * - The hex-encoded signature.
     */
    signature: string;
};
export type WriteContractArgs = {
    /**
     * - The contract address.
     */
    address: string;
    /**
     * - The contract ABI.
     */
    abi: readonly unknown[];
    /**
     * - The function to call.
     */
    functionName: string;
    /**
     * - The function arguments.
     */
    args: readonly unknown[];
};
export type SendTransactionArgs = {
    /**
     * - The recipient address.
     */
    to: string;
    /**
     * - The transaction data in hex format.
     */
    data: string;
};
export type WaitForTransactionReceiptArgs = {
    /**
     * - The transaction hash.
     */
    hash: string;
};
export type GetCodeArgs = {
    /**
     * - The address to get the bytecode for.
     */
    address: string;
};
export type TransactionReceiptResult = {
    /**
     * - The transaction status ('success' or 'reverted').
     */
    status: string;
};
