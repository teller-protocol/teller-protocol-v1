import { AssetSettings } from '../types/custom/config-types'
import { AssetType } from '../utils/consts'

const mainnetAssetSettings: AssetSettings = {
  DAI: [
    { key: 'cToken', value: 'CDAI', type: AssetType.Address },
    { key: 'aToken', value: 'ADAI', type: AssetType.Address },
    { key: 'yVault', value: 'YDAI', type: AssetType.Address },
    { key: 'pPool', value: 'PCDAI', type: AssetType.Address },
    { key: 'MaxLoanAmount', value: 10000, type: AssetType.Amount },
    { key: 'MaxTVLAmount', value: 100000, type: AssetType.Amount },
    { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
  ],
  USDC: [
    { key: 'cToken', value: 'CUSDC', type: AssetType.Address },
    { key: 'MaxLoanAmount', value: 10000, type: AssetType.Amount },
    { key: 'MaxTVLAmount', value: 100000, type: AssetType.Amount },
    { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
  ],
  WETH: [
    { key: 'cToken', value: 'CETH', type: AssetType.Address },
    { key: 'MaxLoanAmount', value: 0, type: AssetType.Amount },
    { key: 'MaxTVLAmount', value: 0, type: AssetType.Amount },
    { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
  ],
}

export const assetSettings: Record<string, AssetSettings> = {
  kovan: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'cToken', value: 'CETH', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 0, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 0, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  rinkeby: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'pPool', value: 'PCDAI', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'cToken', value: 'CETH', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 0, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 0, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  ropsten: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'cToken', value: 'CETH', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 0, type: AssetType.Amount },
      { key: 'MaxTVLAmount', value: 0, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  hardhat: mainnetAssetSettings,
  localhost: mainnetAssetSettings,
  mainnet: mainnetAssetSettings,
}
