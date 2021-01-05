import { SettingsInstance } from '../../../types/truffle-contracts'
import { toBytes32 } from '../consts'
import { DeployConfig } from './types'

const Settings = artifacts.require('Settings')
const Mock = artifacts.require('Mock')

interface SettingsConfig extends DeployConfig {
  initData?: SettingsInitData
  platformSettings?: PlatformSettings
}

interface PlatformSettings {
  // The setting name for the required subsmission settings.
  RequiredSubmissions?: PlatformSettingValue
  // The setting name for the maximum tolerance settings.
  MaximumTolerance?: PlatformSettingValue
  // The setting name for the response expiry length settings.
  ResponseExpiryLength?: PlatformSettingValue
  //The setting name for the safety interval settings.
  SafetyInterval?: PlatformSettingValue
  // The setting name for the term expiry time settings.
  TermsExpiryTime?: PlatformSettingValue
  // The setting name for the liquidate ETH price settings.
  LiquidateEthPrice?: PlatformSettingValue
  // The setting name for the maximum loan duration settings.
  MaximumLoanDuration?: PlatformSettingValue
  // The setting name for the collateral buffer settings.
  CollateralBuffer?: PlatformSettingValue
  // The setting name for the over collateralized buffer settings.
  OverCollateralizedBuffer?: PlatformSettingValue
  // The setting name for the request loan terms rate limit settings.
  RequestLoanTermsRateLimit?: PlatformSettingValue
}

interface PlatformSettingValue {
  min?: number | string
  max?: number | string
  value?: number | string
}

interface SettingsInitData {
  escrowFactoryAddress?: string
  versionsRegistryAddress?: string
  chainlinkAggregatorAddress?: string
  marketsStateAddress?: string
  interestValidatorAddress?: string
  atmSettingsAddress?: string
  wethTokenAddress?: string
  cethTokenAddress?: string
}

export interface DeploySettingsResponse extends Required<SettingsInitData> {
  settings: SettingsInstance
}

export async function deploySettings(config: SettingsConfig): Promise<DeploySettingsResponse> {
  const settings = await Settings.new()

  const escrowFactoryAddress = config.initData?.escrowFactoryAddress ?? (await Mock.new()).address
  const versionsRegistryAddress = config.initData?.versionsRegistryAddress ?? (await Mock.new()).address
  const chainlinkAggregatorAddress = config.initData?.chainlinkAggregatorAddress ?? (await Mock.new()).address
  const marketsStateAddress = config.initData?.marketsStateAddress ?? (await Mock.new()).address
  const interestValidatorAddress = config.initData?.interestValidatorAddress ?? (await Mock.new()).address
  const atmSettingsAddress = config.initData?.atmSettingsAddress ?? (await Mock.new()).address
  const wethTokenAddress = config.initData?.wethTokenAddress ?? (await Mock.new()).address
  const cethTokenAddress = config.initData?.cethTokenAddress ?? (await Mock.new()).address

  await settings.methods['initialize(address,address,address,address,address,address,address,address)'](
    escrowFactoryAddress,
    versionsRegistryAddress,
    chainlinkAggregatorAddress,
    marketsStateAddress,
    interestValidatorAddress,
    atmSettingsAddress,
    wethTokenAddress,
    cethTokenAddress,
    {
      from: config.deployerAddress
    }
  )

  const platformSettings: PlatformSettings = require(`../../../config/networks/${config.network}/platformSettings.json`)
  for (const settingName in platformSettings) {
    const settingValue: PlatformSettingValue = platformSettings[settingName]
    if (!settingValue.value) continue

    await settings.createPlatformSetting(
      toBytes32(web3, settingName),
      config.platformSettings?.[settingName]?.value ?? settingValue.value,
      config.platformSettings?.[settingName]?.min ?? settingValue.min,
      config.platformSettings?.[settingName]?.max ?? settingValue.max,
      { from: config.deployerAddress }
    );
  }

  return {
    settings,
    escrowFactoryAddress,
    versionsRegistryAddress,
    chainlinkAggregatorAddress,
    marketsStateAddress,
    interestValidatorAddress,
    atmSettingsAddress,
    wethTokenAddress,
    cethTokenAddress
  }
}
