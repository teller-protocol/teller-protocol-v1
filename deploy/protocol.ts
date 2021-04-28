import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { getTokens } from '../config'
import {
  ICollateralEscrow,
  ILoansEscrow,
  ITellerDiamond,
  UpgradeableBeaconFactory,
} from '../types/typechain'
import { deploy, deployDiamond } from '../utils/deploy-helpers'

const deployProtocol: DeployFunction = async (hre) => {
  const { contracts, network, getNamedAccounts } = hre

  const { deployer } = await getNamedAccounts()

  const { address: nftAddress } = await contracts.get('TellerNFT')
  const loansEscrowBeacon = await deployLoansEscrowBeacon(hre)

  const collateralEscrowBeacon = await deployCollateralEscrowBeacon(hre)

  const tokens = getTokens(network)
  const initArgs: Parameters<ITellerDiamond['init']>[0] = {
    admin: deployer,
    assets: Object.entries(tokens.erc20).map(([sym, addr]) => ({ sym, addr })),
    cTokens: Object.values(tokens.compound),
    tellerNFT: nftAddress,
    loansEscrowBeacon: loansEscrowBeacon.address,
    collateralEscrowBeacon: collateralEscrowBeacon.address,
  }

  // Deploy platform diamond
  const diamond = await deployDiamond<ITellerDiamond, 'init'>({
    hre,
    name: 'TellerDiamond',
    facets: [
      // Settings
      'SettingsFacet',
      'PlatformSettingsFacet',
      'AssetSettingsDataFacet',
      'AssetSettingsFacet',
      'PausableFacet',
      // Pricing
      'PriceAggFacet',
      'ChainlinkAggFacet',
      // Lending
      'LendingFacet',
      // Loans
      'CollateralFacet',
      'CreateLoanFacet',
      'LoanDataFacet',
      'RepayFacet',
      'SignersFacet',
      // NFT
      'NFTFacet',
      // Escrow
      'EscrowClaimTokensFacet',
      // Dapps
      'CompoundFacet',
      'UniswapFacet',
    ],
    owner: deployer,
    execute: {
      methodName: 'init',
      args: [initArgs],
    },
  })

  await addAuthorizedAddresses(hre, diamond)
}

const addAuthorizedAddresses = async (
  hre: HardhatRuntimeEnvironment,
  diamond: ITellerDiamond
): Promise<void> => {
  const { getNamedAccounts, network } = hre

  const addresses: string[] = []
  if (network.name === 'mainnet') {
  } else if (network.name === 'hardhat' || network.name === 'localhost') {
    const accounts = await getNamedAccounts()
    addresses.push(
      accounts.lender,
      accounts.borrower,
      accounts.liquidator,
      accounts.funder
    )
  }

  await diamond.addAuthorizedAddressList(addresses)
}

const deployLoansEscrowBeacon = async (
  hre: HardhatRuntimeEnvironment
): Promise<UpgradeableBeaconFactory> => {
  const { ethers, log } = hre

  log('********** Loans Escrow Beacon **********', { indent: 2 })
  log('')

  const logicVersion = 1

  const loansEscrowLogic = await deploy<ILoansEscrow>({
    hre,
    contract: `LoansEscrow_V${logicVersion}`,
    log: false,
  })

  log(`Current Logic V${logicVersion}: ${loansEscrowLogic.address}`, {
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
    name: 'EscrowBeaconFactory',
    args: [beaconProxy.address, loansEscrowLogic.address],
  })

  // Check to see if we need to upgrade
  const currentImpl = await beacon.implementation()
  if (
    ethers.utils.getAddress(currentImpl) !==
    ethers.utils.getAddress(loansEscrowLogic.address)
  ) {
    log(`Upgrading Loans Escrow logic: ${loansEscrowLogic.address}`, {
      indent: 4,
      star: true,
    })
    await beacon.upgradeTo(loansEscrowLogic.address)
  }

  log(`Using Beacon: ${beacon.address}`, { indent: 3, star: true })
  log('')

  return beacon
}

const deployCollateralEscrowBeacon = async (
  hre: HardhatRuntimeEnvironment
): Promise<UpgradeableBeaconFactory> => {
  const { ethers, log } = hre

  log('********** Collateral Escrow Beacon **********', { indent: 2 })
  log('')

  const logicVersion = 1

  const collateralEscrowLogic = await deploy<ICollateralEscrow>({
    hre,
    contract: `CollateralEscrow_V${logicVersion}`,
    log: false,
  })

  log(`Current Logic V${logicVersion}: ${collateralEscrowLogic.address}`, {
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
    name: 'CollateralEscrowBeaconFactory',
    args: [beaconProxy.address, collateralEscrowLogic.address],
  })

  // Check to see if we need to upgrade
  const currentImpl = await beacon.implementation()
  if (
    ethers.utils.getAddress(currentImpl) !==
    ethers.utils.getAddress(collateralEscrowLogic.address)
  ) {
    log(`Upgrading Collateral Escrow logic: ${collateralEscrowLogic.address}`, {
      indent: 4,
      star: true,
    })
    await beacon.upgradeTo(collateralEscrowLogic.address)
  }

  log(`Using Beacon: ${beacon.address}`, { indent: 3, star: true })
  log('')

  return beacon
}

deployProtocol.tags = ['protocol']
deployProtocol.dependencies = ['nft']

export default deployProtocol
