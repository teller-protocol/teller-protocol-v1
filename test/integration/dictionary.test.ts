import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { Signer } from 'ethers'
import hre, { getNamedAccounts } from 'hardhat'

import { getMarkets, getNFT } from '../../config'
import { generateMerkleDistribution } from '../../scripts/merkle/root'
import { claimNFT, getPlatformSetting } from '../../tasks'
import { Market } from '../../types/custom/config-types'
import {
  DistributorEvents,
  ITellerDiamond,
  ITellerNFT,
  ITellerNFTDistributor,
  TellerNFT,
} from '../../types/typechain'
import { TellerNFTDictionary } from '../../types/typechain/TellerNFTDictionary'

/*
Error: cannot find artifact "TellerNFTDistributor"

https://github.com/wighawag/hardhat-deploy/blob/master/src/DeploymentsManager.ts

need to deploy artifact files ?? files in folder missing ? 

*/

chai.should()
chai.use(solidity)

const { getNamedSigner, contracts, tokens, ethers, evm, toBN } = hre

describe('NFT Dictionary', () => {
  getMarkets(hre.network).forEach(testLoans)

  function testLoans(market: Market): void {
    let deployer: Signer
    let diamond: ITellerDiamond

    before(async () => {
      //this is critical and make SURE the tags are not misspelled [markets vs market]
      await hre.deployments.fixture(['nft', 'markets'], {
        keepExistingDeployments: true,
      })

      diamond = await contracts.get('TellerDiamond')

      deployer = await getNamedSigner('deployer')
    })
    describe('Dictionary test', () => {
      beforeEach(async () => {
        // Advance time
        const { value: rateLimit } = await getPlatformSetting(
          'RequestLoanTermsRateLimit',
          hre
        )
        await evm.advanceTime(rateLimit)
      })

      it('should be able to claim a token and add dictionary data', async () => {
        const { borrower, lender } = await getNamedAccounts()

        const customMerkleTrees = [
          {
            tierIndex: 0,
            balances: [
              {
                address: borrower,
                count: 2,
              },
              {
                address: lender,
                count: 3,
              },
            ],
          },
          {
            tierIndex: 1,
            balances: [
              {
                address: borrower,
                count: 2,
              },
              {
                address: lender,
                count: 3,
              },
            ],
          },
          {
            tierIndex: 2,
            balances: [
              {
                address: borrower,
                count: 2,
              },
              {
                address: lender,
                count: 3,
              },
            ],
          },
          {
            tierIndex: 3,
            balances: [
              {
                address: borrower,
                count: 2,
              },
              {
                address: lender,
                count: 3,
              },
            ],
          },
        ]

        //generate the merkle root and stuff it in the distributor

        const nftDistributor = await contracts.get<ITellerNFTDistributor>(
          'TellerNFTDistributor'
        )

        const existingMerkles = await nftDistributor.getMerkleRoots()

        for (
          let merkleIndex = 0;
          merkleIndex < customMerkleTrees.length;
          merkleIndex++
        ) {
          const merkleData = customMerkleTrees[merkleIndex]

          const { tierIndex, balances } = merkleData

          const info = generateMerkleDistribution(tierIndex, balances)

          await nftDistributor
            .connect(deployer)
            .addMerkle(info.tierIndex, info.merkleRoot)
            .then(({ wait }) => wait())

          // Claim user's NFTs
          await nftDistributor
            .connect(deployer)
            .claim(borrower, [
              {
                merkleIndex: merkleIndex + existingMerkles.length,
                nodeIndex: info.claims[borrower].index,
                amount: info.claims[borrower].amount,
                merkleProof: info.claims[borrower].proof,
              },
            ])
            .then(({ wait }) => wait())

          const nft = await contracts.get<ITellerNFT>('TellerNFT')

          const ownedTokens = await nft.getOwnedTokens(borrower)
          const lastOwnedTokenId = ownedTokens[ownedTokens.length - 1]

          const nftDictionary = await contracts.get<TellerNFTDictionary>(
            'TellerNFTDictionary'
          )

          const tokenTier = await nftDictionary.getTokenTierIndex(
            lastOwnedTokenId
          )
          tokenTier.should.equal(merkleData.tierIndex)
        }
      })
    })
  }
})
