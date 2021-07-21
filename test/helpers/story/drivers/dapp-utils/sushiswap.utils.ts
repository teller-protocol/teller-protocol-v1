import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { LoanHelpersReturn } from "../../../loans"
import LoanStoryTestDriver from '../loan-story-test-driver'
chai.should()
chai.use(solidity)

async function swapSushiSwap(
    hre: HardhatRuntimeEnvironment,
    loan: LoanHelpersReturn
  ): Promise<void> {
    const { tokens } = hre
    const { details, diamond } = loan
    const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

    const lendingBalBefore = await details.lendingToken.balanceOf(escrowAddress)
    lendingBalBefore
      .gt(0)
      .should.eql(true, 'Loan escrow should have a lending token balance')
    const link = await tokens.get('LINK')
    const swapBalBefore = await link.balanceOf(escrowAddress)
    swapBalBefore
      .eq(0)
      .should.eql(
        true,
        'Loan escrow should not have a token balance before swap'
      )

    await diamond
      .connect(details.borrower.signer)
      .sushiswapSwap(
        details.loan.id,
        [details.lendingToken.address, link.address],
        lendingBalBefore,
        '0'
      )
      .should.emit(diamond, 'SushiswapSwapped')

    const swapBalAfter = await link.balanceOf(escrowAddress)
    swapBalAfter
      .gt(0)
      .should.eql(true, 'Swap token balance not positive after swap')

    const lendingBalAfter = await details.lendingToken.balanceOf(escrowAddress)
    lendingBalAfter
      .eq(0)
      .should.eql(
        true,
        'Loan escrow has lending token balance after swapping full amount'
      )
}
  
export const sushiswapSwapTest = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  const { getNamedSigner } = hre
  const borrower = await getNamedSigner('borrower')
  const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
  let shouldPass = true
  //read the state and determine if this should pass
  if (!loan) shouldPass = false
  const { details, diamond } = loan
  const escrowAddress = await diamond.getLoanEscrow(details.loan.id)
  const lendingBalBefore = await details.lendingToken.balanceOf(
    escrowAddress
  )

  if (lendingBalBefore.lte(0)) shouldPass = false
  if (shouldPass) {
    await swapSushiSwap(hre, loan)
  } else {
    await swapSushiSwap(hre, loan).catch(
      (error) => {
        expect(error).to.exist
      }
    )
  }
}