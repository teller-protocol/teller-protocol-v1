import { MaticPOSClient } from '@maticnetwork/maticjs'
import rootChainManagerAbi from '@maticnetwork/meta/network/mainnet/v1/artifacts/pos/RootChainManager.json'
import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, Contract, Signer } from 'ethers'
import hre, { contracts, ethers, getNamedSigner } from 'hardhat'

import { getMarkets } from '../../config'
import { Market } from '../../types/custom/config-types'
import {
  ITellerDiamond,
  TellerNFT,
  TellerNFTDictionary,
  TellerNFTV2,
} from '../../types/typechain'
import { DUMMY_ADDRESS, NULL_ADDRESS } from '../../utils/consts'

chai.should()
chai.use(solidity)

const maticPOSClient = new MaticPOSClient({
  network: 'testnet',
  version: 'mumbai',
  parentProvider:
    'https://mainnet.infura.io/v3/514733758a4e4c1da27f5e2d61c97ee4',
  maticProvider: 'https://rpc-mainnet.maticvigil.com',
})

describe('Bridging Assets to Polygon', () => {
  getMarkets(hre.network).forEach(testBridging)
  function testBridging(markets: Market): void {
    // define needed variablez
    let deployer: Signer
    let diamond: ITellerDiamond
    let rootToken: TellerNFT
    let rootTokenV2: TellerNFTV2
    let tellerDictionary: TellerNFTDictionary
    let borrower: string
    let borrowerSigner: Signer
    let ownedNFTs: BigNumber[]
    let rootChainManager: Contract

    before(async () => {
      await hre.deployments.fixture(['protocol'], {
        keepExistingDeployments: true,
      })

      // declare variables
      rootToken = await contracts.get('TellerNFT')
      rootTokenV2 = await contracts.get('TellerNFT_V2')
      tellerDictionary = await contracts.get('TellerNFTDictionary')
      diamond = await contracts.get('TellerDiamond')

      deployer = await getNamedSigner('deployer')

      const filter = rootToken.filters.Transfer(null, diamond.address, null)
      const [event] = await rootToken.queryFilter(filter)
      borrower = event.args.from
      borrowerSigner = (await hre.evm.impersonate(borrower)).signer

      // get owned nfts of borrower
      ownedNFTs = await rootToken
        .getOwnedTokens(borrower)
        .then((arr) => (arr.length > 2 ? arr.slice(0, 2) : arr))

      rootChainManager = new ethers.Contract(
        '0xD4888faB8bd39A663B63161F5eE1Eae31a25B653',
        rootChainManagerAbi.abi,
        borrowerSigner
      )
    })

    describe('Calling mapped contracts', () => {
      it('approves spending of tokens', async () => {
        const erc721Predicate = '0x74D83801586E9D3C4dc45FfCD30B54eA9C88cf9b'
        for (let i = 0; i < ownedNFTs.length; i++) {
          await rootToken
            .connect(borrowerSigner)
            .approve(erc721Predicate, ownedNFTs[i])

          const approved = await rootToken
            .connect(borrower)
            .getApproved(ownedNFTs[i])
          erc721Predicate.should.equal(approved)
        }
      })

      it('bridges our NFTs', async () => {
        // migrate and bridge all of our nfts
        await diamond.connect(borrowerSigner).bridgeNFTsV1(ownedNFTs)
        // add rest of the test here
      })

      it.skip('stakes the NFTs on polygon', async () => {
        // encode data
        const stakedNFTs = await diamond.getStakedNFTs(borrower)
        const depositData = ethers.utils.defaultAbiCoder.encode(
          ['uint256[]'],
          [stakedNFTs]
        )
        // stake the nfts on polygon
        // await childToken.connect(deployer).deposit(borrower, depositData)
      })

      it.skip('unstakes NFTs on polygon and burns them', async () => {
        // const burnTx = await childToken
        //   .connect(borrowerSigner)
        //   .withdrawBatch(ownedNFTs)
        // // from matic docs
        // const exitCallData = await maticPOSClient.exitERC721(
        //   JSON.stringify(burnTx),
        //   {
        //     from: diamond.address,
        //     encodeAbi: true,
        //   }
        // )
        // // exit call data
        // await diamond.connect(borrowerSigner).exit(exitCallData)
      })

      it.skip('stakes the NFTs on ethereum', async () => {
        // await diamond.connect(borrowerSigner).stakeNFTs(ownedNFTs)
        // const stakedNFTs = await diamond.getStakedNFTs(borrower)
        // for (let i = 0; i < ownedNFTs.length; i++) {
        //   ownedNFTs[i].should.equal(stakedNFTs[i])
        // }
      })
    })
    describe('Mock tests', () => {
      describe('stake, unstake, deposit to polygon', () => {
        it('stakes NFTs on behalf of the user', async () => {
          // approve the user's tokens to transfer to the diamond (Stake)
          await rootToken
            .connect(borrowerSigner)
            .setApprovalForAll(diamond.address, true)

          // stake the user's tokens
          await diamond.connect(borrowerSigner).stakeNFTs(ownedNFTs)

          // get the staked NFTs
          const stakedNFTs = await diamond.getStakedNFTs(borrower)
          for (let i = 0; i < ownedNFTs.length; i++) {
            ownedNFTs[i].should.equal(stakedNFTs[i])
          }
        })

        it('tier data matches between v1 and v2', async () => {
          // we use filter to get the Event that will be emitted when we mint the token
          const filter = rootToken.filters.Transfer(
            NULL_ADDRESS,
            DUMMY_ADDRESS,
            null
          )

          // array of v1 tiers
          const arrayOfTiers = [0, 1, 2, 3, 8, 9, 10, 11]

          // mint the token on the tier index, then retrieve the emitted event using transaction's
          // block hash
          const mintToken = async (tierIndex: number): Promise<void> => {
            const receipt = await rootToken
              .connect(deployer)
              .mint(tierIndex, DUMMY_ADDRESS)
              .then(({ wait }) => wait())
            const [event] = await rootToken.queryFilter(
              filter,
              receipt.blockHash
            )

            // set the token tier that we just minted according to the tier index. so, minting 2nd NFT
            // on tier 1 will result in ID = 20001
            await tellerDictionary
              .connect(deployer)
              .setTokenTierForTokenId(event.args.tokenId, tierIndex)
          }

          // mint 3 tokens on every tier for the DUMMY_ADDRESS
          for (let i = 0; i < arrayOfTiers.length; i++) {
            await mintToken(arrayOfTiers[i])
            await mintToken(arrayOfTiers[i])
            await mintToken(arrayOfTiers[i])
          }

          // get our token ids and loop through it. for every loop, we check if the V1TokenURI
          // is = to the URI of our V2 tokenId
          const tokenIds = await rootToken.getOwnedTokens(DUMMY_ADDRESS)
          for (let i = 0; i < tokenIds.length; i++) {
            const newTokenId = await rootTokenV2.convertV1TokenId(tokenIds[i])

            const v1TokenURI = await rootToken.tokenURI(tokenIds[i])
            const v2TokenURI = await rootTokenV2.uri(newTokenId)
            v1TokenURI.should.equal(v2TokenURI)

            const v1BaseLoanSize = await tellerDictionary.tokenBaseLoanSize(
              tokenIds[i]
            )
            const v2BaseLoanSize = await rootTokenV2.tokenBaseLoanSize(
              newTokenId
            )
            v1BaseLoanSize.should.eql(v2BaseLoanSize)

            const v1ContributionSize =
              await tellerDictionary.tokenContributionSize(tokenIds[i])
            const v2ContributionSize = await rootTokenV2.tokenContributionSize(
              newTokenId
            )
            v1ContributionSize.should.eql(v2ContributionSize)

            const v1ContributionMultiplier =
              await tellerDictionary.tokenContributionMultiplier(tokenIds[i])
            const v2ContributionMultiplier =
              await rootTokenV2.tokenContributionMultiplier(newTokenId)
            ;(v1ContributionMultiplier * 100).should.eql(
              v2ContributionMultiplier
            )
          }
        })

        it('migrates an NFT from V1 to V2', async () => {
          // mint the token, then transfer it to v2
          await rootToken.connect(deployer).mint(0, borrower)
          const [nftId] = await rootToken.getOwnedTokens(borrower)

          // v2 tokens before should = 0
          const v2TokensBefore = await rootTokenV2.getOwnedTokens(borrower)
          v2TokensBefore.length.should.equal(0)

          // v2 tokens after should = 1
          await rootToken
            .connect(borrowerSigner)
            ['safeTransferFrom(address,address,uint256)'](
              borrower,
              rootTokenV2.address,
              nftId
            )
          const v2TokensAfter = await rootTokenV2.getOwnedTokens(borrower)
          v2TokensAfter.length.should.equal(1)
        })
      })
    })
  }
})
