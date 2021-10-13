import { Tokens } from '../types/custom/config-types'

const mainnetDappAddresses: Tokens = {
  aaveLendingPoolAddressProvider: '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5',
  aaveLendingPool: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
  aaveStakeTokenAddress: '0x4da27a545c0c5b758a6ba100e3a049001de870f5',
  aaveIncentivesControllerAddress: '0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5',
  sushiswapV2RouterAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  uniswapV2RouterAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  compoundComptrollerAddress: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
}

const polygonDappAddresses: Tokens = {
  aaveLendingPoolAddressProvider: '0xd05e3E715d945B59290df0ae8eF85c1BdB684744',
  aaveLendingPool: '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf',
  aaveRewardTokenAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  aaveIncentivesControllerAddress: '0x357D51124f59836DeD84c8a1730D72B749d8BC23',
  sushiswapV2RouterAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  uniswapV2RouterAddress: '0x0000000000000000000000000000000000000000',
}

export const dapps: Record<string, Tokens> = {
  mainnet: mainnetDappAddresses,
  kovan: mainnetDappAddresses,
  rinkeby: mainnetDappAddresses,
  ropsten: mainnetDappAddresses,
  polygon: polygonDappAddresses,
  polygon_mumbai: polygonDappAddresses,
  hardhat: polygonDappAddresses,
}
