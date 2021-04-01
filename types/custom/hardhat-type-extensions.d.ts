import 'hardhat/types/config'

declare module 'hardhat/types/config' {
  interface HttpNetworkConfig {
    forkName?: string
  }
  interface HttpNetworkUserConfig {
    forkName?: string
  }
  interface HardhatNetworkConfig {
    forkName?: string
  }
  interface HardhatNetworkUserConfig {
    forkName?: string
  }
}
