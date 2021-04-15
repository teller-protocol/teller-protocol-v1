import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getMarkets, getSigners, getTokens } from '../config'
import { ITellerDiamond } from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'
import { ContractTransaction } from 'ethers'

const initializeMarkets: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts, tokens, network, deployments, log } = hre
  const { deployer, craSigner } = await getNamedAccounts()

  log('********** Lending Pools **********')
  log('')

  const tokenAddresses = getTokens(network)
  const markets = getMarkets(network)

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
    from: deployer,
  })

  for (const { lendingToken, collateralTokens } of markets) {
    const lendingTokenAddress = tokenAddresses.all[lendingToken]
    const asset = await tokens.get(lendingToken)
    const name = await asset.name()

    log(`${name} (${lendingToken})`, { indent: 1, star: true })

    // Get initial signers to add
    const signers = getSigners(network)
    if (craSigner) signers.push(craSigner)
    const signersToAdd = await Promise.all(
      signers.map(async (signer) => ({
        signer,
        isSigner: await diamond.isSigner(lendingTokenAddress, signer),
      }))
    ).then((result) =>
      result.reduce<string[]>((arr, { signer, isSigner }) => {
        if (!isSigner) arr.push(signer)
        return arr
      }, [])
    )
    if (signersToAdd.length > 0)
      await waitAndLog(
        'Signers added',
        diamond.addSigners(lendingTokenAddress, signersToAdd),
        hre
      )

    // Add collateral tokens
    const existingCollateralTokens = await diamond.getCollateralTokens(
      lendingTokenAddress
    )
    const collateralTokensToAdd = new Set(collateralTokens)
    for (const token of existingCollateralTokens) {
      if (collateralTokensToAdd.has(token)) collateralTokensToAdd.delete(token)
    }
    if (collateralTokensToAdd.size > 0)
      await waitAndLog(
        'Collateral tokens added',
        diamond.addCollateralTokens(
          lendingTokenAddress,
          Array.from(collateralTokensToAdd)
        ),
        hre
      )

    // Check if the market is already initialized
    const tToken = await diamond.getTToken(lendingTokenAddress)
    if (tToken !== NULL_ADDRESS) {
      // Initialize the lending pool
      await waitAndLog(
        'Lending pool initialized',
        diamond.initLendingPool(asset.address),
        hre
      )
    } else {
      log(`Lending pool ALREADY initialized`, { indent: 2, star: true })
    }
  }
}

const waitAndLog = async (
  msg: string,
  tx: Promise<ContractTransaction>,
  hre: HardhatRuntimeEnvironment
) => {
  const receipt = await tx.then(({ wait }) => wait())
  hre.log(`${msg} with ${receipt.gasUsed} gas`, {
    indent: 2,
    star: true,
  })
}

initializeMarkets.tags = ['markets']
initializeMarkets.dependencies = [
  'platform-settings',
  'asset-settings',
  'price-agg',
  'dapps',
]

export default initializeMarkets
