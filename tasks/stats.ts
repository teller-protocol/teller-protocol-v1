import { BigNumber as BN, FixedNumber as FN } from 'ethers'
import { subtask, task } from 'hardhat/config'

import {
  IERC721,
  ITellerDiamond,
  ITellerNFT,
  ITToken,
} from '../types/typechain'

task('stats', 'Prints out current stats about the DAI market').setAction(
  async (_, hre) => {
    hre.log('')

    const loansTakenOut = await hre.run('stats:loans-taken-out')
    const loansRepaid = await hre.run('stats:loans-repaid')
    await hre.run('stats:current-tvl')
    await hre.run('stats:average-loan-amount', {
      loansTakenOut: JSON.stringify(loansTakenOut),
    })
    await hre.run('stats:interest-generated')
    await hre.run('stats:pending-interest-owed', {
      loansTakenOut: JSON.stringify(loansTakenOut),
      loansRepaid: JSON.stringify(loansRepaid),
    })
    await hre.run('stats:staked-nft-balance')

    hre.log('')
  }
)

subtask('stats:current-tvl')
  .addFlag('disableLog', 'Disables console output')
  .setAction(async (args, hre) => {
    const diamond: ITellerDiamond = await hre.contracts.get('TellerDiamond')
    const dai = await hre.tokens.get('dai')
    const tDai: ITToken = await hre.contracts.get('ITToken', {
      at: await diamond.getTTokenFor(dai.address),
    })

    const currentTVL = await tDai.callStatic.currentTVL()

    if (!args.disableLog) {
      const currentTVLFN = FN.from(currentTVL).divUnsafe(
        FN.from(hre.toBN(1, 18))
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

    const loanFilter = diamond.filters.LoanTakenOut(null, null, null, null)
    const loanEvents = await diamond.queryFilter(loanFilter)
    const loanIDs = loanEvents.map(({ args: { loanID } }) => loanID)

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
      .filter((event) => event.args.totalOwed.eq(0))
      .map(({ args: { loanID } }) => loanID)

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

    const ms = await tDai.callStatic.getMarketState()
    const loansTakenOut = await hre.run('stats:loans-taken-out', args)
    const averageLoanAmount = ms.totalBorrowed.div(loansTakenOut.length)

    if (!args.disableLog) {
      const averageLoanAmountFN = FN.from(averageLoanAmount).divUnsafe(
        FN.from(hre.toBN(1, 18))
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
      (sum, event) => sum.add(event.args.underlyingAmount),
      BN.from(0)
    )
    const redeemFilter = tDai.filters.Redeem(null, null, null)
    const redeemEvents = await tDai.queryFilter(redeemFilter)
    const redeemAmount = redeemEvents.reduce(
      (sum, event) => sum.add(event.args.underlyingAmount),
      BN.from(0)
    )
    const currentTVL: BN = await hre.run('stats:current-tvl', {
      ...args,
      disableLogs: true,
    })
    const totalInterestGenerated = currentTVL.sub(mintAmount.sub(redeemAmount))

    if (!args.disableLog) {
      const totalInterestGeneratedFN = FN.from(
        totalInterestGenerated
      ).divUnsafe(FN.from(hre.toBN(1, 18)))
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

    const loansTakenOut: BN[] = await hre.run('stats:loans-taken-out', args)
    const loansRepaid: BN[] = await hre.run('stats:loans-repaid', args)
    const loansRepaidMap = loansRepaid.reduce<{ [loanID: string]: true }>(
      (map, loanID) => {
        map[loanID.toString()] = true
        return map
      },
      {}
    )

    let pendingInterestOwed = BN.from(0)
    let currentLoanID = BN.from(0)
    while (currentLoanID.lt(loansTakenOut.length)) {
      if (!loansRepaidMap[currentLoanID.toString()]) {
        const debt = await diamond.getDebtOwed(currentLoanID)
        pendingInterestOwed = pendingInterestOwed.add(debt.interestOwed)
      }

      currentLoanID = currentLoanID.add(1)
    }

    if (!args.disableLog) {
      const pendingInterestOwedFN = FN.from(pendingInterestOwed).divUnsafe(
        FN.from(hre.toBN(1, 18))
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

    const stakedNFTs = await nft.balanceOf(diamond.address)

    if (!args.disableLog) {
      hre.log(`${stakedNFTs} NFTs staked`, { star: true })
    }

    return stakedNFTs
  })
