import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { getMarkets, getNFT } from '../../config'
import { claimNFT, getPlatformSetting } from '../../tasks'
import { getLoanMerkleTree, setLoanMerkle } from '../../tasks'
import { Market } from '../../types/custom/config-types'
import { ITellerDiamond, TellerNFT } from '../../types/typechain'
import { CacheType, LoanStatus } from '../../utils/consts'
import { fundedMarket } from '../fixtures'
import { fundLender, getFunds } from '../helpers/get-funds'
import { createLoan, LoanType, takeOut } from '../helpers/loans'

chai.should()
chai.use(solidity)

const { getNamedSigner, contracts, tokens, ethers, evm, toBN } = hre

describe('Loans', () => {
  getMarkets(hre.network).forEach(testLoans)

  function testLoans(market: Market): void {
    let deployer: Signer
    let diamond: ITellerDiamond

    before(async () => {
      // Get funded market with NFT
      ;({ diamond } = await fundedMarket({
        assetSym: market.lendingToken,
        amount: 100000,
        tags: ['nft'],
      }))

      deployer = await getNamedSigner('deployer')
    })

    describe('create', () => {})

    describe('take out', () => {
      beforeEach(async () => {
        // Advance time
        const { value: rateLimit } = await getPlatformSetting(
          'RequestLoanTermsRateLimit',
          hre
        )
        await evm.advanceTime(rateLimit)
      })

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
          loanType: LoanType.OVER_COLLATERALIZED,
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

      it('should be able to take out a loan with an NFT', async () => {
        // Setup for NFT user
        const { merkleTrees } = getNFT(hre.network)
        const merkleIndex = 0
        const borrower = ethers.utils.getAddress(
          merkleTrees[merkleIndex].balances[0].address
        )
        const imp = await evm.impersonate(borrower)
        await diamond.connect(deployer).addAuthorizedAddress(borrower)

        // Claim user's NFTs
        await claimNFT({ account: borrower, merkleIndex }, hre)

        // Create and set NFT loan merkle
        const nftLoanTree = await getLoanMerkleTree(hre)
        await setLoanMerkle({ loanTree: nftLoanTree }, hre)
        const proofs = []

        // Get the sum of loan amount to take out
        const nft = await contracts.get<TellerNFT>('TellerNFT')
        const ownedNFTs = await nft
          .getOwnedTokens(borrower)
          .then((arr) => (arr.length > 2 ? arr.slice(0, 2) : arr))
        const lendingToken = await tokens.get(market.lendingToken)
        let amount = toBN(0)
        for (const nftID of ownedNFTs) {
          const { tier_ } = await nft.getTokenTier(nftID)
          const baseLoanSize = toBN(
            tier_.baseLoanSize,
            await lendingToken.decimals()
          )
          amount = amount.add(baseLoanSize)

          // Get the proofs for the NFT loan size
          proofs.push({
            id: nftID,
            baseLoanSize,
            proof: nftLoanTree.getProof(nftID, baseLoanSize),
          })
        }

        await nft
          .connect(imp.signer)
          .setApprovalForAll(diamond.address, true)
          .then(({ wait }) => wait())
        await diamond
          .connect(imp.signer)
          .stakeNFTs(ownedNFTs)
          .then(({ wait }) => wait())

        // Create loan
        const { getHelpers } = await createLoan({
          lendToken: market.lendingToken,
          collToken: market.collateralTokens[0],
          loanType: LoanType.OVER_COLLATERALIZED,
          amountBN: amount,
          borrower,
        })
        const { details } = await getHelpers()

        // Take out loan
        await diamond
          .connect(imp.signer)
          .takeOutLoanWithNFTs(details.loan.id, amount, proofs)
          .should.emit(diamond, 'LoanTakenOut')
          .withArgs(details.loan.id, borrower, amount, true)

        await details
          .refresh()
          .then(({ loan }) => loan.status.should.eq(LoanStatus.Active))

        await imp.stop()
      })

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
            collToken: market.collateralTokens[0],
            loanType: LoanType.OVER_COLLATERALIZED,
          })

          // Get the funds to pay back the interest
          await getFunds({
            tokenSym: market.lendingToken,
            to: details.borrower.address,
            amount: details.debt.interestOwed,
            hre,
          })

          // Approve loan repayment
          await details.lendingToken
            .connect(details.borrower.signer)
            .approve(diamond.address, details.totalOwed)

          // Repay loan
          await repay(details.totalOwed)
            .should.emit(diamond, 'LoanRepaid')
            .withArgs(
              details.loan.id,
              details.borrower.address,
              details.totalOwed,
              details.borrower.address,
              '0'
            )

          // Verify loan is closed
          await details
            .refresh()
            .then(({ loan }) => loan.status.should.eq(LoanStatus.Closed))
        })

        it('should be able to take out and repay an under collateralized loan', async () => {
          // Create loan
          const { details, escrowRepay } = await takeOut({
            lendToken: market.lendingToken,
            collToken: market.collateralTokens[0],
            loanType: LoanType.UNDER_COLLATERALIZED,
          })

          // Repay full amount
          const amountToRepay = details.totalOwed

          // Get the funds to pay back the interest
          await getFunds({
            tokenSym: market.lendingToken,
            to: details.borrower.address,
            amount: details.debt.interestOwed,
            hre,
          })

          // Approve loan repayment
          await details.lendingToken
            .connect(details.borrower.signer)
            .approve(diamond.address, amountToRepay)

          // Repay loan
          await escrowRepay(amountToRepay)
            .should.emit(diamond, 'LoanRepaid')
            .withArgs(
              details.loan.id,
              details.borrower.address,
              amountToRepay,
              details.borrower.address,
              '0'
            )

          const { loan: repaidLoan } = await details.refresh()
          repaidLoan.status.should.eq(LoanStatus.Closed)
        })
      })
    })
  }
})
