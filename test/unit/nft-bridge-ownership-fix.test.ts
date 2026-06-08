import chai from 'chai'
import hre from 'hardhat'
import { contracts, ethers, getNamedSigner } from 'hardhat'

import { ITellerDiamond } from '../../types/typechain'
import { NULL_ADDRESS } from '../../utils/consts'
import { evmSnapshot, evmRevert, impersonateAddress } from '../helpers/misc'

chai.should()

describe('NFT Bridge Ownership Fix', () => {
  // Diamond and NFT addresses on mainnet
  const DIAMOND_ADDRESS = '0xc14D994fe7C5858c93936cc3bD42bb9467d6fB2C'
  const TELLER_NFT_V1 = '0x2ceB85a2402C94305526ab108e7597a102D6C175'

  // Old (buggy) and new (fixed) facet addresses deployed on mainnet
  const OLD_FACET = '0x9b8E7C9C750889df12fab6BD40AF79284FFE4665'
  const NEW_FACET = '0x8bae586f7899df13d6bce0831971b82b53af974f'

  // The 3 selectors from NFTMainnetBridgingToPolygonFacet
  const SELECTORS = [
    '0x06eb842b', // bridgeNFTsV1
    '0x5de4073b', // bridgeNFTsV2
    '0x0ba1d008', // initNFTBridge
  ]

  // Fork at a block after the upgrade tx (0x8f6d6b...at block 25094012)
  const POST_UPGRADE_BLOCK = 25094100

  // Use an existing V1 NFT owned by a regular user (not the diamond or V2 contract)
  // Token 3 is owned by 0xD62e... at the post-upgrade block
  const EXISTING_TOKEN_ID = 3

  let diamond: ITellerDiamond
  let baseSnapshotId: string

  /**
   * Helper: diamondCut to replace the 3 bridge selectors with a given facet address.
   */
  async function replaceFacet(facetAddress: string): Promise<void> {
    const ownershipFacet = await ethers.getContractAt(
      'IERC173',
      DIAMOND_ADDRESS
    )
    const ownerAddress = await ownershipFacet.owner()
    const ownerSigner = await impersonateAddress(ownerAddress)

    const funder = await getNamedSigner('deployer')
    await funder.sendTransaction({
      to: ownerAddress,
      value: ethers.parseEther('1'),
    })

    const diamondAsOwner = await contracts.get<ITellerDiamond>(
      'TellerDiamond',
      { at: DIAMOND_ADDRESS, from: ownerSigner }
    )

    await diamondAsOwner.diamondCut(
      [
        {
          action: 1, // Replace
          facetAddress,
          functionSelectors: SELECTORS,
        },
      ],
      NULL_ADDRESS,
      '0x'
    )
  }

  before(async () => {
    // Re-fork mainnet at a block after the upgrade so both facet addresses have code
    await hre.network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.ALCHEMY_MAINNET_KEY,
            blockNumber: POST_UPGRADE_BLOCK,
          },
        },
      ],
    })

    diamond = await contracts.get<ITellerDiamond>('TellerDiamond', {
      at: DIAMOND_ADDRESS,
    })

    // Transfer an existing V1 NFT from its current owner to borrower
    const nft = await ethers.getContractAt('TellerNFT', TELLER_NFT_V1)
    const borrower = await getNamedSigner('borrower')
    const borrowerAddr = await borrower.getAddress()

    // Check if the token owner is still the same at this block
    const currentOwner = await nft.ownerOf(EXISTING_TOKEN_ID)
    const ownerSigner = await impersonateAddress(currentOwner)

    const funder = await getNamedSigner('deployer')
    await funder.sendTransaction({
      to: currentOwner,
      value: ethers.parseEther('1'),
    })
    await nft
      .connect(ownerSigner)
      .transferFrom(currentOwner, borrowerAddr, EXISTING_TOKEN_ID)

    // Snapshot after transfer — both tests revert to this state
    baseSnapshotId = await evmSnapshot()
  })

  afterEach(async () => {
    await evmRevert(baseSnapshotId)
    baseSnapshotId = await evmSnapshot()
  })

  // At this fork block, the NEW facet is active (upgrade already happened).
  it('NEW facet (fix): attacker calling bridgeNFTsV1 for NFT they do not own reverts', async () => {
    const attacker = await getNamedSigner('attacker')
    const tokenId = BigInt(EXISTING_TOKEN_ID)

    const diamondAsAttacker = await contracts.get<ITellerDiamond>(
      'TellerDiamond',
      { at: DIAMOND_ADDRESS, from: attacker }
    )

    // With the fix, the else branch has `require(ownerOf == msg.sender)`
    // which should revert for the attacker
    await diamondAsAttacker
      .bridgeNFTsV1(tokenId)
      .then((tx) => tx.wait())
      .should.be.reverted
  })

  // Swap back to OLD facet to prove the bug existed.
  it('OLD facet (bug): attacker can call bridgeNFTsV1 without ownership revert', async () => {
    // Replace the current (fixed) facet with the OLD (buggy) facet
    await replaceFacet(OLD_FACET)

    const attacker = await getNamedSigner('attacker')
    const tokenId = BigInt(EXISTING_TOKEN_ID)

    const diamondAsAttacker = await contracts.get<ITellerDiamond>(
      'TellerDiamond',
      { at: DIAMOND_ADDRESS, from: attacker }
    )

    // With the buggy else-if, ownership is NOT checked — the branch is skipped.
    // The call may revert in the migrator delegatecall, but NOT with an
    // ownership error.
    let reverted = false
    let revertReason = ''
    try {
      await diamondAsAttacker.bridgeNFTsV1(tokenId).then((tx) => tx.wait())
    } catch (e: any) {
      reverted = true
      revertReason = e.message || ''
    }

    if (reverted) {
      // The revert should NOT mention ownership — the bug skips that check
      revertReason.should.not.include(
        'ERC721: transfer from incorrect owner',
        'Old facet should not revert on ownership'
      )
    }
  })
})
