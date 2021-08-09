import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { IAToken } from '../../../../../types/typechain'
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
