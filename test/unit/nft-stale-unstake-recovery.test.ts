import chai from 'chai'
import hre from 'hardhat'
import { contracts, ethers, getNamedSigner } from 'hardhat'

import { ITellerDiamond } from '../../types/typechain'
import { NULL_ADDRESS } from '../../utils/consts'
import { evmSnapshot, evmRevert, impersonateAddress } from '../helpers/misc'

chai.should()

/**
 * On 12 May 2026 the `bridgeNFTsV1` else-if fall-through was used to migrate
 * and bridge away 689 V1 NFTs that the diamond held on behalf of 352 stakers.
 * The V1 NFTs are now locked in the V2 contract, which has no way to send an
 * ERC721 back out, but the victims' `stakedNFTs` records were never cleared.
 *
 * `unstakeNFTs` used to call the migrator unconditionally, so those records
 * are unredeemable: the migrator tries to move a V1 NFT the diamond no longer
 * owns and the whole call reverts. This pins that behaviour and the fix.
 */
describe('Stale V1 stake recovery', () => {
  const DIAMOND = '0xc14D994fe7C5858c93936cc3bD42bb9467d6fB2C'
  const V1 = '0x2ceB85a2402C94305526ab108e7597a102D6C175'
  const V2 = '0x8f9bbbB0282699921372A134b63799a48c7d17FC'
  const MIGRATOR = '0xd02B19efd677A613972263186e958B262a8952F6'

  // A staker whose NFT was taken on 12 May 2026 and whose record still stands.
  const VICTIM = '0x000f4432a40560bBFf1b581a8b7AdEd8dab80026'
  const VICTIM_V1_ID = 2145n
  const VICTIM_V2_ID = 10003n

  const FORK_BLOCK = 26030000

  let diamond: ITellerDiamond
  let snapshotId: string

  before(async () => {
    await hre.network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.ALCHEMY_MAINNET_KEY,
            blockNumber: FORK_BLOCK,
          },
        },
      ],
    })
    diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
      at: DIAMOND,
    })
    snapshotId = await evmSnapshot()
  })

  afterEach(async () => {
    await evmRevert(snapshotId)
    snapshotId = await evmSnapshot()
  })

  const upgradeFacet = async (): Promise<string> => {
    const factory = await ethers.getContractFactory('MainnetNFTFacet')
    const facet = await factory.deploy(V2, MIGRATOR)
    await facet.waitForDeployment()
    const facetAddress = await facet.getAddress()

    const loupe = await ethers.getContractAt('IDiamondLoupe', DIAMOND)
    const iface = factory.interface
    const selectors = iface.fragments
      .filter((f: any) => f.type === 'function')
      .map((f: any) => f.selector)

    // Split into selectors the diamond already routes (Replace) and new ones (Add)
    const replace: string[] = []
    const add: string[] = []
    for (const s of selectors) {
      const current = await loupe.facetAddress(s)
      ;(current === NULL_ADDRESS ? add : replace).push(s)
    }

    const ownership = await ethers.getContractAt('IERC173', DIAMOND)
    const ownerSigner = await impersonateAddress(await ownership.owner())
    const funder = await getNamedSigner('deployer')
    await funder.sendTransaction({
      to: await ownerSigner.getAddress(),
      value: ethers.parseEther('1'),
    })
    const diamondAsOwner = await contracts.get<ITellerDiamond>(
      'TellerDiamond',
      {
        at: DIAMOND,
        from: ownerSigner,
      }
    )

    const cut: any[] = []
    if (replace.length)
      cut.push({ action: 1, facetAddress, functionSelectors: replace })
    if (add.length)
      cut.push({ action: 0, facetAddress, functionSelectors: add })
    await diamondAsOwner.diamondCut(cut, NULL_ADDRESS, '0x')

    return facetAddress
  }

  it('the diamond no longer holds any V1 NFT, so migration can never succeed', async () => {
    const v1 = await ethers.getContractAt('TellerNFT', V1)
    const balance = await v1.balanceOf(DIAMOND)
    balance.should.equal(0n)
    // ...yet the victim's staking record still stands
    const staked = await diamond.getStakedNFTs(VICTIM)
    staked
      .map((s: bigint) => s.toString())
      .should.include(VICTIM_V1_ID.toString())
  })

  it('BEFORE the fix: the victim cannot unstake', async () => {
    const victim = await impersonateAddress(VICTIM)
    const funder = await getNamedSigner('deployer')
    await funder.sendTransaction({
      to: VICTIM,
      value: ethers.parseEther('1'),
    })
    const asVictim = await contracts.get<ITellerDiamond>('TellerDiamond', {
      at: DIAMOND,
      from: victim,
    })
    await asVictim
      .unstakeNFTs([VICTIM_V1_ID])
      .should.be.revertedWith('Teller: Migration unsuccessful')
  })

  it('AFTER the fix: the victim unstakes and is settled in V2', async () => {
    await upgradeFacet()

    const victim = await impersonateAddress(VICTIM)
    const funder = await getNamedSigner('deployer')
    await funder.sendTransaction({
      to: VICTIM,
      value: ethers.parseEther('1'),
    })
    const asVictim = await contracts.get<ITellerDiamond>('TellerDiamond', {
      at: DIAMOND,
      from: victim,
    })
    const v2 = await ethers.getContractAt('TellerNFT_V2', V2)

    const before = await v2.balanceOf(VICTIM, VICTIM_V2_ID)
    await asVictim.unstakeNFTs([VICTIM_V1_ID]).then((tx: any) => tx.wait())
    const after = await v2.balanceOf(VICTIM, VICTIM_V2_ID)

    ;(after - before).should.equal(1n)
    // the stale record is gone
    const staked = await diamond.getStakedNFTs(VICTIM)
    staked.length.should.equal(0)
  })

  it('AFTER the fix: previewUnstakeNFTs reports settlement from inventory', async () => {
    await upgradeFacet()

    const [v1IDs, v2IDs, settlements] = await diamond.previewUnstakeNFTs(VICTIM)
    v1IDs[0].should.equal(VICTIM_V1_ID)
    v2IDs[0].should.equal(VICTIM_V2_ID)
    // 0 = Unavailable, 1 = ViaMigration, 2 = FromInventory
    settlements[0].should.equal(2)
  })
})
