import { BigNumberish, ContractTransaction } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { getMarkets, getSigners, getTokens } from '../config'
import {
  ITellerDiamond,
  ITToken,
  UpgradeableBeaconFactory,
} from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'
import { deploy } from '../utils/deploy-helpers'

const initializeMarkets: DeployFunction = async (hre) => {
  const {
    getNamedAccounts,
    contracts,
    tokens,
    network,
    ethers,
    deployments,
    log,
  } = hre
  const { deployer, craSigner } = await getNamedAccounts()

  log('********** Lending Pools **********')
  log('')

  const tokenAddresses = getTokens(network)
  const markets = getMarkets(network)

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
    from: deployer,
  })
  const tTokenFactory = await deployTTokenBeacon(hre, diamond)

  for (const { lendingToken, collateralTokens, maxTVL } of markets) {
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
    const collateralTokensToAdd = new Set(
      collateralTokens.map((sym) => tokenAddresses.all[sym])
    )
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
    const tToken = await diamond.getTTokenFor(lendingTokenAddress)
    if (tToken === NULL_ADDRESS) {
      // Deploy new Teller Token
      const tTokenAddress = await tTokenFactory(
        lendingTokenAddress,
        hre.toBN(maxTVL, await asset.decimals())
      )

      // Initialize the lending pool with new TToken and Lending Escrow
      await diamond.initLendingPool(asset.address, tTokenAddress)

      log('Lending pool initialized', { indent: 2, star: true })
    } else {
      log(`Lending pool ALREADY initialized`, { indent: 2, star: true })
    }
  }
}

const deployTTokenBeacon = async (
  hre: HardhatRuntimeEnvironment,
  diamond: ITellerDiamond
): Promise<(assetAddress: string, maxTVL: BigNumberish) => Promise<string>> => {
  const { ethers, getNamedAccounts, log } = hre

  log('********** Teller Token (TToken) Beacon **********', { indent: 2 })
  log('')

  const logicVersion = 1

  const tTokenLogic = await deploy<ITToken>({
    hre,
    contract: `TToken_V${logicVersion}`,
    log: false,
  })

  log(`Current Logic V${logicVersion}: ${tTokenLogic.address}`, {
    indent: 3,
    star: true,
  })

  const beaconProxy = await deploy({
    hre,
    contract: 'InitializeableBeaconProxy',
  })

  const beacon = await deploy<UpgradeableBeaconFactory>({
    hre,
    contract: 'UpgradeableBeaconFactory',
    name: 'TTokenBeaconFactory',
    args: [beaconProxy.address, tTokenLogic.address],
  })

  // Check to see if we need to upgrade
  const currentImpl = await beacon.implementation()
  if (
    ethers.utils.getAddress(currentImpl) !==
    ethers.utils.getAddress(tTokenLogic.address)
  ) {
    log(`Upgrading Teller Token logic: ${tTokenLogic.address}`, {
      indent: 4,
      star: true,
    })
    await beacon.upgradeTo(tTokenLogic.address)
  }

  log(`Using Beacon: ${beacon.address}`, { indent: 3, star: true })
  log('')

  return async (
    assetAddress: string,
    maxTVL: BigNumberish
  ): Promise<string> => {
    const receipt = await beacon
      .cloneProxy(
        tTokenLogic.interface.encodeFunctionData('initialize', [
          {
            controller: diamond.address,
            admin: await getNamedAccounts().then(({ deployer }) => deployer),
            underlying: assetAddress,
            cToken: await diamond.getAssetCToken(assetAddress),
            maxTVL,
          },
        ])
      )
      .then(({ wait }) => wait())
    const topic = beacon.interface.getEventTopic(
      beacon.interface.getEvent('ProxyCloned')
    )
    const [log] = await beacon.provider.getLogs({
      fromBlock: receipt.blockNumber,
      address: beacon.address,
      topics: [topic],
    })
    const {
      args: { newProxy },
    } = beacon.interface.parseLog(log)
    if (newProxy == null || newProxy == '') throw new Error('No proxy cloned')
    return newProxy
  }
}

const waitAndLog = async (
  msg: string,
  tx: Promise<ContractTransaction>,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
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
