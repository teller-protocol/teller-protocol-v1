import 'hardhat/types/config'

declare module 'hardhat/types/config' {
  interface HttpNetworkConfig {
    forkBlockNumber?: number
  }
  interface HttpNetworkUserConfig {
    forkBlockNumber?: number
  }
  interface HardhatNetworkConfig {
    forkBlockNumber?: number
  }
  interface HardhatNetworkUserConfig {
    forkBlockNumber?: number
  }
}
