import { ethers } from 'ethers'

import { generateLedgerSignature } from './ledger'

interface SafeTransactionRequest {
  safe: string
  to: string
  value: string
  data: string
  operation: number
  gasToken: string
  safeTxGas: number
  baseGas: number
  gasPrice: number
  refundReceiver: string
  nonce: number
  contractTransactionHash: string
  sender: string
  signature: string
}

interface ProposalResult {
  safeTxHash: string
  url: string
}

export class GnosisSafeAdminClient {
  private apiKey: string
  private baseUrl: string = 'https://api.safe.global'

  constructor(config: { apiKey: string }) {
    if (!config.apiKey) {
      throw new Error(
        'SAFE_GLOBAL_API_KEY is required. Get your API key at: https://app.safe.global/settings/setup'
      )
    }
    this.apiKey = config.apiKey
  }

  async proposeTransaction(args: {
    safeAddress: string
    to: string
    data: string
    value?: string
    network: string
    nonceOffset?: number
  }): Promise<ProposalResult> {
    const {
      safeAddress,
      to,
      data,
      value = '0',
      network,
      nonceOffset = 0,
    } = args

    const nonce = await this.getNextNonce(safeAddress, network, nonceOffset)
    console.log({ nonce })

    const txHash = await this.generateTransactionHash(
      safeAddress,
      to,
      data,
      value,
      0,
      0,
      0,
      0,
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      nonce,
      network
    )

    const ledgerSignatureResult = await generateLedgerSignature({
      to,
      data,
      value,
      safeAddress,
      nonce,
      txHash,
    })

    const transactionRequest: SafeTransactionRequest = {
      safe: safeAddress,
      to,
      value,
      data,
      operation: 0,
      gasToken: '0x0000000000000000000000000000000000000000',
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce,
      contractTransactionHash: txHash,
      sender: ledgerSignatureResult.signerAddress,
      signature: ledgerSignatureResult.signature,
    }

    console.log(ledgerSignatureResult)
    console.log(transactionRequest)

    const response = await this.submitTransaction(transactionRequest, network)

    return {
      safeTxHash: response.safeTxHash || txHash,
      url: `${this.baseUrl}/app/transactions/queue?safe=${safeAddress}`,
    }
  }

  private async submitTransaction(
    transaction: SafeTransactionRequest,
    network: string
  ): Promise<{ safeTxHash: string }> {
    const txServiceHost = this.getTxServiceHost(network)
    const url = `${txServiceHost}/api/v1/safes/${transaction.safe}/multisig-transactions/`

    console.log(`submitTransaction ${url}`)

    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(transaction),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Failed to submit transaction to Safe: ${response.status} ${error}`
      )
    }

    const responseText = await response.text()

    // Safe API returns 201 with empty body on successful submission
    if (response.status === 201 && !responseText) {
      return {
        safeTxHash: transaction.contractTransactionHash,
      }
    }

    if (!responseText) {
      throw new Error('Empty response from Safe API')
    }

    return JSON.parse(responseText)
  }

  private async getNextNonce(
    safeAddress: string,
    network: string,
    offset: number = 0
  ): Promise<number> {
    const txServiceHost = this.getTxServiceHost(network)
    const url = `${txServiceHost}/api/v1/safes/${safeAddress}/`

    console.log(`getNextNonce ${url}`)

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to get Safe info: ${response.status} - ${errorText}`
      )
    }

    const safeInfo = await response.json()
    return parseInt(safeInfo.nonce) + offset
  }

  private getChainId(network: string): number {
    const chainIds: Record<string, number> = {
      mainnet: 1,
      sepolia: 11155111,
      polygon: 137,
      arbitrum: 42161,
    }
    return chainIds[network] || 1
  }

  private async generateTransactionHash(
    safeAddress: string,
    to: string,
    data: string,
    value: string,
    operation: number,
    safeTxGas: number,
    baseGas: number,
    gasPrice: number,
    gasToken: string,
    refundReceiver: string,
    nonce: number,
    network: string
  ): Promise<string> {
    const domain = {
      chainId: this.getChainId(network),
      verifyingContract: safeAddress,
    }

    const types = {
      SafeTx: [
        { type: 'address', name: 'to' },
        { type: 'uint256', name: 'value' },
        { type: 'bytes', name: 'data' },
        { type: 'uint8', name: 'operation' },
        { type: 'uint256', name: 'safeTxGas' },
        { type: 'uint256', name: 'baseGas' },
        { type: 'uint256', name: 'gasPrice' },
        { type: 'address', name: 'gasToken' },
        { type: 'address', name: 'refundReceiver' },
        { type: 'uint256', name: 'nonce' },
      ],
    }

    const message = {
      to,
      value,
      data,
      operation,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken,
      refundReceiver,
      nonce,
    }

    const safeTxHash = ethers.TypedDataEncoder.hash(domain, types, message)
    console.log(`tx hash is ${safeTxHash}`)
    return safeTxHash
  }

  private getTxServiceHost(network: string): string {
    const networkMap: Record<string, string> = {
      mainnet: 'https://safe-transaction-mainnet.safe.global',
      sepolia: 'https://safe-transaction-sepolia.safe.global',
      polygon: 'https://safe-transaction-polygon.safe.global',
      arbitrum: 'https://safe-transaction-arbitrum.safe.global',
    }
    return (
      networkMap[network] ||
      'https://safe-transaction-mainnet.safe.global'
    )
  }
}
