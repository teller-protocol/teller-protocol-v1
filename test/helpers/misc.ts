/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const { ethers } = hre

export const evmSnapshot = async () =>
  await ethers.provider.send('evm_snapshot', [])

export const evmRevert = async (id: string) =>
  await ethers.provider.send('evm_revert', [id])

export const timeLatest = async () => {
  const block = await ethers.provider.getBlock('latest')
  return new BigNumber(block.timestamp)
}

export const advanceBlock = async (timestamp: number) =>
  await ethers.provider.send('evm_mine', [timestamp])

export const increaseTime = async (secondsToIncrease: number) => {
  await ethers.provider.send('evm_increaseTime', [secondsToIncrease])
  await ethers.provider.send('evm_mine', [])
}

export const impersonateAddress = async (
  addressToImpersonate: string
): Promise<Signer> => {
  await (hre as HardhatRuntimeEnvironment).network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [addressToImpersonate],
  })
  return hre.ethers.provider.getSigner(addressToImpersonate)
}

export enum LoanType {
  ZERO_COLLATERAL,
  UNDER_COLLATERALIZED,
  OVER_COLLATERALIZED,
}
