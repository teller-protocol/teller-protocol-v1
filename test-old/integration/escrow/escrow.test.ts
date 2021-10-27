// import chai from 'chai'
// import { solidity } from 'ethereum-waffle'
// import { Signer } from 'ethers'
// import hre from 'hardhat'
//
// import { getMarkets } from '../../../config'
// import { getPlatformSetting } from '../../../tasks'
// import { Market } from '../../../types/custom/config-types'
// import { ITellerDiamond } from '../../../types/typechain'
// import { fundedMarket } from '../../fixtures'
// import { LoanType, takeOut } from '../../helpers/loans'
//
// chai.should()
// chai.use(solidity)
//
// const { getNamedSigner, contracts, tokens, ethers, evm, toBN } = hre
//
// describe('Escrow Loans', () => {
//   getMarkets(hre.network).forEach(testLoans)
//
//   function testLoans(market: Market): void {
//     let diamond: ITellerDiamond
//
//     before(async () => {
//       // Get funded market with NFT
//       ;({ diamond } = await fundedMarket({
//         assetSym: market.lendingToken,
//         amount: 100000,
//       }))
//     })
//
//     beforeEach(async () => {
//       // Advance time
//       const { value: rateLimit } = await getPlatformSetting(
//         'RequestLoanTermsRateLimit',
//         hre
//       )
//       await evm.advanceTime(rateLimit)
//     })
//
//     describe('claim tokens', () => {
//       it('should NOT be able to claim tokens from a loan Escrow as NOT the borrower', async () => {
//         const { details } = await takeOut({
//           lendToken: market.lendingToken,
//           collToken: market.collateralTokens[0],
//           loanType: LoanType.OVER_COLLATERALIZED,
//         })
//
//         const deployer = await getNamedSigner('deployer')
//         await diamond
//           .connect(deployer)
//           .claimTokens(details.loan.id)
//           .should.be.rejectedWith('Teller: claim not borrower')
//       })
//
//       it('should NOT be able to claim tokens from a loan Escrow as the borrower before loan repaid', async () => {
//         const { details } = await takeOut({
//           lendToken: market.lendingToken,
//           collToken: market.collateralTokens[0],
//           loanType: LoanType.OVER_COLLATERALIZED,
//         })
//
//         await diamond
//           .connect(details.borrower.signer)
//           .claimTokens(details.loan.id)
//           .should.be.rejectedWith('Teller: loan not closed')
//       })
//     })
//   }
// })
