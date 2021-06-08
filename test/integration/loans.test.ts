import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { getMarkets } from '../../config'
import { getPlatformSetting, updatePlatformSetting } from '../../tasks'
import { Market } from '../../types/custom/config-types'
import { ITellerDiamond } from '../../types/typechain'
import { fundedMarket } from '../fixtures'
import {
  LoanType,
  takeOutLoanWithNfts,
  takeOutLoanWithoutNfts,
  outputCraValues,
} from '../helpers/loans'

chai.should()
chai.use(solidity)

const { getNamedSigner, evm } = hre

describe.skip('Loans', () => {
  getMarkets(hre.network).forEach(testLoans)

  function testLoans(market: Market): void {
    let deployer: Signer
    let diamond: ITellerDiamond
    // let borrower: Signer

    before(async () => {
      // eslint-disable-next-line
      ({ diamond } = await fundedMarket(hre, {
        assetSym: market.lendingToken,
        amount: 100000,
      }))

      deployer = await getNamedSigner('deployer')
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
        let helpers: any
        before(async () => {
          // Advance time
          const { value: rateLimit } = await getPlatformSetting(
            'RequestLoanTermsRateLimit',
            hre
          )
          await evm.advanceTime(rateLimit)
        })
        helpers = await getHelpers()

        await evm.advanceTime(rateLimit)
      })
      it('creates a loan', async () => {
        console.log(helpers.details.loan)
        expect(helpers.details.loan).to.exist
      })
      it('should be an active loan', () => {
        // get loanStatus from helpers and check if it's equal to 2, which means it's active
        const loanStatus = helpers.details.loan.status
        expect(loanStatus).to.equal(2)
      })
    })
    describe.only('create loan w/ new zkCRA', async () => {
      console.log('zkCRA tests')
      it('checks if computation and proof are outputted', async () => {
        await outputCraValues()
      })
    })
    // delete the rest? 🤔
    describe('create', () => {})
    describe('take out', () => {
      it('should NOT be able to take out loan when loans facet is paused', async () => {
        const LOANS_ID = hre.ethers.utils.id('LOANS')

        // Pause lending
        await diamond
          .connect(deployer)
          .pause(LOANS_ID, true)
          .should.emit(diamond, 'Paused')
          .withArgs(LOANS_ID, await deployer.getAddress())

        // Try deposit into lending pool
        const { tx } = await createLoan({
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

      it('should not be able to take out a loan without collateral', async () => {
        // Create loan with terms without depositing collateral
        const { getHelpers } = await createLoan({
          lendToken: market.lendingToken,
          collToken: market.collateralTokens[0],
          loanType: LoanType.OVER_COLLATERALIZED,
        })
        const helpers = await getHelpers()

        // Try to take out loan which should fail
        await helpers
          .takeOut()
          .should.be.revertedWith('Teller: more collateral required')

        await helpers.details
          .refresh()
          .then(({ loan }) => loan.status.should.eq(LoanStatus.TermsSet))
      })

      it('should be able to take out a loan with collateral', async () => {
        const { collateral } = await takeOut({
          lendToken: market.lendingToken,
          collToken: market.collateralTokens[0],
          loanType: LoanType.OVER_COLLATERALIZED,
        })

        // Verify collateral has been added
        const currentColl = await collateral.current()
        currentColl.gt(0).should.eq(true, 'Loan must have collateral')
      })

      // it('should be able to take out a loan with an NFT', async () => {
      //   // Setup for NFT user
      //   const { merkleTrees } = getNFT(hre.network)
      //   const merkleIndex = 0
      //   const borrower = ethers.utils.getAddress(
      //     merkleTrees[merkleIndex].balances[0].address
      //   )
      //   const imp = await evm.impersonate(borrower)
      //   await diamond.connect(deployer).addAuthorizedAddress(borrower)

      //   // Claim user's NFTs
      //   await claimNFT({ account: borrower, merkleIndex }, hre)

      //   // Create and set NFT loan merkle
      //   const nftLoanTree = await getLoanMerkleTree(hre)
      //   await setLoanMerkle({ loanTree: nftLoanTree }, hre)
      //   const proofs = []

      //   // Get the sum of loan amount to take out
      //   const nft = await contracts.get<TellerNFT>('TellerNFT')
      //   const ownedNFTs = await nft
      //     .getOwnedTokens(borrower)
      //     .then((arr) => (arr.length > 2 ? arr.slice(0, 2) : arr))
      //   const lendingToken = await tokens.get(market.lendingToken)
      //   let amount = toBN(0)
      //   for (const nftID of ownedNFTs) {
      //     const { tier_ } = await nft.getTokenTier(nftID)
      //     const baseLoanSize = toBN(
      //       tier_.baseLoanSize,
      //       await lendingToken.decimals()
      //     )
      //     amount = amount.add(baseLoanSize)

      //     // Get the proofs for the NFT loan size
      //     proofs.push({
      //       id: nftID,
      //       baseLoanSize,
      //       proof: nftLoanTree.getProof(nftID, baseLoanSize),
      //     })
      //   }

      //   await nft
      //     .connect(imp.signer)
      //     .setApprovalForAll(diamond.address, true)
      //     .then(({ wait }) => wait())
      //   await diamond
      //     .connect(imp.signer)
      //     .stakeNFTs(ownedNFTs)
      //     .then(({ wait }) => wait())

      //   // Create loan
      //   const { getHelpers } = await createLoan({
      //     lendToken: market.lendingToken,
      //     collToken: market.collateralTokens[0],
      //     loanType: LoanType.OVER_COLLATERALIZED,
      //     amountBN: amount,
      //     borrower,
      //   })
      //   const { details } = await getHelpers()

      //   // Take out loan
      //   await diamond
      //     .connect(imp.signer)
      //     .takeOutLoanWithNFTs(details.loan.id, amount, proofs)
      //     .should.emit(diamond, 'LoanTakenOut')
      //     .withArgs(details.loan.id, borrower, amount, true)

      //   await details
      //     .refresh()
      //     .then(({ loan }) => loan.status.should.eq(LoanStatus.Active))

      //   await imp.stop()
      // })

      it('should not be able to take out with invalid debt ratio', async () => {
        // Take snapshot to revert the asset setting
        const revert = await evm.snapshot()

        // Create loan
        const { getHelpers } = await createLoan({
          lendToken: market.lendingToken,
          collToken: market.collateralTokens[0],
          loanType: LoanType.OVER_COLLATERALIZED,
        })
        const { details, takeOut } = await getHelpers()

        // Update debt ratio as deployer
        await diamond
          .connect(deployer)
          .updateAssetSetting(details.lendingToken.address, {
            key: ethers.utils.id('MaxDebtRatio'),
            value: ethers.utils.hexZeroPad(ethers.utils.hexlify(0), 32),
            cacheType: CacheType.Uint,
          })

        await takeOut().should.be.revertedWith(
          'Teller: max supply-to-debt ratio exceeded'
        )

        await revert()
      })

      it('should be able to withdraw collateral before takeOutLoan', async () => {
        // Create loan with terms without depositing collateral
        const { getHelpers } = await createLoan({
          lendToken: market.lendingToken,
          collToken: market.collateralTokens[0],
          loanType: LoanType.OVER_COLLATERALIZED,
        })
        const { collateral } = await getHelpers()

        // Deposit collateral
        const neededCollateral = await collateral.needed()
        await collateral.deposit(neededCollateral)

        // Withdraw collateral without taking out the loan
        await collateral.withdraw(await collateral.current())

        // Verify collateral has been removed
        await collateral.current().then((coll) => coll.should.eq(toBN(0)))
      })

      // it.skip('should not be able to deposit collateral and take out loan in same block', async () => {
      //   const amount = toBN(100, await lendingToken.decimals())
      //
      //   const factory = await ethers.getContractFactory('ReentryTest')
      //   const contract = (await factory.deploy()) as ReentryTest
      //
      //   await diamond.connect(deployer).addAuthorizedAccount(contract.address)
      //
      //   // Create loan with terms without depositing collateral
      //   const createArgs = await createLoanArgs({
      //     lendTokenSym: market.lendingToken,
      //     collTokenSym: market.collateralTokens[0],
      //     amount,
      //     borrower: contract.address,
      //     loanType: LoanType.OVER_COLLATERALIZED,
      //   })
      //
      //   await contract.createAndTakeOutLoan(
      //     diamond.address,
      //     {
      //       request: createArgs[0],
      //       responses: createArgs[1],
      //       collateralToken: createArgs[2],
      //       collateralAmount: toBN(5, 18),
      //     },
      //     {
      //       value: toBN(5, 18),
      //     }
      //   )
      // })

      describe('repay', () => {
        it('should be able to repay loan as borrower', async () => {
          const { details, repay } = await takeOut({
            lendToken: market.lendingToken,
          })
          helpers = await getHelpers()

          expect(helpers.details.loan).to.exist
        })
        it('should be an active loan', () => {
          // get loanStatus from helpers and check if it's equal to 2, which means it's active
          const loanStatus = helpers.details.loan.status
          expect(loanStatus).to.equal(2)
        })
      })
    })
  }
})
