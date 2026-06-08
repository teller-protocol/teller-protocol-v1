import { BigNumberish, BytesLike, Signature } from 'ethers'
// import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { ITellerDiamond } from '../../types/typechain'
import { NULL_ADDRESS } from '../../utils/consts'

interface CRAArgs {
  lendingToken: string
  loanAmount: BigNumberish
  loanTermLength: BigNumberish
  collateralRatio: BigNumberish
  interestRate: BigNumberish
  borrower: string
  recipient?: string
}

export interface CRARequest {
  borrower: string
  recipient: string
  assetAddress: string
  requestNonce: BigNumberish
  amount: BigNumberish
  duration: BigNumberish
  requestTime: BigNumberish
}

export interface CRAResponse {
  signer: string
  assetAddress: string
  responseTime: BigNumberish
  interestRate: BigNumberish
  collateralRatio: BigNumberish
  maxLoanAmount: BigNumberish
  signature: {
    v: BigNumberish
    r: BytesLike
    s: BytesLike
  }
}

export interface CRAReturn {
  request: CRARequest
  responses: CRAResponse[]
}

export const mockCRAResponse = async (
  hre: HardhatRuntimeEnvironment,
  args: CRAArgs
): Promise<CRAReturn> => {
  const { contracts, getNamedSigner, ethers } = hre
  const network = await ethers.provider.getNetwork()
  const chainId = network.chainId.toString()

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const { length: nonce } = await diamond.getBorrowerLoans(args.borrower)

  const block = await ethers.provider.getBlock('latest')
  const currentTimestamp = block!.timestamp
  const request: CRARequest = {
    borrower: args.borrower,
    recipient: args.recipient ?? NULL_ADDRESS,
    assetAddress: args.lendingToken,
    requestNonce: nonce,
    amount: args.loanAmount,
    duration: args.loanTermLength,
    requestTime: currentTimestamp,
  }
  const abiCoder = ethers.AbiCoder.defaultAbiCoder()
  const requestHash = ethers.keccak256(
    abiCoder.encode(
      [
        'address', // borrower
        'address', // assetAddress
        'uint256', // loan amount
        'uint32', // requestNonce
        'uint32', // duration
        'uint32', // requestTime
        'uint32', // chain ID
      ],
      [
        request.borrower,
        args.lendingToken,
        request.amount,
        nonce,
        request.duration,
        currentTimestamp,
        chainId,
      ]
    )
  )

  const responseHash = ethers.keccak256(
    abiCoder.encode(
      [
        'address', // assetAddress
        'uint256', // maxLoanAmount
        'bytes32', // request hash
        'uint32', // responseTime
        'uint16', // interestRate
        'uint16', // collateralRatio
        'uint32', // chain ID
      ],
      [
        args.lendingToken,
        args.loanAmount,
        requestHash,
        currentTimestamp,
        args.interestRate,
        args.collateralRatio,
        chainId,
      ]
    )
  )

  const signer = await getNamedSigner('craSigner')
  const responseHashArray = ethers.getBytes(responseHash)
  const signedMessage = await signer.signMessage(responseHashArray)
  const sig = Signature.from(signedMessage)
  const responses: CRAResponse[] = []
  responses.push({
    signer: await signer.getAddress(),
    assetAddress: args.lendingToken,
    responseTime: currentTimestamp,
    interestRate: args.interestRate,
    collateralRatio: args.collateralRatio,
    maxLoanAmount: args.loanAmount,
    signature: {
      v: sig.v,
      r: sig.r,
      s: sig.s,
    },
  })

  return {
    request,
    responses,
  }
}
