import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import {
  Escrow,
  PoolTogether,
  ERC20Detailed,
  IPoolTogether,
} from '../../types/typechain'
import { BigNumberish, Signer } from 'ethers'
import { getTokens } from '../../config/tokens'
import { Network } from '../../types/custom/config-types'
import { createMarketWithLoan, LoanType } from '../fixtures'
import { PoolTogetherInterface } from '../../types/typechain/PoolTogether'

chai.should()
chai.use(solidity)

interface TestSetupReturn {
  escrow: Escrow
  user: Signer
  poolTogether: PoolTogether
  dai: ERC20Detailed
  pCDai: ERC20Detailed
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

    const loan = await market.loans.loans(market.createdLoanId)

    const escrow = await contracts.get<Escrow>('Escrow', { at: loan.escrow })

    const dai = await contracts.get<ERC20Detailed>('ERC20Detailed', {
      at: getTokens(<Network>hre.network.name).DAI,
    })

    const poolTogether = await contracts.get<PoolTogether>('PoolTogether')

    const prizePool = await hre.ethers.getContractAt(
      'PrizePoolInterface',
      getTokens(<Network>hre.network.name).PCDAI
    )
    const ticketAddress = (await prizePool.tokens())[1]

    const pCDai = await contracts.get<ERC20Detailed>('ERC20Detailed', {
      at: ticketAddress,
    })
    console.log({ PC: pCDai.address })

    return {
      escrow,
      user,
      poolTogether,
      dai,
      pCDai,
    }
  }
)

describe.skip('PoolTogether', async () => {
  let escrow: Escrow
  let user: Signer
  let rando: Signer
  let poolTogether: PoolTogether
  let dai: ERC20Detailed
  let pCDai: ERC20Detailed
  let amount: BigNumberish
  let tokens: string[]

  beforeEach(async () => {
    // Set up
    ;({ escrow, user, poolTogether, dai, pCDai } = await setUpTest())
    amount = toBN('500', '18')
    rando = await getNamedSigner('liquidator')
  })

  describe('deposit, withdraw', () => {
    it('Should be able to deposit and then withdraw successfully from Pool Together', async () => {
      await escrow.connect(user).callDapp({
        location: poolTogether.address,
        data: poolTogether.interface.encodeFunctionData('depositTicket', [
          dai.address,
          amount,
        ]),
      })

      let daiBalance = (await dai.balanceOf(escrow.address)).toString()
      let pCDaiBalance = (await pCDai.balanceOf(escrow.address)).toString()

      // daiBalance.should.lt(amount)
      pCDaiBalance.should.not.equals('0')

      tokens = await escrow.connect(user).getTokens()
      tokens.should.include(pCDai.address)

      await fastForward(10000)

      await escrow.connect(user).callDapp({
        location: poolTogether.address,
        data: poolTogether.interface.encodeFunctionData('withdrawAll', [
          dai.address,
        ]),
      })

      tokens = await escrow.connect(user).getTokens()
      tokens.should.not.include(pCDai.address)

      // pCDaiBalance = (await pCDai.balanceOf(escrow.address)).toString()
      // pCDaiBalance.should.equals('0')
    })

    it('Should not be able to deposit into Pool Together as not the loan borrower', async () => {
      await escrow
        .connect(rando)
        .callDapp({
          location: poolTogether.address,
          data: poolTogether.interface.encodeFunctionData('depositTicket', [
            dai.address,
            amount,
          ]),
        })
        .should.rejectedWith('NOT_BORROWER')
    })
  })
})
