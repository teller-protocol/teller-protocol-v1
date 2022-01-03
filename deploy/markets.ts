import colors from 'colors'
import { Contract, ContractTransaction } from 'ethers'
import { toBN } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { getDappAddresses, getMarkets, getSigners, getTokens } from '../config'
import { IERC20, ITellerDiamond, ITToken } from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'
import { deploy } from '../utils/deploy-helpers'

const initializeMarkets: DeployFunction = async (hre) => {
  const {
    getNamedAccounts,
    getNamedSigner,
    contracts,
    tokens,
    network,
    ethers,
    log,
  } = hre
  const { deployer, craSigner } = await getNamedAccounts()

  log('********** Lending Pools **********')
  log('')

  const tokenAddresses = getTokens(network)
  const dappAddresses = getDappAddresses(network)
  const markets = getMarkets(network)

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
    from: deployer,
  })

  for (const market of markets) {
    const lendingTokenAddress = tokenAddresses.all[market.lendingToken]
    const asset = await tokens.get(market.lendingToken)
    const name = await asset.name()

    log(`${name} (${market.lendingToken})`, { indent: 1, star: true })

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
    if (signersToAdd.length > 0) {
      await waitAndLog(
        'Signers added',
        diamond.addSigners(lendingTokenAddress, signersToAdd),
        hre
      )
    }

    // Add collateral tokens
    const existingCollateralTokens = await diamond.getCollateralTokens(
      lendingTokenAddress
    )
    const collateralTokensToAdd = new Set(
      market.collateralTokens.map((sym) =>
        ethers.utils.getAddress(tokenAddresses.all[sym])
      )
    )
    for (const token of existingCollateralTokens) {
      const tokenAddress = ethers.utils.getAddress(token)
      if (collateralTokensToAdd.has(tokenAddress))
        collateralTokensToAdd.delete(tokenAddress)
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
    let tTokenAddress = await diamond.getTTokenFor(lendingTokenAddress)
    if (tTokenAddress === NULL_ADDRESS) {
      // Initialize the lending pool that creates a TToken
      await diamond.initLendingPool(asset.address).then(({ wait }) => wait())
      tTokenAddress = await diamond.getTTokenFor(lendingTokenAddress)

      log(`Lending pool ${colors.yellow('initialized')}`, {
        indent: 2,
        star: true,
      })
    } else {
      log(`Lending pool ${colors.yellow('already initialized')}`, {
        indent: 2,
        star: true,
      })
    }

    let tTokenStrategy: Contract

    if (market.strategy.name == 'TTokenCompoundStrategy_2') {
      tTokenStrategy = await deploy({
        hre,
        contract: market.strategy.name,
        indent: 4,
        args: [await (await getNamedSigner('deployer')).getAddress()],
      })
    } else {
      tTokenStrategy = await deploy({
        hre,
        contract: market.strategy.name,
        indent: 4,
      })
    }

    const tToken = await contracts.get<ITToken>('ITToken', {
      at: tTokenAddress,
    })
    // Setting approval for bonus int from deployer account
    if (market.strategy.name == 'TTokenCompoundStrategy_2') {
      const lendingToken = await contracts.get<IERC20>('IERC20', {
        at: lendingTokenAddress,
      })
      await lendingToken
        .connect(await getNamedSigner('deployer'))
        .approve(tTokenAddress, toBN('1000000', '18'))
    }
    const currentStrategy = await tToken.getStrategy()
    if (currentStrategy !== tTokenStrategy.address) {
      log(`Setting new TToken strategy...:`, {
        indent: 4,
        star: true,
        nl: false,
      })

      const receipt = await tToken
        .connect(await getNamedSigner('deployer'))
        .setStrategy(
          tTokenStrategy.address,
          tTokenStrategy.interface.encodeFunctionData(
            'init',
            market.strategy.initArgs.map(({ type, value }) => {
              switch (type) {
                case 'TokenSymbol':
                  return tokenAddresses.all[value]
                case 'ProtocolAddressConstant':
                  return dappAddresses[value]
                case 'Number':
                  return value
              }
            })
          )
        )
        .then(({ wait }) => wait())

      const gas = colors.cyan(`${receipt.gasUsed} gas`)
      log(` with ${gas}`)
    }
  }

  await network.provider.send('evm_setAutomine', [false])
  await network.provider.send('evm_setIntervalMining', [5000])
}

const waitAndLog = async (
  msg: string,
  tx: Promise<ContractTransaction>,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const receipt = await tx.then(({ wait }) => wait())
  const gas = colors.cyan(`${receipt.gasUsed} gas`)
  hre.log(`${msg} with ${gas}`, {
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
