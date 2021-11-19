import { AssetSettings } from '../types/custom/config-types'
import { AssetType } from '../utils/consts'

export const assetSettings: Record<string, AssetSettings> = {
  kovan: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDT: [
      { key: 'cToken', value: 'CUSDT', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'cToken', value: 'CETH', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 10, type: AssetType.Amount },
      { key: 'MaxTVL', value: 1000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  rinkeby: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Token },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
    ],
    WETH: [{ key: 'cToken', value: 'CETH', type: AssetType.Token }],
  },
  ropsten: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [{ key: 'cToken', value: 'CUSDC', type: AssetType.Token }],
    WETH: [{ key: 'cToken', value: 'CETH', type: AssetType.Token }],
  },
  mainnet: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Token },
      { key: 'aToken', value: 'ADAI', type: AssetType.Token },
      { key: 'yVault', value: 'YDAI', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 100000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'aToken', value: 'CUSDC', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDT: [
      { key: 'cToken', value: 'CUSDT', type: AssetType.Token },
      { key: 'aToken', value: 'AUSDT', type: AssetType.Token },
      { key: 'yVault', value: 'YUSDT', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 100000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'cToken', value: 'CETH', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 10, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WBTC: [
      { key: 'cToken', value: 'CWBTC', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 5, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    LINK: [
      { key: 'cToken', value: 'CLINK', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 250, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  polygon: {
    DAI: [
      { key: 'aToken', value: 'ADAI', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDT: [
      { key: 'aToken', value: 'AUSDT', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'aToken', value: 'AUSDC', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WETH: [
      { key: 'aToken', value: 'AWETH', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WBTC: [
      { key: 'aToken', value: 'AWBTC', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 10, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    WMATIC: [
      { key: 'aToken', value: 'AWMATIC', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 250, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
  },
  polygon_mumbai: {
    DAI: [
      { key: 'aToken', value: 'ADAI', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [{ key: 'aToken', value: 'AUSDC', type: AssetType.Token }],
    WETH: [{ key: 'aToken', value: 'AWETH', type: AssetType.Token }],
  },
}
