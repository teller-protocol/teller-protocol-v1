import chai, { expect } from 'chai'
import hre, { artifacts, contracts, ethers, getNamedSigner } from 'hardhat'
import { Contract, Signer } from 'ethers'

import { NULL_ADDRESS } from '../../utils/consts'
import { evmRevert, evmSnapshot, impersonateAddress } from '../helpers/misc'

chai.should()

/**
 * Regression test for audit finding C-1.
 *
 * The `initializer` modifier never set `initialized = true`, so the
 * NFTDistributor diamond's `initialize(address,address)` could be called
 * repeatedly by anyone — overwriting the NFT pointer and granting the caller
 * the ADMIN role.
 *
 * These tests fork mainnet and:
 *   1. Demonstrate the bug against the current on-chain facet.
 *   2. Prove that after replacing the facet with the fixed build, the first
 *      `initialize()` locks the diamond and any subsequent call reverts.
 *   3. Prove the atomic upgrade path used by the
 *      `propose-fix-nft-distributor-initializer` task (replace + init in a
 *      single diamondCut) locks the diamond immediately.
 */
describe('NFTDistributor Initializer Fix (audit C-1)', () => {
  const DISTRIBUTOR_ADDRESS = '0x058F447199025e9ACF52E4A1473f4Ad9cC44D299'
  const FACET_NAME = 'ent_initialize_NFTDistributor_v1'

  // Minimal ABI — `initialize` is not exposed on ITellerNFTDistributor.
  const INIT_ABI = [
    'function initialize(address _nft, address admin)',
    'function nft() view returns (address)',
  ]

  // Storage slot of the `initialized` bool:
  //   keccak256(abi.encode("teller_protocol.context.initializable.v1"))
  // The struct's single bool sits at offset 0, so it occupies the slot itself.
  const INITIALIZED_SLOT = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['string'],
      ['teller_protocol.context.initializable.v1']
    )
  )

  let ownerSigner: Signer
  let ownerAddress: string
  let currentNft: string
  let baseSnapshotId: string

  const initializeSelector = (): string =>
    new ethers.Interface(INIT_ABI).getFunction('initialize')!.selector

  const distAs = (signer: Signer): Contract =>
    new ethers.Contract(DISTRIBUTOR_ADDRESS, INIT_ABI, signer)

  // Force the `initialized` flag to a known value so the test does not depend
  // on the live on-chain state.
  const setInitialized = async (value: boolean): Promise<void> => {
    await hre.network.provider.request({
      method: 'hardhat_setStorageAt',
      params: [
        DISTRIBUTOR_ADDRESS,
        INITIALIZED_SLOT,
        ethers.zeroPadValue(value ? '0x01' : '0x00', 32),
      ],
    })
  }

  const deployFixedFacet = async (): Promise<string> => {
    const art = await artifacts.readArtifact(FACET_NAME)
    const deployer = await getNamedSigner('deployer')
    const factory = new ethers.ContractFactory(art.abi, art.bytecode, deployer)
    const facet = await factory.deploy()
    await facet.waitForDeployment()
    return await facet.getAddress()
  }

  // Replace the `initialize` selector with `facetAddress`. When `withInit` is
  // set, run initialize(currentNft, owner) atomically in the same cut.
  const replaceInitializeFacet = async (
    facetAddress: string,
    withInit: boolean
  ): Promise<void> => {
    const diamondCut = await ethers.getContractAt(
      'IDiamondCut',
      DISTRIBUTOR_ADDRESS,
      ownerSigner
    )

    let init = NULL_ADDRESS
    let calldata = '0x'
    if (withInit) {
      init = facetAddress
      calldata = new ethers.Interface(INIT_ABI).encodeFunctionData(
        'initialize',
        [currentNft, ownerAddress]
      )
    }

    await diamondCut
      .diamondCut(
        [{ action: 1, facetAddress, functionSelectors: [initializeSelector()] }],
        init,
        calldata
      )
      .then((tx) => tx.wait())
  }

  before(async () => {
    // Impersonate the diamond owner so we can perform the diamondCut.
    const ownership = await ethers.getContractAt('IERC173', DISTRIBUTOR_ADDRESS)
    ownerAddress = await ownership.owner()
    ownerSigner = await impersonateAddress(ownerAddress)

    const funder = await getNamedSigner('deployer')
    await funder.sendTransaction({
      to: ownerAddress,
      value: ethers.parseEther('1'),
    })

    // Preserve the current NFT pointer for the locking init args.
    const distReader = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      INIT_ABI,
      ethers.provider
    )
    currentNft = await distReader.nft()

    baseSnapshotId = await evmSnapshot()
  })

  afterEach(async () => {
    await evmRevert(baseSnapshotId)
    baseSnapshotId = await evmSnapshot()
  })

  it('BUG: current on-chain facet lets initialize() be called repeatedly', async () => {
    await setInitialized(false)

    const attacker = await getNamedSigner('attacker')
    const attackerAddr = await attacker.getAddress()
    const dist = distAs(attacker)

    // First call succeeds.
    await dist.initialize(currentNft, attackerAddr).then((tx) => tx.wait())

    // Second call ALSO succeeds — the buggy modifier never set the flag, so
    // anyone can re-initialize and seize the ADMIN role.
    let secondCallReverted = false
    try {
      await dist.initialize(currentNft, attackerAddr).then((tx) => tx.wait())
    } catch {
      secondCallReverted = true
    }
    expect(secondCallReverted, 'second initialize() should NOT revert with the buggy facet').to
      .be.false
  })

  it('FIX: after replacing the facet, the first initialize() locks and a second reverts', async () => {
    await setInitialized(false)

    const fixedFacet = await deployFixedFacet()
    await replaceInitializeFacet(fixedFacet, /* withInit */ false)

    const dist = distAs(ownerSigner)

    // First call succeeds and now flips initialized = true.
    await dist.initialize(currentNft, ownerAddress).then((tx) => tx.wait())

    // Second call must revert with the modifier's guard.
    let revertReason = ''
    try {
      await dist.initialize(currentNft, ownerAddress).then((tx) => tx.wait())
    } catch (e: any) {
      revertReason = e.message || ''
    }
    revertReason.should.include('Teller: already initialized')
  })

  it('FIX (atomic upgrade path): replace + init in one diamondCut locks immediately', async () => {
    await setInitialized(false)

    const fixedFacet = await deployFixedFacet()
    // Mirrors the propose-fix-nft-distributor-initializer task: the cut runs
    // initialize() via _init/_calldata, locking the diamond in the same tx.
    await replaceInitializeFacet(fixedFacet, /* withInit */ true)

    const dist = distAs(ownerSigner)

    // The cut already locked it — any further initialize() reverts.
    let revertReason = ''
    try {
      await dist.initialize(currentNft, ownerAddress).then((tx) => tx.wait())
    } catch (e: any) {
      revertReason = e.message || ''
    }
    revertReason.should.include('Teller: already initialized')
  })
})
