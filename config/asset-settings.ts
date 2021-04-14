import { AssetSettings } from '../types/custom/config-types'
import { AssetType } from '../utils/consts'

const mainnetAssetSettings: AssetSettings = {
  DAI: [
    { key: 'cToken', value: 'CDAI', type: AssetType.Address },
    { key: 'aToken', value: 'ADAI', type: AssetType.Address },
    { key: 'yVault', value: 'YDAI', type: AssetType.Address },
    { key: 'pPool', value: 'PCDAI', type: AssetType.Address },
    { key: 'maxLoanAmount', value: 10000, type: AssetType.Amount },
    { key: 'maxTVLAmount', value: 100000, type: AssetType.Amount },
    { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
  ],
  USDC: [
    { key: 'cToken', value: 'CUSDC', type: AssetType.Address },
    { key: 'maxLoanAmount', value: 10000, type: AssetType.Amount },
    { key: 'maxTVLAmount', value: 100000, type: AssetType.Amount },
    { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
  ],
  WETH: [
    { key: 'cToken', value: 'CETH', type: AssetType.Address },
    { key: 'maxLoanAmount', value: 0, type: AssetType.Amount },
    { key: 'maxTVLAmount', value: 0, type: AssetType.Amount },
    { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
  ],
}

export const assetSettings: Record<string, AssetSettings> = {
  kovan: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'cToken', value: 'CETH', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 0, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 0, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  rinkeby: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'pPool', value: 'PCDAI', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'cToken', value: 'CETH', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 0, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 0, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  ropsten: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 1000, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 100000, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'cToken', value: 'CETH', type: AssetType.Address },
      { key: 'maxLoanAmount', value: 0, type: AssetType.Amount },
      { key: 'maxTVLAmount', value: 0, type: AssetType.Amount },
      { key: 'maxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  hardhat: mainnetAssetSettings,
  localhost: mainnetAssetSettings,
  mainnet: mainnetAssetSettings,
}
