import { DeployFunction } from 'hardhat-deploy/types'
import { deployDiamond } from '../utils/deploy-diamond'

const protocol: DeployFunction = async (hre) => {
  const tellerProtocol = await deployDiamond({
    hre,
    name: 'TellerNFT', // NOT A CONTRACT NOT FOR DIAMONDS I THINK
    facets: [
      'ctx_ERC721_v1',
      'ent_initialize_NFT_v1',
      'ent_mint_NFT_v1',
      'ent_tier_NFT_v1',
      'ext_tier_NFT_v1',
      'ext_token_NFT_v1',
    ],
  })

  console.log(tellerProtocol.address, JSON.stringify(tellerProtocol, null, 2))
}

export default protocol
protocol.tags = ['protocol']
