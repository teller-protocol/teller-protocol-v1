import { ethers } from 'ethers'

interface LedgerSignatureRequest {
  to: string
  data: string
  value?: string
  safeAddress: string
  nonce: number
  txHash?: string
}

interface LedgerSignatureResult {
  signature: string
  signerAddress: string
}

export async function generateLedgerSignature(
  request: LedgerSignatureRequest,
  options?: {
    ledgerAccountId?: number
    expectedOwners?: string[]
  }
): Promise<LedgerSignatureResult> {
  try {
    const TransportNodeHid =
      require('@ledgerhq/hw-transport-node-hid').default
    const AppEth = require('@ledgerhq/hw-app-eth').default

    const transport = await TransportNodeHid.create()
    const eth = new AppEth(transport)

    // Create EIP-712 hash for Gnosis Safe
    const domain = {
      chainId: 1,
      verifyingContract: request.safeAddress,
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
      to: request.to,
      value: request.value || '0',
      data: request.data,
      operation: 0,
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: request.nonce,
    }

    // Use provided transaction hash or generate EIP-712 hash
    const txHash =
      request.txHash ||
      ethers.TypedDataEncoder.hash(domain, types, message)

    const ledgerAccountId = options?.ledgerAccountId ?? 0
    const derivationPath = "44'/60'/0'/0/" + ledgerAccountId.toString()

    // Get the address for this derivation path
    const addressResult = await eth.getAddress(derivationPath)
    const signerAddress = addressResult.address

    console.log('REQUESTING LEDGER SIGNATURE', signerAddress)

    // Validate that this address is one of the expected Safe owners
    const expectedOwners = options?.expectedOwners ?? [
      '0xF3E864eAaFf9Cf2cD21A862d51D875093b4B5baA',
      '0x14A20b4B762b8d297859cf0477D86324d66aF69f',
      '0xc4437A559E672a6e7F982bdD82a1Da204068E5b1',
      '0xDECE128DD53fE69E6aF68bF0B2fef78a23F56D7b',
      '0xd0f036b8CC46ab00A380bbc35cA5713f0cdeE37D',
    ]

    if (!expectedOwners.includes(signerAddress)) {
      console.warn(
        `WARNING: Ledger address ${signerAddress} is not in the expected owners list!`
      )
      console.warn(`Expected owners: ${expectedOwners.join(', ')}`)
    }

    // Sign the EIP-712 hash as a personal message (Ledger fallback)
    const signature = await eth.signPersonalMessage(
      derivationPath,
      txHash.slice(2)
    )

    await transport.close()

    let v = signature.v

    // Ensure v is in the correct range (27 or 28)
    if (v < 27) {
      v += 27
    }

    const r = '0x' + signature.r
    const s = '0x' + signature.s

    // For personal message signatures, Gnosis Safe expects v + 4
    const signatureString =
      r + s.slice(2) + (v + 4).toString(16).padStart(2, '0')

    return {
      signature: signatureString,
      signerAddress,
    }
  } catch (error: any) {
    console.error('Failed to generate Ledger signature:', error)
    throw new Error(
      `Ledger signature generation failed: ${error.message}`
    )
  }
}
