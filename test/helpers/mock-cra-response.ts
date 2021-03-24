import hre from 'hardhat'
import { getMarket } from '../../tasks'
import { BigNumberish, Signature } from 'ethers'
import { BytesLike } from '@ethersproject/bytes'
import { NULL_ADDRESS } from '../../utils/consts'

const { getNamedSigner, ethers } = hre

interface CRAArgs {
  lendingToken: string
  collateralToken: string
  loanAmount: string
  loanTermLength: string
  collateralRatio: string
  interestRate: string
  borrower: string
  requestNonce?: string
  recipient?: string
}

export interface CRARequest {
  borrower: string
  recipient: string
  consensusAddress: string
  requestNonce: BigNumberish
  amount: BigNumberish
  duration: BigNumberish
  requestTime: BigNumberish
}

export interface CRAResponse {
  signer: string
  consensusAddress: string
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

  const nonce = args.requestNonce ?? '0'

  const { loanManager } = await getMarket(
    {
      lendTokenSym: args.lendingToken,
      collTokenSym: args.collateralToken,
    },
    hre
  )

  const requestTime = Date.now().toString()
  const request: CRARequest = {
    borrower: args.borrower,
    recipient: args.recipient ?? NULL_ADDRESS,
    consensusAddress: loanManager.address,
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
        'address', // consensusAddress
        'uint256', // requestNonce
        'uint256', // loan amount
        'uint256', // duration
        'uint256', // requestTime
        'uint256', // chain ID
      ],
      [
        request.borrower,
        request.recipient,
        loanManager.address,
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
        'address', // consensusAddress
        'uint256', // responseTime
        'uint256', // interestRate
        'uint256', // collateralRatio
        'uint256', // maxLoanAmount
        'uint256', // chain ID
        'bytes32', // request hash
      ],
      [
        loanManager.address,
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
    consensusAddress: loanManager.address,
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
