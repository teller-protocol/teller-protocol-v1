import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { LoanHelpersReturn } from '../../../loans'
import LoanStoryTestDriver from '../loan-story-test-driver'
chai.should()
chai.use(solidity)

async function lendYearn(
  hre: HardhatRuntimeEnvironment,
  loan: LoanHelpersReturn
): Promise<void> {
  const { details, diamond } = loan
  await diamond
    .connect(details.borrower.signer)
    .yearnDeposit(
      details.loan.id,
      details.loan.lendingToken,
      details.loan.borrowedAmount
    )

  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)
  const daiBalance = await details.lendingToken.balanceOf(escrowAddress)
  daiBalance.should.eq(details.loan.borrowedAmount)

  const tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
  // tokenAddresses.should.include(aToken.address)
}

async function withdrawYearn(
  hre: HardhatRuntimeEnvironment,
  loan: LoanHelpersReturn
): Promise<void> {
  const { contracts } = hre
  const { details, diamond } = loan
  await diamond
    .connect(details.borrower.signer)
    .yearnWithdrawAll(details.loan.id, details.lendingToken.address)

  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

  const tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
  // tokenAddresses.should.not.include(aToken.address)

  const daiBalance = await details.lendingToken.balanceOf(escrowAddress)
  daiBalance.should.eql(0)
}

export const yearnLendTest = async (
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { getNamedSigner } = hre
  const borrower = await getNamedSigner('borrower')
  const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
  let shouldPass = true
  if (!loan) {
    shouldPass = false
  }
  if (shouldPass) {
    await lendYearn(hre, loan)
  } else {
    await lendYearn(hre, loan).catch((error) => {
      expect(error).to.exist
    })
  }
}
