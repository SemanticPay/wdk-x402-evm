import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import WalletAccountEvmX402Facilitator from '../index.js'

const ADDRESS = '0x405005C7c4422390F4B334F64Cf20E0b767131d0'
const PAYER_ADDRESS = '0x2Dd68bc0e919931fAA1e4233EC4a9c2B7e1e784C'
const CONTRACT_ADDRESS = '0xa460AEbce0d3A4BecAd8ccf9D6D4861296c503Bd'
const TX_HASH = '0xe60970cd7685466037bac1ff337e08265ac9f48af70a12529bdca5caf5a2b14b'

function createMockAdaptee (overrides = {}) {
  return {
    address: ADDRESS,
    _provider: {
      getCode: jest.fn(),
      waitForTransaction: jest.fn()
    },
    _account: {},
    sendTransaction: jest.fn(),
    ...overrides
  }
}

// Mock ethers.verifyTypedData at the module level
let mockRecoveredAddress = PAYER_ADDRESS
jest.unstable_mockModule('ethers', () => ({
  Contract: jest.fn().mockImplementation(() => ({})),
  verifyTypedData: jest.fn().mockImplementation(() => mockRecoveredAddress)
}))

describe('WalletAccountEvmX402Facilitator', () => {
  let adaptee, facilitator

  beforeEach(() => {
    adaptee = createMockAdaptee()
    facilitator = new WalletAccountEvmX402Facilitator(adaptee)
    mockRecoveredAddress = PAYER_ADDRESS
  })

  describe('constructor', () => {
    test('should store the wallet account as _adaptee', () => {
      expect(facilitator._adaptee).toBe(adaptee)
    })
  })

  describe('getAddresses', () => {
    test('should return an array containing the adaptee address', () => {
      const addresses = facilitator.getAddresses()
      expect(addresses).toEqual([ADDRESS])
    })
  })

  describe('getCode', () => {
    test('should return the bytecode from the provider', async () => {
      const bytecode = '0x6080604052'
      adaptee._provider.getCode.mockResolvedValue(bytecode)

      const result = await facilitator.getCode({ address: CONTRACT_ADDRESS })

      expect(result).toBe(bytecode)
      expect(adaptee._provider.getCode).toHaveBeenCalledWith(CONTRACT_ADDRESS)
    })

    test('should return undefined when the address has no code', async () => {
      adaptee._provider.getCode.mockResolvedValue('0x')

      const result = await facilitator.getCode({ address: CONTRACT_ADDRESS })

      expect(result).toBeUndefined()
    })
  })

describe('verifyTypedData', () => {
    const DOMAIN = { name: 'USDT0', version: '1', chainId: 9745, verifyingContract: CONTRACT_ADDRESS }
    const TYPES = { TransferWithAuthorization: [{ name: 'from', type: 'address' }] }
    const MESSAGE = { from: PAYER_ADDRESS }
    const SIGNATURE = '0xdeadbeef'

    test('should return the recovered address when signature is valid', async () => {
      mockRecoveredAddress = PAYER_ADDRESS

      const result = await facilitator.verifyTypedData({
        address: PAYER_ADDRESS,
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'TransferWithAuthorization',
        message: MESSAGE,
        signature: SIGNATURE
      })

      expect(result).toBe(PAYER_ADDRESS)
    })

    test('should return a mismatched address when signature was signed by someone else', async () => {
      mockRecoveredAddress = '0x0000000000000000000000000000000000000001'

      const result = await facilitator.verifyTypedData({
        address: PAYER_ADDRESS,
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'TransferWithAuthorization',
        message: MESSAGE,
        signature: SIGNATURE
      })

      expect(result).toBe('0x0000000000000000000000000000000000000001')
      expect(result).not.toBe(PAYER_ADDRESS)
    })

    test('should return the recovered address as-is without case normalization', async () => {
      mockRecoveredAddress = PAYER_ADDRESS.toLowerCase()

      const result = await facilitator.verifyTypedData({
        address: PAYER_ADDRESS,
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'TransferWithAuthorization',
        message: MESSAGE,
        signature: SIGNATURE
      })

      expect(result).toBe(PAYER_ADDRESS.toLowerCase())
    })

    test('should return the payer address even when payer differs from facilitator', async () => {
      expect(PAYER_ADDRESS).not.toBe(ADDRESS)
      mockRecoveredAddress = PAYER_ADDRESS

      const result = await facilitator.verifyTypedData({
        address: PAYER_ADDRESS,
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'TransferWithAuthorization',
        message: MESSAGE,
        signature: SIGNATURE
      })

      expect(result).toBe(PAYER_ADDRESS)
    })

    test('should not use the adaptee verifyTypedData method', async () => {
      adaptee.verifyTypedData = jest.fn()
      mockRecoveredAddress = PAYER_ADDRESS

      await facilitator.verifyTypedData({
        address: PAYER_ADDRESS,
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'TransferWithAuthorization',
        message: MESSAGE,
        signature: SIGNATURE
      })

      expect(adaptee.verifyTypedData).not.toHaveBeenCalled()
    })
  })

  describe('sendTransaction', () => {
    test('should delegate to the adaptee and return the hash', async () => {
      adaptee.sendTransaction.mockResolvedValue({ hash: TX_HASH, fee: 100n })

      const result = await facilitator.sendTransaction({
        to: CONTRACT_ADDRESS,
        data: '0x1234'
      })

      expect(result).toBe(TX_HASH)
      expect(adaptee.sendTransaction).toHaveBeenCalledWith({
        to: CONTRACT_ADDRESS,
        value: 0,
        data: '0x1234'
      })
    })
  })

  describe('waitForTransactionReceipt', () => {
    test('should return success when receipt status is 1', async () => {
      adaptee._provider.waitForTransaction.mockResolvedValue({ status: 1 })

      const result = await facilitator.waitForTransactionReceipt({ hash: TX_HASH })

      expect(result).toEqual({ status: 'success' })
      expect(adaptee._provider.waitForTransaction).toHaveBeenCalledWith(TX_HASH)
    })

    test('should return reverted when receipt status is 0', async () => {
      adaptee._provider.waitForTransaction.mockResolvedValue({ status: 0 })

      const result = await facilitator.waitForTransactionReceipt({ hash: TX_HASH })

      expect(result).toEqual({ status: 'reverted' })
    })
  })
})
