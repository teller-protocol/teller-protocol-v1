import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { getMarkets, isEtheremNetwork } from '../../config'
import { Address } from '../../types/custom/config-types'
import { ERC20, ITellerDiamond, TellerNFT } from '../../types/typechain'

chai.should()
chai.use(solidity)

const { network, deployments, getNamedSigner, contracts, tokens } = hre

// Only run this test if we are testing Ethereum mainnet or its testnet
if (isEtheremNetwork(network)) {
  describe('Claiming Alpha Interest', () => {
    const market = getMarkets(hre.network).find((m) => m.lendingToken === 'DAI')
    if (!market) throw Error('DAI market not found')

    let deployer: Signer
    let diamond: ITellerDiamond
    let nft: TellerNFT
    let tToken: any //TTokenV2Alpha
    let lendingToken: ERC20
    let staker: Address

    before(async () => {
      await deployments.fixture('protocol', {
        keepExistingDeployments: true,
      })

      deployer = await getNamedSigner('deployer')
      diamond = await contracts.get('TellerDiamond')
      nft = await contracts.get('TellerNFT')
      lendingToken = await tokens.get(market.lendingToken)
      tToken = await contracts.get('TToken_V2_Alpha', {
        at: await diamond.getTTokenFor(lendingToken.address),
      })
    })

    it('Should not be able to mark the end of alpha as not deployer', async () => {
      const rando = await getNamedSigner('lender')
      await tToken
        .connect(rando)
        .markEndOfAlpha()
        .should.be.revertedWith('AccessControl: not authorized')
    })

    it('Should be able to mark the end of alpha as the deployer', async () => {
      await tToken.connect(deployer).markEndOfAlpha().should.be.fulfilled
    })

    it('Should not be able to mark the end of alpha twice', async () => {
      await tToken
        .connect(deployer)
        .markEndOfAlpha()
        .should.be.revertedWith('Teller: alpha already ended')
    })

    it('Should have claimable interest percentage for a user that staked their NFTs', async () => {
      const filter = nft.filters.Transfer(null, diamond.address, null)
      const [event] = await nft.queryFilter(filter)
      staker = event.args.from

      const claimableInterestPercent =
        await diamond.getClaimableInterestPercent(staker)
      claimableInterestPercent.should.be.greaterThan(
        0,
        'First NFT staker does not have claimable interest '
      )
    })

    it('Should not be able to claim 0% proportional interest', async () => {
      const { signer } = await hre.evm.impersonate(staker)

      await tToken
        .connect(deployer)
        .claimAlphaInterest(await signer.getAddress(), 0)
        .should.be.revertedWith('Teller: interest percent cannot be 0')
    })

    it('Should be able to claim interest from alpha staking', async () => {
      const { signer } = await hre.evm.impersonate(staker)

      const balanceBefore = await lendingToken.balanceOf(staker)

      await diamond.connect(signer).claimNFTInterest(lendingToken.address)

      const balanceAfter = await lendingToken.balanceOf(staker)

      balanceAfter
        .gt(balanceBefore)
        .should.eql(true, 'NFT staker did not receive any interest')
    })

    it('Should not be able to claim interest twice', async () => {
      const { signer } = await hre.evm.impersonate(staker)

      await diamond
        .connect(signer)
        .claimNFTInterest(lendingToken.address)
        .should.be.revertedWith('Teller: interest already claimed')
    })
  })
}
