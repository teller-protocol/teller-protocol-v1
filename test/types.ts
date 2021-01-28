export type EnvConfig = {
  networkConfig: {
    compound: Record<string, string>
    tokens: Record<string, string>
    chainlink: Record<
      string,
      {
        address: string
        inversed: boolean
        collateralDecimals: number
        responseDecimals: number
        baseTokenName: string
        quoteTokenName: string
      }
    >
    platformSettings: Record<
      string,
      {
        processOnDeployment: boolean
        value: number | string
        min: number | string
        max: number | string
      }
    >
    assetSettings: Record<
      string,
      {
        cToken: string
        maxLoanAmount: number
        maxTVLAmount: number
      }
    >
    atms: Record<
      string,
      {
        name: string
        token: {
          name: string
          symbol: string
          decimals: number
          maxCap: number
          maxVestingPerWallet: number
        }
        tlrInitialReward: number
        maxDebtRatio: number
        markets: {
          borrowedToken: string
          collateralToken: string
        }[]
      }
    >
    signers: Record<string, string>
  }
}
