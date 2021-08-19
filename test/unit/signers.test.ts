import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { Signer } from 'ethers'
import {
  contracts,
  deployments,
  getNamedSigner,
  getUnnamedAccounts,
  network,
  tokens,
} from 'hardhat'

import { getMarkets } from '../../config'
import { ERC20, ITellerDiamond } from '../../types/typechain'

chai.should()
chai.use(solidity)

describe('Signers', () => {
  const markets = getMarkets(network)

  let signers: string[]
  let deployer: Signer
  let diamond: ITellerDiamond

  before(async () => {
    const accounts = await getUnnamedAccounts()
    signers = accounts.slice(-2)

    deployer = await getNamedSigner('deployer')
  })

  beforeEach(async () => {
    await deployments.fixture('protocol', {
      keepExistingDeployments: false,
    })

    diamond = await contracts.get('TellerDiamond')
  })

  for (const market of markets) {
    let lendingToken: ERC20

    before(async () => {
      lendingToken = await tokens.get(market.lendingToken)
    })

    describe(`${market.lendingToken} Market`, () => {
      it('Should be able to add new signers', async () => {
        await diamond
          .connect(deployer)
          .addSigners(lendingToken.address, signers)
          .should.emit(diamond, 'SignerAdded')
      })

      it('Should not emit event when adding existing signers', async () => {
        await diamond
          .connect(deployer)
          .addSigners(lendingToken.address, signers)
        await diamond
          .connect(deployer)
          .addSigners(lendingToken.address, signers)
          .should.not.emit(diamond, 'SignerAdded')
      })

      it('Should not be able to add signers as not ADMIN role', async () => {
        const rando = await getNamedSigner('borrower')
        await diamond
          .connect(rando)
          .addSigners(lendingToken.address, signers)
          .should.be.revertedWith('AccessControl: not authorized')
      })

      it('Should be able to remove signers', async () => {
        await diamond
          .connect(deployer)
          .addSigners(lendingToken.address, signers)

        await diamond
          .connect(deployer)
          .removeSigners(lendingToken.address, signers)
          .should.emit(diamond, 'SignerRemoved')
      })

      it('Should not emit event when removing non existing signers', async () => {
        await diamond
          .connect(deployer)
          .removeSigners(lendingToken.address, signers)
          .should.not.emit(diamond, 'SignerAdded')
      })

      it('Should not be able to remove signers as not ADMIN role', async () => {
        await diamond
          .connect(deployer)
          .addSigners(lendingToken.address, signers)

        const rando = await getNamedSigner('borrower')
        await diamond
          .connect(rando)
          .addSigners(lendingToken.address, signers)
          .should.be.revertedWith('AccessControl: not authorized')
      })
    })
  }
})
