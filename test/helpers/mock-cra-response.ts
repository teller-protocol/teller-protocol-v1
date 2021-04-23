import { BytesLike } from '@ethersproject/bytes'
import { BigNumberish, Signature } from 'ethers'
import hre from 'hardhat'

import { ITellerDiamond } from '../../types/typechain'
import { NULL_ADDRESS } from '../../utils/consts'

const { contracts, getNamedSigner, ethers } = hre

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
  response: CRAResponse
}

export const mockCRAResponse = async (args: CRAArgs): Promise<CRAReturn> => {
  const network = await ethers.provider.getNetwork()
  const chainId = network.chainId.toString()

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const { length: nonce } = await diamond.getBorrowerLoans(args.borrower)

  const requestTime = Date.now().toString()
  const request: CRARequest = {
    borrower: args.borrower,
    recipient: args.recipient ?? NULL_ADDRESS,
    assetAddress: args.lendingToken,
    requestNonce: nonce,
    amount: args.loanAmount,
    duration: args.loanTermLength,
    requestTime,
  }
  const requestHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        'address', // borrower
        'address', // recipient
        'address', // assetAddress
        'uint256', // requestNonce
        'uint256', // loan amount
        'uint256', // duration
        'uint256', // requestTime
        'uint256', // chain ID
      ],
      [
        request.borrower,
        request.recipient,
        args.lendingToken,
        nonce,
        request.amount,
        request.duration,
        requestTime,
        chainId,
      ]
    )
  )

  const responseTime = Date.now().toString()
  const responseHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        'address', // assetAddress
        'uint256', // responseTime
        'uint256', // interestRate
        'uint256', // collateralRatio
        'uint256', // maxLoanAmount
        'uint256', // chain ID
        'bytes32', // request hash
      ],
      [
        args.lendingToken,
        responseTime,
        args.interestRate,
        args.collateralRatio,
        args.loanAmount,
        chainId,
        requestHash,
      ]
    )
  )

  const signer = await getNamedSigner('craSigner')
  const responseHashArray = ethers.utils.arrayify(responseHash)
  const signedMessage = await signer.signMessage(responseHashArray)
  const sig = ethers.utils.splitSignature(signedMessage)
  const response: CRAResponse = {
    signer: await signer.getAddress(),
    assetAddress: args.lendingToken,
    responseTime,
    interestRate: args.interestRate,
    collateralRatio: args.collateralRatio,
    maxLoanAmount: args.loanAmount,
    signature: {
      v: sig.v,
      r: sig.r,
      s: sig.s,
    },
  }

  return {
    request,
    response,
  }
}
