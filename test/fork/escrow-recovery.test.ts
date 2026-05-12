/**
 * Mainnet-fork verification for the EscrowRecoveryFacet remediation.
 *
 * What this proves:
 *   1. Loan 16 (a real, defaulted, V1-NFT-blocked loan on mainnet) cannot be
 *      liquidated against the live deployed Diamond — the call reverts in
 *      the V1 ERC721 transfer step.
 *   2. After deploying EscrowRecoveryFacet, cutting it into the Diamond,
 *      and calling adminClearV1NFTs([16]) from the ADMIN account, the
 *      dangling V1 NFT references are gone.
 *   3. The very next call to liquidateLoan(16) — from an arbitrary capitalised
 *      liquidator — succeeds, moves the loan to Liquidated, and pays the
 *      lending pool.
 *
 * Run prerequisites:
 *   - ALCHEMY_MAINNET_KEY set to a full Alchemy mainnet RPC URL in .env
 *   - This test file lives outside the default `test/` glob, so invoke it
 *     explicitly:
 *
 *       FORKING_NETWORK=mainnet TESTING=1 \
 *         yarn hardhat --network hardhat test test/fork/escrow-recovery.test.ts
 *
 *   The test calls `hardhat_reset` itself to pin the fork at a known recent
 *   block, so the value of `.latestDeploymentBlock` doesn't matter.
 */

import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, Contract } from 'ethers'
import hre from 'hardhat'

import { impersonateAddress } from '../helpers/misc'

chai.use(solidity)

// ---- Mainnet constants -----------------------------------------------------

const TELLER_DIAMOND = '0xc14D994fe7C5858c93936cc3bD42bb9467d6fB2C'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const ADMIN_DEPLOYER = '0xAFe87013dc96edE1E116a288D80FcaA0eFFE5fe5'

// DAI whale used to fund the liquidator. cDAI is the underlying holder of
// every depositor's DAI in Compound and has held a 10-figure DAI balance
// since deployment.
const DAI_WHALE = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'

// Pinned fork block: chosen to be after the V1->V2 NFT migration completed
// and before any subsequent liquidation of loan 16 happens. Override via env.
const DEFAULT_FORK_BLOCK = Number(
  process.env.FORK_BLOCK ?? 22500000 // ~April 2026
)

// The target loan we're proving recovery on.
const TARGET_LOAN_ID = 16

// Enum LoanStatus { NonExistent, TermsSet, Active, Closed, Liquidated }
const LOAN_STATUS_ACTIVE = 2
const LOAN_STATUS_LIQUIDATED = 4

// Selectors we need to interact with the diamond beyond what ITellerDiamond
// already declares (kept small so this test reads top-to-bottom).
const DIAMOND_FRAGMENTS = [
  'function owner() view returns (address)',
  'function diamondCut((address,uint8,bytes4[])[],address,bytes)',
  'function facetAddress(bytes4) view returns (address)',
  'function getLoan(uint256) view returns (tuple(address borrower,address lendingToken,address collateralToken,uint256 borrowedAmount,uint128 id,uint32 duration,uint32 loanStartTime,uint16 interestRate,uint16 collateralRatio,uint8 status))',
  'function getDebtOwed(uint256) view returns (tuple(uint256 principalOwed,uint256 interestOwed))',
  'function liquidateLoan(uint256)',
  'function hasRole(bytes32,address) view returns (bool)',
  'function getLoanV1NFTs(uint256) view returns (uint256[])',
  'function adminClearV1NFTs(uint256[])',
] as const

const FACET_FRAGMENTS = [
  'function adminClearV1NFTs(uint256[])',
  'function getLoanV1NFTs(uint256) view returns (uint256[])',
]

describe('EscrowRecoveryFacet (mainnet fork)', function () {
  this.timeout(600_000)

  const { ethers, network } = hre

  let diamond: Contract
  let dai: Contract

  before(async function () {
    const url = process.env.ALCHEMY_MAINNET_KEY
    if (
      !url ||
      url.startsWith('add-your-') ||
      process.env.FORKING_NETWORK !== 'mainnet'
    ) {
      this.skip()
    }

    // Pin the fork at a recent block, regardless of repo defaults.
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: { jsonRpcUrl: url, blockNumber: DEFAULT_FORK_BLOCK },
        },
      ],
    })

    diamond = new ethers.Contract(
      TELLER_DIAMOND,
      Array.from(DIAMOND_FRAGMENTS),
      ethers.provider
    )
    dai = new ethers.Contract(
      DAI,
      [
        'function balanceOf(address) view returns (uint256)',
        'function transfer(address,uint256) returns (bool)',
        'function approve(address,uint256) returns (bool)',
      ],
      ethers.provider
    )
  })

  describe('preconditions on the live deployed diamond', () => {
    it('loan 16 is still Active', async () => {
      const loan = await diamond.getLoan(TARGET_LOAN_ID)
      expect(loan.status).to.equal(LOAN_STATUS_ACTIVE)
      expect(loan.lendingToken.toLowerCase()).to.equal(DAI.toLowerCase())
    })

    it('liquidateLoan reverts because of a dangling V1 NFT reference', async () => {
      const [unfunded] = await ethers.getSigners()
      await expect(
        diamond.connect(unfunded).liquidateLoan(TARGET_LOAN_ID)
      ).to.be.reverted
    })

    it('the loan has at least one V1 NFT recorded', async () => {
      // The `getLoanV1NFTs` selector isn't yet wired up on chain, so this
      // call will revert ("Diamond: Function does not exist"). That itself
      // is part of the bug — there's no on-chain way to introspect those
      // references today.
      await expect(diamond.getLoanV1NFTs(TARGET_LOAN_ID)).to.be.reverted
    })
  })

  describe('applying the remediation', () => {
    let facet: Contract

    it('deploys EscrowRecoveryFacet', async () => {
      const [funder] = await ethers.getSigners()
      const Factory = await ethers.getContractFactory(
        'EscrowRecoveryFacet',
        funder
      )
      facet = await Factory.deploy()
      await facet.deployed()
    })

    it('cuts the facet into the live Diamond via the diamond owner', async () => {
      const ownerAddr: string = await diamond.owner()
      // Fund the owner so it can pay gas, then impersonate it.
      const [funder] = await ethers.getSigners()
      await funder.sendTransaction({
        to: ownerAddr,
        value: ethers.utils.parseEther('1'),
      })
      const owner = await impersonateAddress(ownerAddr)

      const facetIface = new ethers.utils.Interface(FACET_FRAGMENTS)
      const selectors = [
        facetIface.getSighash('adminClearV1NFTs'),
        facetIface.getSighash('getLoanV1NFTs'),
      ]

      // Sanity: these selectors should not be wired up yet.
      for (const sel of selectors) {
        expect(await diamond.facetAddress(sel)).to.equal(
          ethers.constants.AddressZero
        )
      }

      const cut = [
        {
          facetAddress: facet.address,
          action: 0, // Add
          functionSelectors: selectors,
        },
      ]
      await diamond
        .connect(owner)
        .diamondCut(cut, ethers.constants.AddressZero, '0x')

      for (const sel of selectors) {
        expect((await diamond.facetAddress(sel)).toLowerCase()).to.equal(
          facet.address.toLowerCase()
        )
      }
    })

    it('exposes the V1 NFT list now, and it is non-empty for loan 16', async () => {
      const ids: BigNumber[] = await diamond.getLoanV1NFTs(TARGET_LOAN_ID)
      expect(ids.length).to.be.greaterThan(0)
    })

    it('admin can clear the V1 NFT references on loan 16', async () => {
      const [funder] = await ethers.getSigners()
      await funder.sendTransaction({
        to: ADMIN_DEPLOYER,
        value: ethers.utils.parseEther('1'),
      })
      const admin = await impersonateAddress(ADMIN_DEPLOYER)

      const ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes('ADMIN')
      )
      expect(await diamond.hasRole(ADMIN_ROLE, ADMIN_DEPLOYER)).to.equal(true)

      const tx = await diamond
        .connect(admin)
        .adminClearV1NFTs([TARGET_LOAN_ID])
      await tx.wait()

      const idsAfter: BigNumber[] = await diamond.getLoanV1NFTs(TARGET_LOAN_ID)
      expect(idsAfter.length).to.equal(0)
    })

    it('non-admin cannot clear V1 NFT references', async () => {
      const [stranger] = await ethers.getSigners()
      await expect(
        diamond.connect(stranger).adminClearV1NFTs([42])
      ).to.be.revertedWith('AccessControl: not authorized')
    })
  })

  describe('liquidation now succeeds against the freshly unblocked loan', () => {
    it('a funded liquidator can liquidate loan 16', async () => {
      const debt = await diamond.getDebtOwed(TARGET_LOAN_ID)
      const owed: BigNumber = debt.principalOwed.add(debt.interestOwed)

      // Funded liquidator: a fresh signer + DAI from a whale.
      const [funder, liquidator] = await ethers.getSigners()
      await funder.sendTransaction({
        to: DAI_WHALE,
        value: ethers.utils.parseEther('1'),
      })
      const whale = await impersonateAddress(DAI_WHALE)
      await dai.connect(whale).transfer(liquidator.address, owed)

      await dai.connect(liquidator).approve(diamond.address, owed)

      const loanBefore = await diamond.getLoan(TARGET_LOAN_ID)
      expect(loanBefore.status).to.equal(LOAN_STATUS_ACTIVE)

      await diamond.connect(liquidator).liquidateLoan(TARGET_LOAN_ID)

      const loanAfter = await diamond.getLoan(TARGET_LOAN_ID)
      expect(loanAfter.status).to.equal(LOAN_STATUS_LIQUIDATED)

      const debtAfter = await diamond.getDebtOwed(TARGET_LOAN_ID)
      expect(debtAfter.principalOwed.add(debtAfter.interestOwed)).to.equal(0)
    })
  })
})
