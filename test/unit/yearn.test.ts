import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import { Escrow, YVault } from '../../types/typechain'
import { BigNumberish, Signer } from 'ethers'
import { getTokens } from '../../config/tokens'
import { Network } from '../../types/custom/config-types'
import { createMarketWithLoan, LoanType } from '../fixtures'

chai.should()
chai.use(solidity)

interface TestSetupReturn {
  escrow: Escrow
  user: Signer
  yVault: YVault
  daiAddress: string
}

const { deployments, contracts, getNamedSigner, fastForward } = hre

const setUpTest = deployments.createFixture(
  async (): Promise<TestSetupReturn> => {
    const user = await getNamedSigner('borrower')
    const market = await createMarketWithLoan({
      market: {
        market: { lendTokenSym: 'DAI', collTokenSym: 'ETH' },
      },
      borrower: user,
      loanType: LoanType.OVER_COLLATERALIZED,
    })

    const loan = await market.loans.loans(market.createdLoanId)
    const escrow = await contracts.get<Escrow>('Escrow', { at: loan.escrow })

    const daiAddress = getTokens(<Network>hre.network.name).DAI
    const yVault = await contracts.get<YVault>('YVault')

    return {
      escrow,
      user,
      yVault,
      daiAddress,
    }
  }
)

describe.only('YVault', async () => {
  let escrow: Escrow
  let user: Signer
  let rando: Signer
  let yVault: YVault
  let daiAddress: string
  let amount: BigNumberish

  beforeEach(async () => {
    // Set up
    ;({ escrow, user, yVault, daiAddress } = await setUpTest())
    amount = '500'
    rando = await getNamedSigner('liquidator')
  })

  describe('deposit and withdraw from yVault', () => {
    it('Should be able to deposit and then withdraw successfully from a yearn vault', async () => {
      await escrow.connect(user).callDapp({
        location: yVault.address,
        data: yVault.interface.encodeFunctionData('deposit', [
          daiAddress,
          amount,
        ]),
      })

      await fastForward(10000)

      await escrow.connect(user).callDapp({
        location: yVault.address,
        data: yVault.interface.encodeFunctionData('withdrawAll', [daiAddress]),
      })
    })

    it('Should not be able to deposit from a yearn vault', async () => {
      await escrow.connect(rando).callDapp({
        location: yVault.address,
        data: yVault.interface.encodeFunctionData('deposit', [
          daiAddress,
          amount,
        ]),
      })
    })
  })
})
