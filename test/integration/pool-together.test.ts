import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import {
  Escrow,
  PoolTogetherDapp,
  ERC20Detailed,
  PrizePoolInterface,
} from '../../types/typechain'
import { BigNumberish, Signer, ContractReceipt } from 'ethers'
import { getTokens } from '../../config/tokens'
import { Network } from '../../types/custom/config-types'
import { createMarketWithLoan, LoanType } from '../fixtures'

chai.should()
chai.use(solidity)

interface TestSetupReturn {
  escrow: Escrow
  user: Signer
  poolTogether: PoolTogetherDapp
  dai: ERC20Detailed
  pCDai: ERC20Detailed
  prizePool: PrizePoolInterface
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
    const dai = await contracts.get<ERC20Detailed>('ERC20Detailed', {
      at: getTokens(<Network>hre.network.name).DAI,
    })
    const poolTogether = await contracts.get<PoolTogetherDapp>(
      'PoolTogetherDapp'
    )

    const prizePool = (await hre.ethers.getContractAt(
      'PrizePoolInterface',
      getTokens(<Network>hre.network.name).PCDAI
    )) as PrizePoolInterface

    const ticketAddress = (await prizePool.tokens())[1]

    const pCDai = await contracts.get<ERC20Detailed>('ERC20Detailed', {
      at: ticketAddress,
    })

    return {
      escrow,
      user,
      poolTogether,
      dai,
      pCDai,
      prizePool,
    }
  }
)

describe('PoolTogetherDapp', async () => {
  let escrow: Escrow
  let user: Signer
  let rando: Signer
  let poolTogether: PoolTogetherDapp
  let dai: ERC20Detailed
  let pCDai: ERC20Detailed
  let amount: BigNumberish
  let tokens: string[]
  let prizePool: PrizePoolInterface

  beforeEach(async () => {
    // Set up
    ;({ escrow, user, poolTogether, dai, pCDai, prizePool } = await setUpTest())
    amount = toBN('500', '18')
    rando = await getNamedSigner('liquidator')
  })

  describe('deposit, withdraw', () => {
    it('Should be able to deposit and then withdraw successfully from Pool Together', async () => {
      const daiBalanceBefore = await dai.balanceOf(escrow.address)
      const pCDaiBalanceBefore = await pCDai.balanceOf(escrow.address)
      await escrow
        .connect(user)
        .callDapp({
          location: poolTogether.address,
          data: poolTogether.interface.encodeFunctionData('depositTicket', [
            dai.address,
            amount,
          ]),
        })
        .should.emit(
          { ...poolTogether, address: escrow.address },
          'PoolTogetherDeposited'
        )
        .withArgs(
          dai.address, // tokenAddress
          pCDai.address, // ticketAddress
          amount, // depositAmount
          daiBalanceBefore.sub(amount), // tokenBalance
          pCDaiBalanceBefore.add(amount) // creditBalanceAfter
        )

      let daiBalanceAfter = (await dai.balanceOf(escrow.address)).toString()
      let pCDaiBalanceAfter = (await pCDai.balanceOf(escrow.address)).toString()

      daiBalanceAfter.should.eq(daiBalanceBefore.sub(amount))
      pCDaiBalanceAfter.should.not.equals('0')

      tokens = await escrow.connect(user).getTokens()
      tokens.should.include(pCDai.address)

      await fastForward(10000)

      await escrow.connect(user).callDapp({
        location: poolTogether.address,
        data: poolTogether.interface.encodeFunctionData('withdrawAll', [
          dai.address,
        ]),
      })

      const daiBalanceNow = await dai.balanceOf(escrow.address)
      const pCDaiBalanceNow = await pCDai.balanceOf(escrow.address)

      daiBalanceNow.lt(daiBalanceBefore).should.be.true
      daiBalanceNow.gt(daiBalanceBefore.mul(92).div(100)).should.be.true
      pCDaiBalanceNow.toString().should.eq('0')

      tokens = await escrow.connect(user).getTokens()
      tokens.should.not.include(pCDai.address)
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
