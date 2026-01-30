import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { WalletAccountEvmFacilitator } from '../index.js'

const ADDRESS = '0x405005C7c4422390F4B334F64Cf20E0b767131d0'
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
    verifyTypedData: jest.fn(),
    sendTransaction: jest.fn(),
    ...overrides
  }
}

describe('WalletAccountEvmFacilitator', () => {
  let adaptee, facilitator

  beforeEach(() => {
    adaptee = createMockAdaptee()
    facilitator = new WalletAccountEvmFacilitator(adaptee)
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
    const DOMAIN = { name: 'Test', version: '1', chainId: 1 }
    const TYPES = { Message: [{ name: 'content', type: 'string' }] }
    const MESSAGE = { content: 'hello' }
    const SIGNATURE = '0xdeadbeef'

    test('should delegate to the adaptee verifyTypedData', async () => {
      adaptee.verifyTypedData.mockResolvedValue(true)

      const result = await facilitator.verifyTypedData({
        address: ADDRESS,
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'Message',
        message: MESSAGE,
        signature: SIGNATURE
      })

      expect(result).toBe(true)
      expect(adaptee.verifyTypedData).toHaveBeenCalledWith(
        { domain: DOMAIN, types: TYPES, message: MESSAGE },
        SIGNATURE
      )
    })

    test('should return false when the adaptee returns false', async () => {
      adaptee.verifyTypedData.mockResolvedValue(false)

      const result = await facilitator.verifyTypedData({
        address: ADDRESS,
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'Message',
        message: MESSAGE,
        signature: SIGNATURE
      })

      expect(result).toBe(false)
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
