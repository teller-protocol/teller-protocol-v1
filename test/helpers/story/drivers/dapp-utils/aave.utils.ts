import { BigNumber } from '@ethersproject/bignumber'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import moment from 'moment'

import { getDappAddresses, getNetworkName } from '../../../../../config'
import {
  IAaveIncentivesController,
  IAaveLendingPool,
  IAToken,
} from '../../../../../types/typechain'
import { getFunds } from '../../../get-funds'
import { LoanHelpersReturn } from '../../../loans'
import LoanStoryTestDriver from '../loan-story-test-driver'
chai.should()
chai.use(solidity)

async function lendAave(
  hre: HardhatRuntimeEnvironment,
  loan: LoanHelpersReturn
): Promise<void> {
  const { contracts } = hre
  const { details, diamond } = loan
  const aToken = await contracts.get<IAToken>('IAToken', {
    at: await diamond.getAssetAToken(details.lendingToken.address),
  })
  await diamond
    .connect(details.borrower.signer)
    .aaveDeposit(
      details.loan.id,
      details.loan.lendingToken,
      details.loan.borrowedAmount
    )

  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

  const aDaiBalance = await aToken.balanceOf(escrowAddress)

  aDaiBalance.should.eql(details.loan.borrowedAmount)

  const tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
  tokenAddresses.should.include(aToken.address)
}

async function withdrawAave(
  hre: HardhatRuntimeEnvironment,
  loan: LoanHelpersReturn
): Promise<void> {
  const { contracts } = hre
  const { details, diamond } = loan
  const aToken = await contracts.get<IAToken>('IAToken', {
    at: await diamond.getAssetAToken(details.lendingToken.address),
  })
  await diamond
    .connect(details.borrower.signer)
    .aaveWithdrawAll(details.loan.id, details.lendingToken.address)

  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

  const tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
  tokenAddresses.should.not.include(aToken.address)

  const aDaiBalance = await aToken.balanceOf(escrowAddress)
  aDaiBalance.eq(0).should.eql(true, '')
}

async function claimAave(
  hre: HardhatRuntimeEnvironment,
  loan: LoanHelpersReturn
): Promise<void> {
  const { contracts, network } = hre
  const { details, diamond } = loan
  const dappAddresses = getDappAddresses(network)
  const IncentiveController = await contracts.get<IAaveIncentivesController>(
    'IAaveIncentivesController',
    {
      at: dappAddresses.aaveIncentivesControllerAddress,
    }
  )
  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)
  const aaveBefore = await IncentiveController.getUserUnclaimedRewards(
    escrowAddress
  )
  const assets = [details.lendingToken.address]
  // expect(BigNumber.from(aaveBefore).gt(0)).to.equal(true)
  const claim = await diamond
    .connect(details.borrower.signer)
    .aaveClaimAave(details.loan.id, aaveBefore, assets)
  const aaveAfter = await IncentiveController.getUserUnclaimedRewards(
    escrowAddress
  )
  const aToken = await contracts.get<IAToken>('IAToken', {
    at: await diamond.getAssetAToken(details.lendingToken.address),
  })
  expect(await aToken.balanceOf(details.borrower.address)).to.equal(aaveBefore)

  expect(aaveAfter.toString()).to.equal('0')
}

export const aaveLendTest = async (
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { getNamedSigner } = hre
  const borrower = await getNamedSigner('borrower')
  const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
  const { details } = loan
  const borrowedAmount = await details.lendingToken.balanceOf(
    details.borrower.address
  )
  let shouldPass = true
  if (!loan) {
    shouldPass = false
  }
  if (borrowedAmount.gt(details.loan.borrowedAmount)) shouldPass = false
  if (shouldPass) {
    await lendAave(hre, loan)
  } else {
    await lendAave(hre, loan).catch((error) => {
      expect(error).to.exist
    })
  }
}

export const aaveClaimTest = async (
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { getNamedSigner, contracts, network } = hre
  const borrower = await getNamedSigner('borrower')
  const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
  const { details, diamond } = loan
  let shouldPass = true
  const dappAddresses = getDappAddresses(network)
  const IncentiveController = await contracts.get<IAaveIncentivesController>(
    'IAaveIncentivesController',
    {
      at: dappAddresses.aaveIncentivesControllerAddress,
    }
  )
  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

  shouldPass = await hre.evm.withBlockScope(0, async () => {
    // do the mint for the deployer
    const borrowerAddress = await borrower.getAddress()
    await getFunds({
      to: borrowerAddress,
      tokenSym: await details.lendingToken.symbol(),
      amount: BigNumber.from(details.loan.borrowedAmount).mul(2),
      hre,
    })

    const aToken = await contracts.get<IAToken>('IAToken', {
      at: await diamond.getAssetAToken(details.lendingToken.address),
    })

    const dappAddresses = getDappAddresses(hre.network)
    const aaveLendingPool = await contracts.get<IAaveLendingPool>(
      'IAaveLendingPool',
      {
        at: dappAddresses.aaveLendingPool,
      }
    )
    const reserve = await aaveLendingPool.getReserveData(
      details.lendingToken.address
    )
    await details.lendingToken
      .connect(borrower)
      .approve(
        aaveLendingPool.address,
        BigNumber.from(details.loan.borrowedAmount)
      )
    // console.log({borrowedAmount: BigNumber.from(details.loan.borrowedAmount).div(10).toString(), reserve: reserve.liquidityIndex.toString()})
    // await aToken
    //   .connect(aaveLendingPool.signer)
    //   .mint(aaveLendingPool.address, '1', reserve.liquidityIndex)
    await hre.evm.advanceTime(moment.duration(1, 'day'))
    const aaveAccrued = await IncentiveController.getUserUnclaimedRewards(
      escrowAddress
    )
    console.log({ aaveAccrued })
    return aaveAccrued.gt(0)
  })
  //read the state and determine if this should pass
  if (!loan) shouldPass = false
  if (shouldPass) {
    await claimAave(hre, loan)
  } else {
    await claimAave(hre, loan).catch((error) => {
      expect(error).to.exist
    })
  }
}
