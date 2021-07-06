import { AssetSettings } from '../types/custom/config-types'
import { AssetType } from '../utils/consts'

const mainnetAssetSettings: AssetSettings = {
  DAI: [
    { key: 'cToken', value: 'CDAI', type: AssetType.Address },
    { key: 'aToken', value: 'ADAI', type: AssetType.Address },
    { key: 'yVault', value: 'YDAI', type: AssetType.Address },
    { key: 'pPool', value: 'PCDAI', type: AssetType.Address },
    { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
    { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
    { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
  ],
  USDC: [{ key: 'cToken', value: 'CUSDC', type: AssetType.Address }],
  WETH: [{ key: 'cToken', value: 'CETH', type: AssetType.Address }],
}

const polygonAssetSettings: AssetSettings = {
  DAI: [
    { key: 'aToken', value: 'ADAI', type: AssetType.Address },
    { key: 'pPool', value: 'PCDAI', type: AssetType.Address },
    { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
    { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
    { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
  ],
  USDC: [{ key: 'aToken', value: 'AUSDC', type: AssetType.Address }],
  WETH: [{ key: 'aToken', value: 'AETH', type: AssetType.Address }],
}

export const assetSettings: Record<string, AssetSettings> = {
  kovan: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [{ key: 'cToken', value: 'CUSDC', type: AssetType.Address }],
    WETH: [{ key: 'cToken', value: 'CETH', type: AssetType.Address }],
  },
  rinkeby: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'pPool', value: 'PCDAI', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [{ key: 'cToken', value: 'CUSDC', type: AssetType.Address }],
    WETH: [{ key: 'cToken', value: 'CETH', type: AssetType.Address }],
  },
  ropsten: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Address },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [{ key: 'cToken', value: 'CUSDC', type: AssetType.Address }],
    WETH: [{ key: 'cToken', value: 'CETH', type: AssetType.Address }],
  },
  hardhat: polygonAssetSettings,
  localhost: polygonAssetSettings,
  mainnet: mainnetAssetSettings,
  polygon: polygonAssetSettings,
  polygon_mumbai: polygonAssetSettings,
}
