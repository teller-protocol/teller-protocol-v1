import { FixedNumber } from 'ethers'
import { subtask, task } from 'hardhat/config'

import {
  IERC721,
  ITellerDiamond,
  ITellerNFT,
  ITToken,
  LibCreateLoan,
} from '../types/typechain'

task('stats', 'Prints out current stats about the DAI market').setAction(
  async (_, hre) => {
    hre.log('')

    const loansTakenOut = await hre.run('stats:loans-taken-out')
    const loansRepaid = await hre.run('stats:loans-repaid')
    const currentTVL = await hre.run('stats:current-tvl')
    await hre.run('stats:average-loan-amount', {
      loansTakenOut: JSON.stringify(loansTakenOut),
    })
    await hre.run('stats:interest-generated', {
      currentTVL: currentTVL.toString(),
    })
    await hre.run('stats:pending-interest-owed', {
      loansTakenOut: JSON.stringify(loansTakenOut),
      loansRepaid: JSON.stringify(loansRepaid),
    })
    await hre.run('stats:staked-nft-balance')

    hre.log('')
  }
)

subtask('stats:current-tvl')
  .addOptionalParam('currentTVL', 'Current TVL value to use')
  .addFlag('disableLog', 'Disables console output')
  .setAction(async (args, hre) => {
    if ('currentTVL' in args) {
      return BigInt(args.currentTVL)
    }

    const diamond: ITellerDiamond = await hre.contracts.get('TellerDiamond')
    const dai = await hre.tokens.get('dai')
    const tDai: ITToken = await hre.contracts.get('ITToken', {
      at: await diamond.getTTokenFor(dai.address),
    })

    const currentTVL = await tDai.currentTVL.staticCall()

    if (!args.disableLog) {
      const currentTVLFN = FixedNumber.fromValue(currentTVL, 0).divUnsafe(
        FixedNumber.fromValue(hre.toBN(1, 18), 0)
      )
      hre.log(`${currentTVLFN.toString()} current TVL`, { star: true })
    }

    return currentTVL
  })

subtask('stats:loans-taken-out')
  .addOptionalParam('loansTakenOut', 'ID of loans that have been taken out')
  .addFlag('disableLog', 'Disables console output')
  .setAction(async (args, hre) => {
    const diamond: ITellerDiamond = await hre.contracts.get('TellerDiamond')

    if ('loansTakenOut' in args) {
      return JSON.parse(args.loansTakenOut)
    }

    const LibCreateLoan = await hre.contracts.get<LibCreateLoan>(
      'LibCreateLoan',
      {
        at: diamond.target as string,
      }
    )
    const loanFilter = LibCreateLoan.filters.LoanTakenOut(
      null,
      null,
      null,
      null
    )
    const loanEvents = await diamond.queryFilter(loanFilter)
    const loanIDs = loanEvents.map((event) => {
      const args = (event as any).args
      return args.loanID.toString()
    })

    if (!args.disableLog) {
      hre.log(`${loanIDs.length} loans taken out`, { star: true })
    }

    return loanIDs
  })

subtask('stats:loans-repaid')
  .addOptionalParam('loansRepaid', 'ID of loans that have been fully repaid')
  .addFlag('disableLog', 'Disables console output')
  .setAction(async (args, hre) => {
    const diamond: ITellerDiamond = await hre.contracts.get('TellerDiamond')

    if ('loansRepaid' in args) {
      return JSON.parse(args.loansRepaid)
    }

    const loanRepaidFilter = diamond.filters.LoanRepaid(
      null,
      null,
      null,
      null,
      null
    )
    const loanRepaidEvents = await diamond.queryFilter(loanRepaidFilter)
    const repaidLoanIDs = loanRepaidEvents
      .filter((event) => {
        const args = (event as any).args
        return args.totalOwed === 0n
      })
      .map((event) => {
        const args = (event as any).args
        return args.loanID.toString()
      })

    if (!args.disableLog) {
      hre.log(`${repaidLoanIDs.length} loans repaid`, { star: true })
    }

    return repaidLoanIDs
  })

subtask('stats:average-loan-amount')
  .addOptionalParam('loansTakenOut', 'ID of loans that have been taken out')
  .addFlag('disableLog', 'Disables console output')
  .setAction(async (args, hre) => {
    const diamond: ITellerDiamond = await hre.contracts.get('TellerDiamond')
    const dai = await hre.tokens.get('dai')
    const tDai: ITToken = await hre.contracts.get('ITToken', {
      at: await diamond.getTTokenFor(dai.address),
    })

    const ms = await tDai.getMarketState.staticCall()
    const loansTakenOut: number[] = await hre.run('stats:loans-taken-out', args)
    const averageLoanAmount = ms.totalBorrowed / BigInt(loansTakenOut.length)

    if (!args.disableLog) {
      const averageLoanAmountFN = FixedNumber.fromValue(averageLoanAmount, 0).divUnsafe(
        FixedNumber.fromValue(hre.toBN(1, 18), 0)
      )
      hre.log(`${averageLoanAmountFN.toString()} average loan amount`, {
        star: true,
      })
    }

    return averageLoanAmount
  })

subtask('stats:interest-generated')
  .addFlag('disableLog', 'Disables console output')
  .setAction(async (args, hre) => {
    const diamond: ITellerDiamond = await hre.contracts.get('TellerDiamond')
    const dai = await hre.tokens.get('dai')
    const tDai: ITToken = await hre.contracts.get('ITToken', {
      at: await diamond.getTTokenFor(dai.address),
    })

    const mintFilter = tDai.filters.Mint(null, null, null)
    const mintEvents = await tDai.queryFilter(mintFilter)
    const mintAmount = mintEvents.reduce(
      (sum, event) => sum + ((event as any).args.underlyingAmount as bigint),
      0n
    )
    const redeemFilter = tDai.filters.Redeem(null, null, null)
    const redeemEvents = await tDai.queryFilter(redeemFilter)
    const redeemAmount = redeemEvents.reduce(
      (sum, event) => sum + ((event as any).args.underlyingAmount as bigint),
      0n
    )
    const currentTVL: bigint = await hre.run('stats:current-tvl', {
      ...args,
      disableLogs: true,
    })
    const totalInterestGenerated = currentTVL - (mintAmount - redeemAmount)

    if (!args.disableLog) {
      const totalInterestGeneratedFN = FixedNumber.fromValue(
        totalInterestGenerated, 0
      ).divUnsafe(FixedNumber.fromValue(hre.toBN(1, 18), 0))
      hre.log(`${totalInterestGeneratedFN.toString()} interest generated`, {
        star: true,
      })
    }

    return totalInterestGenerated
  })

subtask('stats:pending-interest-owed')
  .addOptionalParam('loansTakenOut', 'ID of loans that have been taken out')
  .addOptionalParam('loansRepaid', 'ID of loans that have been fully repaid')
  .addFlag('disableLog', 'Disables console output')
  .setAction(async (args, hre) => {
    const diamond: ITellerDiamond = await hre.contracts.get('TellerDiamond')

    const loansTakenOut: number[] = await hre.run('stats:loans-taken-out', args)
    const loansRepaid: number[] = await hre.run('stats:loans-repaid', args)
    const loansRepaidMap = loansRepaid.reduce<{ [loanID: string]: true }>(
      (map, loanID) => {
        map[loanID.toString()] = true
        return map
      },
      {}
    )

    let pendingInterestOwed = 0n
    const fetchPendingInterestOwed = async (loanID: number): Promise<void> => {
      if (!loansRepaidMap[loanID]) {
        const debt = await diamond.getDebtOwed(loanID)
        pendingInterestOwed = pendingInterestOwed + debt.interestOwed
      }
    }

    await Promise.all(
      loansTakenOut.map((loanID) => fetchPendingInterestOwed(loanID))
    )

    if (!args.disableLog) {
      const pendingInterestOwedFN = FixedNumber.fromValue(pendingInterestOwed, 0).divUnsafe(
        FixedNumber.fromValue(hre.toBN(1, 18), 0)
      )
      hre.log(`${pendingInterestOwedFN} pending interest owed`, { star: true })
    }

    return pendingInterestOwed
  })

subtask('stats:staked-nft-balance')
  .addFlag('disableLog', 'Disables console output')
  .setAction(async (args, hre) => {
    const diamond: ITellerDiamond = await hre.contracts.get('TellerDiamond')
    const nft: ITellerNFT & IERC721 = await hre.contracts.get('TellerNFT')

    const stakedNFTs = await nft.balanceOf(diamond.target as string)

    if (!args.disableLog) {
      hre.log(`${stakedNFTs} NFTs staked`, { star: true })
    }

    return stakedNFTs
  })
