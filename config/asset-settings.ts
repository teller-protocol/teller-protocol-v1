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
    USDC: [{ key: 'cToken', value: 'CUSDC', type: AssetType.Token }],
    WETH: [{ key: 'cToken', value: 'CETH', type: AssetType.Token }],
  },
  rinkeby: {
    DAI: [
      { key: 'cToken', value: 'CDAI', type: AssetType.Token },
      {
        key: 'pPool',
        value: '0x4706856FA8Bb747D50b4EF8547FE51Ab5Edc4Ac2',
        type: AssetType.Address,
      },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 100000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Token },
      {
        key: 'pPool',
        value: '0xde5275536231eCa2Dd506B9ccD73C028e16a9a32',
        type: AssetType.Address,
      },
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
      {
        key: 'pPool',
        value: '0xEBfb47A7ad0FD6e57323C8A42B2E5A6a4F68fc1a',
        type: AssetType.Address,
      },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDT: [
      { key: 'cToken', value: 'CUSDT', type: AssetType.Token },
      { key: 'aToken', value: 'AUSDT', type: AssetType.Token },
      { key: 'yVault', value: 'YUSDT', type: AssetType.Token },
      {
        key: 'pPool',
        value: '0x481f1BA81f7C01400831DfF18215961C3530D118',
        type: AssetType.Address,
      },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [
      { key: 'cToken', value: 'CUSDC', type: AssetType.Token },
      {
        key: 'pPool',
        value: '0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416',
        type: AssetType.Address,
      },
    ],
    WETH: [{ key: 'cToken', value: 'CETH', type: AssetType.Token }],
  },
  polygon: {
    DAI: [
      { key: 'aToken', value: 'ADAI', type: AssetType.Token },
      {
        key: 'pPool',
        value: '0xFECFa775643eb8C0F755491Ba4569e501764DA51',
        type: AssetType.Address,
      },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDT: [
      { key: 'aToken', value: 'AUSDT', type: AssetType.Token },
      {
        key: 'pPool',
        value: '0x887E17D791Dcb44BfdDa3023D26F7a04Ca9C7EF4',
        type: AssetType.Address,
      },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [{ key: 'aToken', value: 'AUSDC', type: AssetType.Token }],
    WETH: [{ key: 'aToken', value: 'AETH', type: AssetType.Token }],
  },
  polygon_mumbai: {
    DAI: [
      { key: 'aToken', value: 'ADAI', type: AssetType.Token },
      { key: 'MaxLoanAmount', value: 25000, type: AssetType.Amount },
      { key: 'MaxTVL', value: 10000000, type: AssetType.Amount },
      { key: 'MaxDebtRatio', value: 5000, type: AssetType.Uint },
    ],
    USDC: [{ key: 'aToken', value: 'AUSDC', type: AssetType.Token }],
    WETH: [{ key: 'aToken', value: 'AETH', type: AssetType.Token }],
  },
}
