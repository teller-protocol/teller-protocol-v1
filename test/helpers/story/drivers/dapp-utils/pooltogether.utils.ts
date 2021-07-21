import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { IERC20 } from '../../../../../types/typechain'
import { LoanHelpersReturn } from '../../../loans'
import LoanStoryTestDriver from '../loan-story-test-driver'
chai.should()
chai.use(solidity)

async function lendPoolTogether(
    hre: HardhatRuntimeEnvironment,
    loan: LoanHelpersReturn
  ): Promise<void> {
    const { contracts } = hre
    const { details, diamond } = loan
    const poolTicket = await contracts.get<IERC20>('IERC20', {
      at: await diamond.getAssetPPoolTicket(details.lendingToken.address),
    })
    await diamond
      .connect(details.borrower.signer)
      .poolTogetherDepositTicket(
        details.loan.id,
        details.loan.lendingToken,
        details.loan.borrowedAmount
      )

    const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

    const daiBalance = await details.lendingToken.balanceOf(escrowAddress)
    daiBalance.eq(details.loan.borrowedAmount).should.eql(false, '')

    const tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
    tokenAddresses.should.include(poolTicket.address)
  }

async function withdrawPoolTogether(
    hre: HardhatRuntimeEnvironment,
    loan: LoanHelpersReturn
  ): Promise<void> {
    const { contracts } = hre
    const { details, diamond } = loan
    const poolTicket = await contracts.get<IERC20>('IERC20', {
      at: await diamond.getAssetPPoolTicket(details.lendingToken.address),
    })
    await diamond
      .connect(details.borrower.signer)
      .poolTogetherWithdrawAll(details.loan.id, details.lendingToken.address)

    const tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
    tokenAddresses.should.not.include(poolTicket.address)
    const escrowAddress = await diamond.getLoanEscrow(details.loan.id)
    const daiBalance = await details.lendingToken.balanceOf(escrowAddress)
    daiBalance.should.be.gt('0')
  }

export const poolTogetherLendTest = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  const { getNamedSigner } = hre
  const borrower = await getNamedSigner('borrower')
  const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
  const { details, diamond } = loan
  let shouldPass = true
  const borrowedAmount = (
    await details.lendingToken.balanceOf(
      await diamond.getLoanEscrow(details.loan.id)
    )
  ).toString()
  if (borrowedAmount != details.loan.borrowedAmount.toString())
    shouldPass = false
  if (shouldPass) {
    await lendPoolTogether(hre, loan)
  } else {
    await lendPoolTogether(hre, loan).catch(
      (error) => {
        expect(error).to.exist
      }
    )
  }
}

