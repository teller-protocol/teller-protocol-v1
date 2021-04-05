import { DeployFunction } from 'hardhat-deploy/types'

const protocol: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  const tellerProtocol = await deployments.diamond.deploy('Diamond', {
    from: deployer,
    facets: [
      'ctx_ERC721_v1',
      'ent_initialize_NFT_v1',
      'ent_mint_NFT_v1',
      'ent_tier_NFT_v1',
      'ext_tier_NFT_v1',
      'ext_token_NFT_v1',
    ],
    owner: deployer,
  })

  console.log(tellerProtocol.address)

  // const chainlinkAggregator = await deployments.save('PriceAggregator_v1', {
  // })
}

export default protocol
protocol.tags = ['protocol']
