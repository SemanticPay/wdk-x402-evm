# @semanticpay/wdk-wallet-evm-x402-facilitator

> **Note:** This package is currently in beta. Please test thoroughly in development environments before using in production.

An adapter module that converts `@tetherto/wdk-wallet-evm` wallet accounts into x402-compatible `FacilitatorEvmSigner` instances for EVM blockchains. This package bridges the WDK wallet ecosystem with the [x402 payment protocol](https://github.com/coinbase/x402), enabling WDK wallets to act as facilitators that verify and settle x402 payments on-chain.

This module can be managed by the `@tetherto/wdk` package, which provides a unified interface for managing multiple WDK wallet and protocol modules across different blockchains.

## About WDK

This module is part of the **WDK (Wallet Development Kit)** project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control.

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## Features

- **x402 Facilitator Adapter**: Wraps a `WalletAccountEvm` instance to implement the `FacilitatorEvmSigner` interface from `@x402/evm`
- **Contract Interaction**: Read and write to smart contracts via the adapted wallet
- **EIP-712 Verification**: Verify typed data signatures for x402 payment authorization
- **Transaction Management**: Send transactions and wait for receipts through the WDK wallet layer
- **Bytecode Inspection**: Check deployed contract code at any address
- **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install @semanticpay/wdk-wallet-evm-x402-facilitator
```

## Quick Start

### Creating a Facilitator Signer

```js
import { WalletAccountEvmX402Facilitator } from '@semanticpay/wdk-wallet-evm-x402-facilitator'
import WalletAccountEvm from '@tetherto/wdk-wallet-evm'

// Create a WDK EVM wallet account
const seedPhrase = 'your twelve word seed phrase goes here replace with your own'
const walletAccount = new WalletAccountEvm(seedPhrase, "0'/0/0", {
  provider: 'https://ethereum-rpc.publicnode.com'
})

// Wrap it as an x402 facilitator signer
const facilitator = new WalletAccountEvmX402Facilitator(walletAccount)
```

### Using with x402

```js
import { ExactEvmScheme } from '@x402/evm/exact/facilitator'

// Pass the facilitator signer to x402
const scheme = new ExactEvmScheme(facilitator)
```

### Reading Contract State

```js
const balance = await facilitator.readContract({
  address: '0xTokenContractAddress',
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: ['0xAccountAddress']
})
```

### Verifying a Typed Data Signature

```js
const isValid = await facilitator.verifyTypedData({
  address: '0xSignerAddress',
  domain: { name: 'x402', version: '1', chainId: 1 },
  types: { Payment: [{ name: 'amount', type: 'uint256' }] },
  primaryType: 'Payment',
  message: { amount: '1000000' },
  signature: '0x...'
})
```

### Sending a Transaction

```js
const txHash = await facilitator.sendTransaction({
  to: '0xRecipientAddress',
  data: '0x1234'
})

const receipt = await facilitator.waitForTransactionReceipt({ hash: txHash })
console.log('Status:', receipt.status) // 'success' or 'reverted'
```

### Writing to a Contract

```js
const txHash = await facilitator.writeContract({
  address: '0xContractAddress',
  abi: contractAbi,
  functionName: 'settle',
  args: [paymentId, amount]
})
```

### Checking Bytecode

```js
const code = await facilitator.getCode({ address: '0xContractAddress' })
if (code) {
  console.log('Contract is deployed')
} else {
  console.log('No contract at this address')
}
```

## API Reference

### WalletAccountEvmX402Facilitator

The main class that adapts a `WalletAccountEvm` instance to conform to the `FacilitatorEvmSigner` interface from `@x402/evm`. Uses the [Adapter pattern](https://en.wikipedia.org/wiki/Adapter_pattern) to translate the ethers.js-based WDK wallet API into the interface expected by x402 facilitators.

#### Constructor

```js
new WalletAccountEvmX402Facilitator(walletAccount)
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `walletAccount` | `WalletAccountEvm` | The WDK EVM wallet account to adapt |

#### Methods

| Method | Description | Returns |
|---|---|---|
| `getAddresses()` | Get all addresses this facilitator can use for signing | `string[]` |
| `getCode({ address })` | Get bytecode at an address | `Promise<string \| undefined>` |
| `readContract({ address, abi, functionName, args? })` | Read contract state | `Promise<unknown>` |
| `verifyTypedData({ address, domain, types, primaryType, message, signature })` | Verify an EIP-712 typed data signature | `Promise<boolean>` |
| `writeContract({ address, abi, functionName, args })` | Write to a contract (state-changing transaction) | `Promise<string>` |
| `sendTransaction({ to, data })` | Send a raw transaction | `Promise<string>` |
| `waitForTransactionReceipt({ hash })` | Wait for a transaction to be mined | `Promise<{ status: string }>` |

---

#### `getAddresses()`

Returns an array containing the wallet account's address.

**Returns:** `string[]`

```js
const addresses = facilitator.getAddresses()
// ['0x405005C7c4422390F4B334F64Cf20E0b767131d0']
```

---

#### `getCode({ address })`

Gets the bytecode deployed at a given address. Returns `undefined` if no contract is deployed.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `address` | `string` | The address to check |

**Returns:** `Promise<string | undefined>`

```js
const code = await facilitator.getCode({ address: '0xContractAddress' })
```

---

#### `readContract({ address, abi, functionName, args? })`

Reads contract state by calling a view/pure function.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `address` | `string` | The contract address |
| `abi` | `readonly unknown[]` | The contract ABI |
| `functionName` | `string` | The function to call |
| `args` | `readonly unknown[]` | The function arguments (optional, defaults to `[]`) |

**Returns:** `Promise<unknown>`

```js
const result = await facilitator.readContract({
  address: '0xContractAddress',
  abi: contractAbi,
  functionName: 'balanceOf',
  args: ['0xAccountAddress']
})
```

---

#### `verifyTypedData({ address, domain, types, primaryType, message, signature })`

Verifies an EIP-712 typed data signature.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `address` | `string` | The address that allegedly signed the data |
| `domain` | `Record<string, unknown>` | The EIP-712 domain |
| `types` | `Record<string, unknown>` | The EIP-712 types |
| `primaryType` | `string` | The primary type being signed |
| `message` | `Record<string, unknown>` | The structured message that was signed |
| `signature` | `string` | The hex-encoded signature |

**Returns:** `Promise<boolean>`

```js
const isValid = await facilitator.verifyTypedData({
  address: '0xSignerAddress',
  domain: { name: 'x402', version: '1', chainId: 1 },
  types: { Payment: [{ name: 'amount', type: 'uint256' }] },
  primaryType: 'Payment',
  message: { amount: '1000000' },
  signature: '0xdeadbeef...'
})
```

---

#### `writeContract({ address, abi, functionName, args })`

Sends a state-changing transaction to a contract.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `address` | `string` | The contract address |
| `abi` | `readonly unknown[]` | The contract ABI |
| `functionName` | `string` | The function to call |
| `args` | `readonly unknown[]` | The function arguments |

**Returns:** `Promise<string>` - The transaction hash

```js
const txHash = await facilitator.writeContract({
  address: '0xContractAddress',
  abi: contractAbi,
  functionName: 'settle',
  args: [paymentId, amount]
})
```

---

#### `sendTransaction({ to, data })`

Sends a raw transaction.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `to` | `string` | The recipient address |
| `data` | `string` | The transaction data in hex format |

**Returns:** `Promise<string>` - The transaction hash

```js
const txHash = await facilitator.sendTransaction({
  to: '0xRecipientAddress',
  data: '0x1234'
})
```

---

#### `waitForTransactionReceipt({ hash })`

Waits for a transaction to be mined and returns its receipt.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `hash` | `string` | The transaction hash |

**Returns:** `Promise<{ status: string }>` - `status` is `'success'` or `'reverted'`

```js
const receipt = await facilitator.waitForTransactionReceipt({ hash: txHash })
console.log(receipt.status) // 'success' or 'reverted'
```

## Supported Networks

This package works with any EVM-compatible blockchain supported by `@tetherto/wdk-wallet-evm`, including:

- Ethereum Mainnet
- Ethereum Testnets (Sepolia, etc.)
- Layer 2 Networks (Arbitrum, Optimism, Base, etc.)
- Other EVM Chains (Polygon, Avalanche C-Chain, etc.)

## Security Considerations

- **Seed Phrase Security**: Always store your seed phrase securely and never share it
- **Private Key Management**: The underlying `WalletAccountEvm` handles private keys internally with memory safety features
- **RPC Provider Security**: Use trusted RPC endpoints and consider running your own node
- **Transaction Validation**: Always validate transaction details before signing
- **Contract Verification**: Verify contract addresses and ABIs before interacting with them
- **Signature Verification**: Ensure domain and type parameters match expected values when verifying signatures

## Development

### Building

```bash
# Install dependencies
npm install

# Build TypeScript definitions
npm run build:types

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```