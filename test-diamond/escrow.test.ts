import { Signer } from '@ethersproject/abstract-signer'
import { contracts, deployments, getNamedSigner, network } from 'hardhat'
import { getTokens } from '../config'
import { Tokens } from '../types/custom/config-types'
import { EscrowLogic, EscrowManager, IERC20 } from '../types/typechain'
import { EscrowManager2 } from '../types/typechain/EscrowManager2'

const setup = deployments.createFixture(async () => {
  await deployments.fixture('protocol')
  const { address: teller } = await deployments.get('TellerDiamond')
  const deployer = await getNamedSigner('deployer')

  return {
    deployer,
    teller,
  }
})
describe('EscrowManager', () => {
  let tokens: Tokens
  let deployer: Signer
  let escrowManager: EscrowManager2
  let escrowLogic: EscrowLogic
  let dai: IERC20
  let teller: string

  beforeEach(async () => {
    // Set up
    tokens = getTokens(network)
    ;({ teller, deployer } = await setup())
  })
  it('Can create escrow', async () => {
    const escrowManager = (
      await contracts.get<EscrowManager2>('EscrowManager2', {
        from: deployer,
        at: teller,
      })
    ).connect(deployer)

    const escrowLogic = await deployments.deploy('EscrowLogic', {
      from: await deployer.getAddress(),
    })

    await escrowManager
      .createImplementation('EscrowLogic', escrowLogic.address)
      .then((t) => t.wait())
      .then((r) => console.log(JSON.stringify(r.events, null, 2)))

    // console.log({ mainBeaconAddress })

    const proxyAddress = await escrowManager
      .createProxy('EscrowLogic')
      .then((t) => t.wait())
      .then((r) => r.events?.[0].args?.[0])

    const escrow = await contracts.get<EscrowLogic>('EscrowLogic', {
      from: await deployer.getAddress(),
      at: proxyAddress,
    })

    const res = await escrow.hello()
    res.should.eq('world')
    //   escrowLogic = (
    //     await contracts.get<EscrowLogic>('EscrowLogic', {
    //       from: deployer,
    //       at: teller,
    //     })
    //   ).connect(deployer)
    //   dai = await contracts.get<ERC20>('ERC20', {
    //     from: deployer,
    //     at: tokens.DAI,
    //   })
    //   const tx = await escrowManager.initialize(dai.address)
    //   await tx.wait()
    //   const escrowAddress = await escrowManager.getAssetEscrow(dai.address)
    //   const escrowProxy = await contracts.get<EscrowProxy>('EscrowProxy', {
    //     from: deployer,
    //     at: escrowAddress,
    //   })
    //   await escrowProxy.destroy()
    //   // Should not be destroyed
    //   const daiAssetEscrow = await contracts.get<EscrowLogic>('EscrowLogic', {
    //     at: escrowAddress,
    //     from: deployer,
    //   })
    //   const asset = await daiAssetEscrow.asset()
    //   asset.should.eq(dai.address)
  })
})
