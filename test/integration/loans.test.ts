import chai, { expect } from 'chai'
import { Console } from 'console'
import { solidity } from 'ethereum-waffle'
import { BigNumber, Signer } from 'ethers'
import hre from 'hardhat'

import { getMarkets, isEtheremNetwork } from '../../config'
import { getPlatformSetting, updatePlatformSetting } from '../../tasks'
import { Market } from '../../types/custom/config-types'
import { ITellerDiamond, MainnetNFTFacet } from '../../types/typechain'
import { LoanStatus } from '../../utils/consts'
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

describe.skip('Loans', () => {
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
          await hre.deployments.fixture('protocol', {
            keepExistingDeployments: true,
          })

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
                amount: 100,
                lendToken: market.lendingToken,
                borrower: borrower,
                version: 1,
              })

              const helpers: LoanHelpersReturn = await getHelpers()

              expect(helpers.details.loan).to.exist

              const loanId = helpers.details.loan.id

              const lendingToken = helpers.details.lendingToken

              const lendingTokenDecimals = await lendingToken.decimals()

              //add lending token funds to the borrower
              await getFunds({
                to: borrower,
                tokenSym: market.lendingToken,
                amount: hre.toBN(200, lendingTokenDecimals),
                hre,
              })

              const borrowerAddress = await borrower.getAddress()
              const borrowerBalance = await lendingToken.balanceOf(
                borrowerAddress
              )

              const balanceLeftToRepay = await diamond.getTotalOwed(loanId)

              await lendingToken
                .connect(borrower)
                .approve(diamond.address, balanceLeftToRepay)

              await diamond
                .connect(borrower)
                .repayLoan(loanId, balanceLeftToRepay)

              const totalOwedAfterRepay = await diamond.getTotalOwed(loanId)

              const loanData = await diamond.getLoan(loanId)

              totalOwedAfterRepay.should.eql(0)

              expect(loanData.status).to.equal(LoanStatus.Closed)
            })

            it('should be able to create and repay a loan to restake NFTs', async () => {
              const borrower = await getNamedSigner('borrower')

              const { getHelpers } = await takeOutLoanWithNfts(hre, {
                amount: 100,
                lendToken: market.lendingToken,
                borrower: borrower,
                version: 1,
              })

              const helpers: LoanHelpersReturn = await getHelpers()

              expect(helpers.details.loan).to.exist

              const loanId = helpers.details.loan.id

              const lendingToken = helpers.details.lendingToken

              const lendingTokenDecimals = await lendingToken.decimals()

              await getFunds({
                to: borrower,
                tokenSym: market.lendingToken,
                amount: hre.toBN(200, lendingTokenDecimals),
                hre,
              })

              const borrowerAddress = await borrower.getAddress()
              const borrowerBalance = await lendingToken.balanceOf(
                borrowerAddress
              )

              const balanceLeftToRepay = await diamond.getTotalOwed(loanId)

              await lendingToken
                .connect(borrower)
                .approve(diamond.address, balanceLeftToRepay)

              const stakedNFTsBeforeRepay = await diamond.getStakedNFTs(
                borrowerAddress
              )

              const loanNFTsBeforeRepay = await diamond.getLoanNFTs(loanId)

              expect(stakedNFTsBeforeRepay.length).to.equal(0)

              await diamond
                .connect(borrower)
                .repayLoan(loanId, hre.toBN(100, lendingTokenDecimals))

              const totalOwedAfterRepay = await diamond.getTotalOwed(loanId)

              const loanData = await diamond.getLoan(loanId)

              const stakedNFTsAfterRepay = await diamond.getStakedNFTs(
                borrowerAddress
              )

              expect(stakedNFTsAfterRepay.length).to.equal(
                loanNFTsBeforeRepay.length
              )

              totalOwedAfterRepay.should.eql(0)

              expect(loanData.status).to.equal(LoanStatus.Closed)
            })
          })

          describe('V3', () => {
            let helpers: LoanHelpersReturn
            it('creates a loan from v1 and v2 Ids', async () => {
              const borrower = await getNamedSigner('borrower')
              const { nfts, getHelpers } = await takeOutLoanWithNfts(hre, {
                amount: 100,
                lendToken: market.lendingToken,
                borrower,
                version: 3,
              })
              helpers = await getHelpers()
              helpers.details.loan.should.exist

              // get loanStatus from helpers and check if it's equal to 2, which means it's active
              const loanStatus = helpers.details.loan.status
              loanStatus.should.equal(2, 'Loan is not active')

              // get loan NFTs from our loan
              const loanNFTs = await diamond.getLoanNFTs(
                helpers.details.loan.id
              )
              const loanNFTsV2 = await diamond.getLoanNFTsV2(
                helpers.details.loan.id
              )
              // check if loan NFTs are equal to each other
              loanNFTs.should.eql(nfts.v1, 'Staked NFTs do not match')
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

            const loanStatus = helpers.details.loan.status
            loanStatus.should.equal(LoanStatus.Active, 'Loan is not active')

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

          it('should be able to create and repay a loan', async () => {
            const borrower = await getNamedSigner('borrower')

            const { getHelpers } = await takeOutLoanWithNfts(hre, {
              amount: 100,
              lendToken: market.lendingToken,
              borrower: borrower,
              version: 2,
            })

            const helpers: LoanHelpersReturn = await getHelpers()

            expect(helpers.details.loan).to.exist

            const loanId = helpers.details.loan.id

            const lendingToken = helpers.details.lendingToken

            const lendingTokenDecimals = await lendingToken.decimals()

            await getFunds({
              to: borrower,
              tokenSym: market.lendingToken,
              amount: hre.toBN(200, lendingTokenDecimals),
              hre,
            })

            const borrowerAddress = await borrower.getAddress()
            const borrowerBalance = await lendingToken.balanceOf(
              borrowerAddress
            )

            const balanceLeftToRepay = await diamond.getTotalOwed(loanId)

            await lendingToken
              .connect(borrower)
              .approve(diamond.address, balanceLeftToRepay)

            const stakedNFTsBeforeRepay = await diamond.getStakedNFTsV2(
              borrowerAddress
            )

            const loanNFTs = await diamond.getLoanNFTsV2(loanId)

            expect(stakedNFTsBeforeRepay.staked_.length).to.equal(0)

            await diamond
              .connect(borrower)
              .repayLoan(loanId, hre.toBN(100, lendingTokenDecimals))

            const totalOwedAfterRepay = await diamond.getTotalOwed(loanId)

            const loanData = await diamond.getLoan(loanId)

            const stakedNFTsAfterRepay = await diamond.getStakedNFTsV2(
              borrowerAddress
            )

            expect(stakedNFTsAfterRepay.staked_.length).to.equal(
              loanNFTs.loanNFTs_.length + stakedNFTsBeforeRepay.staked_.length
            )

            const stakedNFTAmounts = stakedNFTsAfterRepay.staked_.reduce<{
              [nftID: string]: BigNumber
            }>((obj, nftID, i) => {
              obj[nftID.toString()] = stakedNFTsAfterRepay.amounts_[i]
              return obj
            }, {})

            for (let i = 0; i < loanNFTs.loanNFTs_.length; i++) {
              const nftID = loanNFTs.loanNFTs_[i]

              const stakedNFTBeforeRepayAmount =
                stakedNFTsBeforeRepay.amounts_[i] ?? 0

              const expectedAmount = loanNFTs.amounts_[i].add(
                stakedNFTBeforeRepayAmount
              )

              stakedNFTAmounts[nftID.toString()].should.eql(expectedAmount)
            }

            totalOwedAfterRepay.should.eql(0)

            expect(loanData.status).to.equal(LoanStatus.Closed)
          })
        })
      })
    })
  }
})
