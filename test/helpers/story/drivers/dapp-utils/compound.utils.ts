import { BigNumber } from '@ethersproject/bignumber'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import moment from 'moment'

import { getDappAddresses } from '../../../../../config'
import {
  EscrowClaimTokens,
  ICErc20,
  IComptroller,
} from '../../../../../types/typechain'
import { getFunds } from '../../../get-funds'
import { LoanHelpersReturn } from '../../../loans'
import LoanStoryTestDriver from '../loan-story-test-driver'
chai.should()
chai.use(solidity)

async function lendCompound(
  hre: HardhatRuntimeEnvironment,
  loan: LoanHelpersReturn
): Promise<void> {
  const { contracts } = hre
  const { details, diamond } = loan
  await details.lendingToken
    .connect(details.borrower.signer)
    .approve(
      diamond.address,
      BigNumber.from(details.loan.borrowedAmount).mul(2)
    )
  const cToken = await contracts.get<ICErc20>('ICErc20', {
    at: await diamond.getAssetCToken(details.lendingToken.address),
  })
  await diamond
    .connect(details.borrower.signer)
    .compoundLend(
      details.loan.id,
      details.loan.lendingToken,
      details.loan.borrowedAmount
    )
  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)
  const cDaiBalance = await cToken.balanceOf(escrowAddress)
  cDaiBalance.eq(0).should.eql(false, '')

  const tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
  tokenAddresses.should.include(cToken.address)
}

async function withdrawCompound(
  hre: HardhatRuntimeEnvironment,
  loan: LoanHelpersReturn
): Promise<void> {
  const { contracts } = hre
  const { details, diamond } = loan
  await details.lendingToken
    .connect(details.borrower.signer)
    .approve(
      diamond.address,
      BigNumber.from(details.loan.borrowedAmount).mul(2)
    )
  const cToken = await contracts.get<ICErc20>('ICErc20', {
    at: await diamond.getAssetCToken(details.lendingToken.address),
  })
  await diamond
    .connect(details.borrower.signer)
    .compoundRedeemAll(details.loan.id, details.lendingToken.address)
  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

  const tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
  tokenAddresses.should.not.include(cToken.address)

  const cDaiBalance = await cToken.balanceOf(escrowAddress)
  cDaiBalance.eq(0).should.eql(true, 'cDaiBalance should equal zero')
}

async function claimComp(
  hre: HardhatRuntimeEnvironment,
  loan: LoanHelpersReturn
): Promise<void> {
  const { contracts, network } = hre
  const { details, diamond } = loan
  const dappAddresses = getDappAddresses(network)
  const Comptroller = await contracts.get<IComptroller>('IComptroller', {
    at: dappAddresses.compoundComptrollerAddress,
  })
  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)
  const compBefore = await Comptroller.compAccrued(escrowAddress)
  expect(BigNumber.from(compBefore).gt(0)).to.equal(true)
  await diamond
    .connect(details.borrower.signer)
    .compoundClaimComp(details.loan.id)
  const compafter = await Comptroller.compAccrued(escrowAddress)

  // TODO: test COMP was deposited into the escrow

  expect(compafter.toString()).to.equal('0')
}

export const compoundLendTest = async (
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { getNamedSigner } = hre
  const borrower = await getNamedSigner('borrower')
  const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
  const { details, diamond } = loan
  let shouldPass = true
  if (!loan) {
    shouldPass = false
  }
  if (shouldPass) {
    await getFunds({
      to: await borrower.getAddress(),
      tokenSym: await details.lendingToken.symbol(),
      amount: BigNumber.from(details.loan.borrowedAmount).mul(2),
      hre,
    })
    await lendCompound(hre, loan)
  } else {
    await lendCompound(hre, loan).catch((error) => {
      expect(error).to.exist
    })
  }
}

export const compoundClaimTest = async (
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { getNamedSigner, contracts, network } = hre
  const borrower = await getNamedSigner('borrower')
  const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
  const { details, diamond } = loan
  let shouldPass = true
  const dappAddresses = getDappAddresses(network)
  const Comptroller = await contracts.get<IComptroller>('IComptroller', {
    at: dappAddresses.compoundComptrollerAddress,
  })
  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)
  await hre.evm.advanceTime(moment.duration(10, 'day'))
  shouldPass = await hre.evm.withBlockScope(0, async () => {
    // do the mint for the deployer
    await getFunds({
      to: await borrower.getAddress(),
      tokenSym: await details.lendingToken.symbol(),
      amount: BigNumber.from(details.loan.borrowedAmount).mul(2),
      hre,
    })

    const cToken = await contracts.get<ICErc20>('ICErc20', {
      at: await diamond.getAssetCToken(details.lendingToken.address),
    })
    await cToken.mint('1')

    const compAccrued = await Comptroller.compAccrued(escrowAddress)
    console.log({ compAccrued })
    return compAccrued.gt(0)
  })
  console.log({ shouldPass })
  //read the state and determine if this should pass
  if (!loan) shouldPass = false
  if (shouldPass) {
    await claimComp(hre, loan)
  } else {
    await claimComp(hre, loan).catch((error) => {
      expect(error).to.exist
    })
  }
}
