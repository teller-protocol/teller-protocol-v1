import chai from 'chai'
import { Signer } from 'ethers'
import { contracts, deployments, getNamedSigner } from 'hardhat'
import {
  AssetEscrowFacet,
  AssetEscrowV1,
  LendingFacet,
} from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'
import { solidity } from 'ethereum-waffle'
import { AssetEscrowContext } from '../types/typechain/AssetEscrowContext'
chai.should()
chai.use(solidity)

const setup = deployments.createFixture(async () => {
  await deployments.fixture('protocol')
  const deployer = await getNamedSigner('deployer')
  const from = await deployer.getAddress()
  const { address: teller } = await deployments.get('TellerDiamond')

  return {
    assetEscrow: (
      await contracts.get<AssetEscrowFacet>('AssetEscrowFacet', {
        at: teller,
        from,
      })
    )?.connect(deployer) as AssetEscrowFacet,
    teller,
    deployer,
    from,
  }
})
describe('escrow context test', () => {
  let teller: string
  let deployer: Signer
  let from: string
  let assetEscrow: AssetEscrowFacet

  beforeEach(async () => {
    ;({ assetEscrow, deployer, from, teller } = await setup())
    assetEscrow = await contracts.get<AssetEscrowFacet>('AssetEscrowFacet', {
      from,
      at: teller,
    })
    assetEscrow.connect(deployer)
  })
  it('should deploy', async () => {
    ;(await assetEscrow.getImplementation()).should.eq(NULL_ADDRESS)
    const { address: assetEscrowV1Address } = await deployments.deploy(
      'AssetEscrowV1',
      {
        from,
      }
    )
    const assetEscrowV1 = await contracts.get<AssetEscrowV1>('AssetEscrowV1', {
      at: assetEscrowV1Address,
      from,
    })

    const supportsIERC165 = await assetEscrowV1.supportsInterface('0x01ffc9a7')
    supportsIERC165.should.be.true
  })
})
