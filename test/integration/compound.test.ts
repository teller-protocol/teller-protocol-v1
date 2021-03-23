import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'

import {
  Escrow,
  Compound,
  ERC20Detailed,
  CErc20Interface,
} from '../../types/typechain'
import { BigNumberish, Signer } from 'ethers'
import { getTokens } from '../../config/tokens'
import { Network } from '../../types/custom/config-types'
import { createMarketWithLoan, LoanType } from '../fixtures'

chai.should()
chai.use(solidity)

interface TestSetupReturn {
  escrow: Escrow
  user: Signer
  compound: Compound
  dai: ERC20Detailed
  cDai: CErc20Interface
}

const { deployments, contracts, getNamedSigner, fastForward, toBN } = hre

const setUpTest = deployments.createFixture(
  async (): Promise<TestSetupReturn> => {
    const user = await getNamedSigner('borrower')
    const market = await createMarketWithLoan({
      market: {
        market: { lendTokenSym: 'DAI', collTokenSym: 'ETH' },
      },
      borrower: user,
      loanType: LoanType.UNDER_COLLATERALIZED,
    })

    const loan = await market.loanManager.loans(market.createdLoanId)

    const escrow = await contracts.get<Escrow>('Escrow', { at: loan.escrow })
    const ting = await escrow.getTokens()

    const dai = await contracts.get<ERC20Detailed>('ERC20Detailed', {
      at: getTokens(<Network>hre.network.name).DAI,
    })
    const cDai = await contracts.get<CErc20Interface>('CErc20Interface', {
      at: getTokens(<Network>hre.network.name).CDAI,
    })
    const compound = await contracts.get<Compound>('Compound')

    return {
      escrow,
      user,
      compound,
      dai,
      cDai,
    }
  }
)

describe('Compound', async () => {
  let escrow: Escrow
  let user: Signer
  let rando: Signer
  let compound: Compound
  let dai: ERC20Detailed
  let cDai: CErc20Interface
  let amount: BigNumberish
  let tokens: string[]

  beforeEach(async () => {
    // Set up
    ;({ escrow, user, compound, dai, cDai } = await setUpTest())
    amount = toBN(500, 18)
    rando = await getNamedSigner('liquidator')
  })

  describe('lend, redeemAll', () => {
    it('Should be able to lend and then redeem successfully from Compound', async () => {
      await escrow.connect(user).callDapp({
        location: compound.address,
        data: compound.interface.encodeFunctionData('lend', [
          dai.address,
          amount,
        ]),
      })

      let daiBalance = (await dai.balanceOf(escrow.address)).toString()
      let cDaiBalance = (await cDai.balanceOf(escrow.address)).toString()

      cDaiBalance.should.not.equals('0')

      tokens = await escrow.connect(user).getTokens()
      tokens.should.include(cDai.address)

      await fastForward(10000)

      await escrow.connect(user).callDapp({
        location: compound.address,
        data: compound.interface.encodeFunctionData('redeemAll', [dai.address]),
      })

      tokens = await escrow.connect(user).getTokens()
      tokens.should.not.include(cDai.address)

      cDaiBalance = (await cDai.balanceOf(escrow.address)).toString()
      cDaiBalance.should.equals('0')
    })

    it('Should not be able to lend into Compound as not the loan borrower', async () => {
      await escrow
        .connect(rando)
        .callDapp({
          location: compound.address,
          data: compound.interface.encodeFunctionData('lend', [
            dai.address,
            amount,
          ]),
        })
        .should.rejectedWith('NOT_BORROWER')
    })
  })
})
