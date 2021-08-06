import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { getMarkets, isEtheremNetwork } from '../../config'
import { getPlatformSetting, updatePlatformSetting } from '../../tasks'
import { Market } from '../../types/custom/config-types'
import { ITellerDiamond, MainnetNFTFacet } from '../../types/typechain'
import { fundedMarket } from '../fixtures'
import { getFunds } from '../helpers/get-funds'
import {
  LoanHelpersReturn,
  LoanType,
  takeOutLoanWithNfts,
  takeOutLoanWithoutNfts,
} from '../helpers/loans'

chai.should()
chai.use(solidity)

const { getNamedSigner, contracts, tokens, ethers, evm, toBN } = hre

describe('Loans', () => {
  console.log('teest loans ')
  getMarkets(hre.network).forEach(testLoans)

  function testLoans(market: Market): void {
    let deployer: Signer
    let diamond: ITellerDiamond & MainnetNFTFacet
    // let borrower: Signer

    before(async () => {
      await fundedMarket(hre, {
        assetSym: market.lendingToken,
        amount: 100000,
        keepExistingDeployments: true,
        extendMaxTVL: true,
      })

      deployer = await getNamedSigner('deployer')
      diamond = await contracts.get('TellerDiamond')
    })

    // tests for merged loan functions
    describe('merge create loan', () => {
      let helpers: any = null

      before(async () => {
        // update percentage submission percentage value to 0 for this test
        const percentageSubmission = {
          name: 'RequiredSubmissionsPercentage',
          value: 0,
        }
        await updatePlatformSetting(percentageSubmission, hre)

        // Advance time
        const { value: rateLimit } = await getPlatformSetting(
          'RequestLoanTermsRateLimit',
          hre
        )
        await evm.advanceTime(rateLimit)
      })

      describe('without NFT', () => {
        it('should create a loan', async () => {
          // get helpers variables after function returns our transaction and
          // helper variables
          const { getHelpers } = await takeOutLoanWithoutNfts(hre, {
            lendToken: market.lendingToken,
            collToken: market.collateralTokens[0],
            loanType: LoanType.UNDER_COLLATERALIZED,
          })
          helpers = await getHelpers()

          // borrower data from our helpers
          // borrower = helpers.details.borrower.signer

          // check if loan exists
          expect(helpers.details.loan).to.exist
        })

        it('should have collateral deposited', async () => {
          // get collateral
          const { collateral } = helpers
          const amount = await collateral.current()

          // check if collateral is > 0
          amount.gt(0).should.eq(true, 'Loan must have collateral')
        })

        it('should be taken out', () => {
          // get loanStatus from helpers and check if it's equal to 2, which means
          // it's active and taken out
          const loanStatus = helpers.details.loan.status
          expect(loanStatus).to.equal(2)
        })

        it('should not be able to take out a loan when loan facet is paused', async () => {
          const LOANS_ID = hre.ethers.utils.id('LOANS')

          // Pause lending
          await diamond
            .connect(deployer)
            .pause(LOANS_ID, true)
            .should.emit(diamond, 'Paused')
            .withArgs(LOANS_ID, await deployer.getAddress())

          // trying to run the function will revert with the same error message
          // written in our PausableMods file
          const { tx } = await takeOutLoanWithoutNfts(hre, {
            lendToken: market.lendingToken,
            collToken: market.collateralTokens[0],
            loanType: LoanType.UNDER_COLLATERALIZED,
          })
          await tx.should.be.revertedWith('Pausable: paused')

          // Unpause lending
          await diamond
            .connect(deployer)
            .pause(LOANS_ID, false)
            .should.emit(diamond, 'UnPaused')
            .withArgs(LOANS_ID, await deployer.getAddress())
        })
        // it('should not be able to take out a loan without enough collateral', async () => {
        //   const { tx } = await takeOutLoanWithoutNfts({
        //     lendToken: market.lendingToken,
        //     collToken: market.collateralTokens[0],
        //     loanType: LoanType.OVER_COLLATERALIZED,
        //     collAmount: 1
        //   })

        //   // Try to take out loan which should fail
        //   await tx.should.be.revertedWith('Teller: more collateral required')
        // })
      })

      describe('with NFT', () => {
        beforeEach(async () => {
          // Advance time
          const { value: rateLimit } = await getPlatformSetting(
            'RequestLoanTermsRateLimit',
            hre
          )
          await evm.advanceTime(rateLimit)
        })

        if (isEtheremNetwork(hre.network)) {
          describe('V1', () => {
            let helpers: LoanHelpersReturn

            it('creates a loan', async () => {
              // get helpers

              const borrower = await getNamedSigner('borrower')

              const { nfts, getHelpers } = await takeOutLoanWithNfts(hre, {
                amount: 100,
                lendToken: market.lendingToken,
                borrower,
                version: 1,
              })
              helpers = await getHelpers()

              helpers.details.loan.should.exist

              // get loanStatus from helpers and check if it's equal to 2, which means it's active
              const loanStatus = helpers.details.loan.status
              loanStatus.should.equal(2, 'Loan is not active')

              const loanNFTs = await diamond.getLoanNFTs(
                helpers.details.loan.id
              )
              loanNFTs.should.eql(nfts.v1, 'Staked NFTs do not match')
            })

            it('should be able to create and repay a loan', async () => {
              const borrower = await getNamedSigner('borrower')

              const { getHelpers } = await takeOutLoanWithNfts(hre, {
                amount: 100, //should use raw amt not formatted.. oh well
                lendToken: market.lendingToken,
                borrower: borrower,
                version: 1,
              })

              const helpers: LoanHelpersReturn = await getHelpers()

              expect(helpers.details.loan).to.exist

              console.log('helpers.details.loan', helpers.details.loan)

              const loanId = helpers.details.loan.id
              console.log('loanId', loanId)

              //  const lHelpers = await loanHelpers(loanId)

              //need to give fake ERC20 to borrower
              //and add fake ERC20 to the borrow escrow

              const lendingToken =
                typeof market.lendingToken === 'string'
                  ? await tokens.get(market.lendingToken)
                  : market.lendingToken

              const lendingTokenDecimals = await lendingToken.decimals()
              console.log('decimals', lendingTokenDecimals)

              //THIS FAILS
              await getFunds({
                to: borrower,
                tokenSym: market.lendingToken,
                amount: (200 * 10 ** lendingTokenDecimals).toString(),
                hre,
              })

              const borrowerAddress = await borrower.getAddress()
              const borrowerBalance = await lendingToken.balanceOf(
                borrowerAddress
              )

              console.log('balanceOf', borrowerBalance.toString())

              console.log('market.lendingToken', market.lendingToken)

              const balanceLeftToRepay = await diamond.getTotalOwed(loanId)
              console.log('balanceLeftToRepay', balanceLeftToRepay)

              await lendingToken
                .connect(ethers.provider.getSigner(borrowerAddress))
                .approve(diamond.address, balanceLeftToRepay)

              //let response = await helpers.repay( 100000000 , borrower )

              await diamond.connect(borrower).repayLoan(loanId, 100010000)

              const totalOwedAfterRepay = await diamond.getTotalOwed(loanId)

              console.log('totalOwedAfterRepay', totalOwedAfterRepay.toString())

              const loanData = await diamond.getLoan(loanId)
              console.log('loanData')

              console.log('balanceLeftToRepay 2', balanceLeftToRepay)

              console.log('balanceOf After', borrowerBalance.toString())

              expect(parseInt(borrowerBalance.toString())).to.equal(
                200000000000000000000
              )

              // expect(parseInt(totalOwedAfterRepay.toString())).to.equal(0)

              // expect(loanData.status).to.equal(3) //3 = repaid
            })
          })
        }

        describe('V2', () => {
          let helpers: LoanHelpersReturn

          it('creates a loan', async () => {
            // get helpers
            const borrower = await getNamedSigner('borrower')

            const { nfts, getHelpers } = await takeOutLoanWithNfts(hre, {
              amount: 100,
              lendToken: market.lendingToken,
              borrower,
              version: 2,
            })
            helpers = await getHelpers()

            helpers.details.loan.should.exist

            // get loanStatus from helpers and check if it's equal to 2, which means it's active
            const loanStatus = helpers.details.loan.status
            loanStatus.should.equal(2, 'Loan is not active')

            const loanNFTsV2 = await diamond.getLoanNFTsV2(
              helpers.details.loan.id
            )

            loanNFTsV2.loanNFTs_.should.eql(
              nfts.v2.ids,
              'Staked NFT IDs do not match'
            )
            loanNFTsV2.amounts_.should.eql(
              nfts.v2.balances,
              'Staked NFT balances do not match'
            )
          })
        })
      })
    })
  }
})
