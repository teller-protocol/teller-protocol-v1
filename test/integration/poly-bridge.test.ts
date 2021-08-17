import { MaticPOSClient } from '@maticnetwork/maticjs'
import rootChainManagerAbi from '@maticnetwork/meta/network/mainnet/v1/artifacts/pos/RootChainManager.json'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, Contract, Signer } from 'ethers'
import hre, {
  contracts,
  ethers,
  getNamedAccounts,
  getNamedSigner,
} from 'hardhat'

import { getMarkets, isEtheremNetwork } from '../../config'
import { Market } from '../../types/custom/config-types'
import {
  ITellerDiamond,
  MainnetNFTFacet,
  MainnetNFTFacetMock,
  MainnetTellerNFT,
  TellerNFT,
  TellerNFTDictionary,
  TellerNFTV2,
} from '../../types/typechain'
import { DUMMY_ADDRESS, NULL_ADDRESS } from '../../utils/consts'
import { mintNFTV1, mintNFTV2 } from '../helpers/nft'

chai.should()
chai.use(solidity)

const maticPOSClient = new MaticPOSClient({
  network: 'testnet',
  version: 'mumbai',
  parentProvider:
    'https://mainnet.infura.io/v3/514733758a4e4c1da27f5e2d61c97ee4',
  maticProvider: 'https://rpc-mainnet.maticvigil.com',
})

if (isEtheremNetwork(hre.network)) {
  describe.only('Bridging Assets to Polygon', () => {
    getMarkets(hre.network).forEach(testBridging)
    function testBridging(markets: Market): void {
      // define needed variablez
      let deployer: Signer
      let diamond: ITellerDiamond & MainnetNFTFacet & MainnetNFTFacetMock
      let nftV1: TellerNFT
      let nftV2: TellerNFTV2 & MainnetTellerNFT
      let tellerDictionary: TellerNFTDictionary
      let borrower: string
      let anotherBorrower: string
      let borrowerSigner: Signer
      let anotherSigner: Signer
      let ownedNFTs: BigNumber[]
      let rootChainManager: Contract

      beforeEach(async () => {
        await hre.deployments.fixture(['protocol'], {
          keepExistingDeployments: true,
        })

        // declare variables
        nftV1 = await contracts.get('TellerNFT')
        nftV2 = await contracts.get('TellerNFT_V2')
        tellerDictionary = await contracts.get('TellerNFTDictionary')
        diamond = await contracts.get('TellerDiamond')

        deployer = await getNamedSigner('deployer')

        // get borrower with 1 staked V1 NFT
        const filter = nftV1.filters.Transfer(null, diamond.address, null)
        const [event] = await nftV1.queryFilter(filter)
        anotherBorrower = event.args.from
        anotherSigner = (await hre.evm.impersonate(anotherBorrower)).signer

        // get a regular borrower
        borrower = (await getNamedAccounts()).borrower
        borrowerSigner = (await hre.evm.impersonate(borrower)).signer

        // Minting NFTV1 and V2 tokens
        await mintNFTV1({
          tierIndex: 1,
          borrower: borrower,
          hre,
        })
        await mintNFTV1({
          tierIndex: 1,
          borrower: borrower,
          hre,
        })

        await mintNFTV2({
          tierIndex: 1,
          borrower: borrower,
          amount: 1,
          hre,
        })
        await mintNFTV2({
          tierIndex: 1,
          borrower: borrower,
          amount: 1,
          hre,
        })

        // approve spending v1 and v2 tokens on behalf of the user
        await nftV1
          .connect(borrowerSigner)
          .setApprovalForAll(diamond.address, true)

        await nftV2
          .connect(borrowerSigner)
          .setApprovalForAll(diamond.address, true)

        // get owned nfts of borrower
        ownedNFTs = await nftV1
          .getOwnedTokens(borrower)
          .then((arr) => (arr.length > 2 ? arr.slice(0, 2) : arr))
        rootChainManager = new ethers.Contract(
          '0xD4888faB8bd39A663B63161F5eE1Eae31a25B653',
          rootChainManagerAbi.abi,
          borrowerSigner
        )
      })
      describe('Calling mapped contracts', () => {
        it('should be able to bridge an unstaked NFTV1 to Polygon', async () => {
          let ownedNFTsV1 = await nftV1.getOwnedTokens(borrower)
          const lengthBeforeBridge = ownedNFTsV1.length
          console.log('V1 owned tokens')
          console.log(ownedNFTsV1.length)

          // Bridge NFTs and get their length
          await diamond.connect(borrowerSigner).bridgeNFTsV1(ownedNFTsV1[0])
          ownedNFTsV1 = await nftV1.getOwnedTokens(borrower)
          const lengthAfterBridge = ownedNFTsV1.length
          expect(lengthBeforeBridge).to.not.equal(lengthAfterBridge)
        })
        it('should be able to bridge a staked NFTV1 to Polygon', async () => {
          // get the staked NFTs v1 of the user
          const stakedNFTsV1 = await diamond.getStakedNFTs(anotherBorrower)
          console.log('staked NFTs V1')
          console.log(stakedNFTsV1)
          const lengthBeforeBridge = stakedNFTsV1.length

          // bridge one staked NFT
          await diamond.connect(anotherSigner).bridgeNFTsV1(stakedNFTsV1[0])

          // get the staked NFTs v1 of the user after we bridge
          const stakedNFTsV11 = await diamond.getStakedNFTs(anotherBorrower)
          console.log(stakedNFTsV11)
          const lengthAfterBridge = stakedNFTsV11.length
          expect(lengthBeforeBridge).to.not.equal(lengthAfterBridge)
        })
        it('should be able to bridge an unstaked NFTV2 to polygon', async () => {
          // get owned nfts before bridge
          let ownedNFTsV2 = await nftV2.getOwnedTokens(borrower)
          const lengthBeforeBridge = ownedNFTsV2.length

          // bridge
          await diamond.connect(borrowerSigner).bridgeNFTsV2(ownedNFTsV2[0], 1)

          // get owned nfts after bridge
          ownedNFTsV2 = await nftV2.getOwnedTokens(borrower)
          const lengthAfterBridge = ownedNFTsV2.length

          // they shouldnt be equal
          expect(lengthBeforeBridge).to.not.equal(lengthAfterBridge)
        })
      })
      describe('Mock tests', () => {
        describe('stake, unstake, deposit to polygon', () => {
          it('staking an NFTV1 migrates it to a NFTV2', async () => {
            // approve the user's tokens to transfer to the diamond (Stake)
            await nftV1
              .connect(deployer)
              .setApprovalForAll(diamond.address, true)

            const deployerAddress = await deployer.getAddress()
            // mint the token, then transfer it to v2
            await nftV1.connect(deployer).mint(0, deployerAddress)
            const ownedNFTs = await nftV1.getOwnedTokens(deployerAddress)
            console.log(ownedNFTs)

            // stake the user's tokens
            await diamond.connect(deployer).stakeNFTs(ownedNFTs)

            // get the staked NFTs
            const stakedNFTs = await diamond.getStakedNFTs(deployerAddress)
            console.log(stakedNFTs)
            for (let i = 0; i < ownedNFTs.length; i++) {
              expect(ownedNFTs.length).to.equal(stakedNFTs.length)
            }
          })

          it('tier data matches between v1 and v2', async () => {
            // we use filter to get the Event that will be emitted when we mint the token
            const filter = nftV1.filters.Transfer(
              NULL_ADDRESS,
              DUMMY_ADDRESS,
              null
            )

            // array of v1 tiers
            const arrayOfTiers = [0, 1, 2, 3, 8, 9, 10, 11]

            // mint the token on the tier index, then retrieve the emitted event using transaction's
            // block hash
            const mintToken = async (tierIndex: number): Promise<void> => {
              const receipt = await nftV1
                .connect(deployer)
                .mint(tierIndex, DUMMY_ADDRESS)
                .then(({ wait }) => wait())
              const [event] = await nftV1.queryFilter(filter, receipt.blockHash)

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
            const tokenIds = await nftV1.getOwnedTokens(DUMMY_ADDRESS)
            for (let i = 0; i < tokenIds.length; i++) {
              // convert token id
              const newTokenId = await nftV2.convertV1TokenId(tokenIds[i])

              // uris
              const v1TokenURI = await nftV1.tokenURI(tokenIds[i])
              const v2TokenURI = await nftV2.uri(newTokenId)
              v1TokenURI.should.equal(v2TokenURI)

              const v1BaseLoanSize = await tellerDictionary.tokenBaseLoanSize(
                tokenIds[i]
              )
              const v2BaseLoanSize = await nftV2.tokenBaseLoanSize(newTokenId)
              v1BaseLoanSize.should.eql(v2BaseLoanSize)

              const v1ContributionSize =
                await tellerDictionary.tokenContributionSize(tokenIds[i])
              const v2ContributionSize = await nftV2.tokenContributionSize(
                newTokenId
              )
              v1ContributionSize.should.eql(v2ContributionSize)

              const v1ContributionMultiplier =
                await tellerDictionary.tokenContributionMultiplier(tokenIds[i])
              const v2ContributionMultiplier =
                await nftV2.tokenContributionMultiplier(newTokenId)
              ;(v1ContributionMultiplier * 100).should.eql(
                v2ContributionMultiplier
              )
            }
          })

          it('migrates an NFT from V1 to V2', async () => {
            const deployerAddress = await deployer.getAddress()
            // mint the token, then transfer it to v2
            await nftV1.connect(deployer).mint(0, deployerAddress)
            const [nftId] = await nftV1.getOwnedTokens(deployerAddress)

            // v2 tokens before should = 0
            const v2TokensBefore = await nftV2.getOwnedTokens(deployerAddress)
            v2TokensBefore.length.should.equal(0)

            // v2 tokens after should = 1
            await nftV1
              .connect(deployer)
              ['safeTransferFrom(address,address,uint256)'](
                deployerAddress,
                nftV2.address,
                nftId
              )
            const v2TokensAfter = await nftV2.getOwnedTokens(deployerAddress)
            v2TokensAfter.length.should.equal(1)
          })
        })
      })
    }
  })
}
