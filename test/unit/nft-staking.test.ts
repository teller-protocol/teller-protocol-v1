import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, BigNumberish, Signer } from 'ethers'
import hre from 'hardhat'
import Prando from 'prando'

import { getNetworkName, isEtheremNetwork } from '../../config'
import { Address } from '../../types/custom/config-types'
import {
  ITellerDiamond,
  MainnetNFTFacet,
  MainnetNFTFacetMock,
  MainnetTellerNFT,
  PolyTellerNFTMock,
  TellerNFT,
  TellerNFTDictionary,
  TellerNFTV2,
} from '../../types/typechain'
import { mergeV2IDsToBalances, V2Balances } from '../helpers/nft'

chai.should()
chai.use(solidity)

const { getNamedSigner, contracts, tokens, ethers, evm, toBN } = hre

describe('NFT Staking', () => {
  let diamond: ITellerDiamond
  let tellerNFTV2: TellerNFTV2
  let deployer: Signer
  let borrower: Signer
  let borrowerAddress: Address

  before(async () => {
    deployer = await getNamedSigner('deployer')
    borrower = await getNamedSigner('borrower')
    borrowerAddress = await borrower.getAddress()
  })

  const setup = async (keepExistingDeployments: boolean): Promise<void> => {
    await hre.deployments.fixture('protocol', { keepExistingDeployments })

    diamond = await contracts.get('TellerDiamond')
    tellerNFTV2 = await contracts.get('TellerNFT_V2')

    const ownedTokens = await tellerNFTV2.getOwnedTokens(borrowerAddress)
  }

  if (isEtheremNetwork(hre.network)) {
    describe('Ethereum Mainnet', () => {
      let tellerNFTV1: TellerNFT
      let dictionary: TellerNFTDictionary

      before(async () => {
        await setup(true)
        dictionary = await contracts.get('TellerNFTDictionary')
        tellerNFTV1 = await contracts.get('TellerNFT')
      })

      const mintV1 = async (tierIndex: number): Promise<BigNumber> => {
        const receipt = await tellerNFTV1
          .connect(deployer)
          .mint(tierIndex, borrowerAddress)
        const [event] = await tellerNFTV1.queryFilter(
          tellerNFTV1.filters.Transfer(null, borrowerAddress, null),
          receipt.blockHash
        )
        const tokenIDV1 = event.args.tokenId
        await dictionary
          .connect(deployer)
          .setTokenTierForTokenId(tokenIDV1, tierIndex)

        return tokenIDV1
      }

      /**
       * Converts NFT V1 IDs into V2 response format for V2 balance query
       * @param V1IDs NFT V1 token IDs
       * @return V2Balances NFT V2 balance query response
       */
      const convertV1IDsToV2Balances = async (
        V1IDs: BigNumberish[]
      ): Promise<V2Balances> => {
        const $tellerNFTV2 = tellerNFTV2 as MainnetTellerNFT
        const v2IDs = await Promise.all(
          V1IDs.map((id) => $tellerNFTV2.convertV1TokenId(id))
        )
        return mergeV2IDsToBalances(v2IDs)
      }

      const burnAllTellerNFTV2 = async (): Promise<void> => {
        let ownedTokensV2 = await tellerNFTV2.getOwnedTokens(borrowerAddress)
        const addresses = new Array(ownedTokensV2.length).fill(borrowerAddress)
        const tokenBalancesV2 = await tellerNFTV2.balanceOfBatch(
          addresses,
          ownedTokensV2
        )

        await tellerNFTV2
          .connect(borrower)
          .safeBatchTransferFrom(
            borrowerAddress,
            diamond.address,
            ownedTokensV2,
            tokenBalancesV2,
            '0x'
          )

        ownedTokensV2 = await tellerNFTV2.getOwnedTokens(borrowerAddress)
      }

      describe('V1 => V2', () => {
        let ownedNFTsV1: BigNumber[]
        let diamond1: ITellerDiamond & MainnetNFTFacetMock

        beforeEach(async () => {
          await setup(true)

          diamond1 = diamond as ITellerDiamond & MainnetNFTFacetMock

          // diamond and teller nft
          await tellerNFTV1
            .connect(borrower)
            .setApprovalForAll(diamond1.address, true)

          await mintV1(0)
          await mintV1(2)
          ownedNFTsV1 = await tellerNFTV1.getOwnedTokens(borrowerAddress)
        })

        afterEach(async () => {})

        it('should be able to stake V1 NFTs and auto migrate to V2 NFTs', async () => {
          const expectedV2IDs = await convertV1IDsToV2Balances(ownedNFTsV1)

          // stake NFTs on behalf of user
          await diamond1.connect(borrower).stakeNFTs(ownedNFTsV1)

          // get staked
          const stakedNFTs = await diamond1.getStakedNFTsV2(borrowerAddress)

          // every tokenId of the owned NFT should equate a token ID from the stakedNFT
          stakedNFTs.should.eql(expectedV2IDs)
        })

        it('should be able to unstake V1 NFTs and get V2 NFTs in return', async () => {
          await burnAllTellerNFTV2()

          const ownedTokensV2pre = await tellerNFTV2.getOwnedTokens(
            //owns 3
            borrowerAddress
          )
          ownedTokensV2pre.length.should.eql(0)

          // Stake V1 NFTs with a special mock function that does not migrate to V2
          await diamond1.connect(borrower).mockStakeNFTsV1(ownedNFTsV1)
          const stakedNFTsV1 = await diamond1.getStakedNFTs(borrowerAddress)
          stakedNFTsV1.should.eql(ownedNFTsV1, 'Staked NFTs do not match')

          const expectedV2IDs = await convertV1IDsToV2Balances(stakedNFTsV1)

          await diamond1.connect(borrower).unstakeNFTs(stakedNFTsV1)
          const ownedTokensV2 = await tellerNFTV2.getOwnedTokens(
            //owns 5
            borrowerAddress
          )
          const addresses = new Array(ownedTokensV2.length).fill(
            borrowerAddress
          )
          const tokenBalancesV2 = await tellerNFTV2.balanceOfBatch(
            addresses,
            ownedTokensV2
          )

          tokenBalancesV2.should.eql(
            expectedV2IDs.balances,
            'NFT V2 balances do not match'
          )
        })

        it('should not be able to unstake NFTs from the wrong address', async () => {
          const ownedNFTsV1 = await tellerNFTV1.getOwnedTokens(borrowerAddress)
          await diamond1.connect(borrower).mockStakeNFTsV1(ownedNFTsV1)
          const stakedNFTsV1 = await diamond1.getStakedNFTs(borrowerAddress)

          // unstake all of our staked nfts from the wrong address
          await diamond1
            .connect(deployer)
            .unstakeNFTs(stakedNFTsV1)
            .should.be.revertedWith('Teller: not the owner of the NFT ID!')
        })
      })
    })
  } else {
    describe(`${getNetworkName(hre.network)}`, () => {
      let balances: V2Balances
      let $tellerNFTV2: PolyTellerNFTMock

      before(async () => {
        await setup(false)

        $tellerNFTV2 = tellerNFTV2 as PolyTellerNFTMock

        // diamond and teller nft
        await $tellerNFTV2
          .connect(borrower)
          .setApprovalForAll(diamond.address, true)

        // mint new tokens
        balances = mergeV2IDsToBalances([
          await mintV2(1),
          await mintV2(1),
          await mintV2(1),
          await mintV2(2),
          await mintV2(2),
          await mintV2(2),
          await mintV2(3),
          await mintV2(3),
          await mintV2(3),
        ])
      })

      const prando = new Prando()
      const mintV2 = async (tierIndex: number): Promise<BigNumber> => {
        const tierTokenCount = await $tellerNFTV2.tierTokenCount(tierIndex)
        const tierTokenID = prando.nextInt(0, tierTokenCount.toNumber())
        const tokenIDV2 = BigNumber.from(
          `${tierIndex}${tierTokenID.toString().padStart(4, '0')}`
        )
        const data = ethers.utils.defaultAbiCoder.encode(
          ['uint256[]', 'uint256[]', 'bytes'],
          [[tokenIDV2], [1], '0x']
        )
        await $tellerNFTV2.connect(deployer).deposit(borrowerAddress, data)
        return tokenIDV2
      }

      it('should be able to stake V2 NFTs', async () => {
        // stake NFTs on behalf of user
        await $tellerNFTV2
          .connect(borrower)
          .safeBatchTransferFrom(
            borrowerAddress,
            diamond.address,
            balances.ids,
            balances.balances,
            '0x'
          )

        // get staked
        const stakedNFTs = await diamond.getStakedNFTsV2(borrowerAddress)

        // every tokenId of the owned NFT should equate a token ID from the stakedNFT
        stakedNFTs.should.eql(balances)
      })

      it('should be able to unstake V2 NFTs', async () => {
        // unstake all of our staked NFTs
        await diamond
          .connect(borrower)
          .unstakeNFTsV2(balances.ids, balances.balances)

        // retrieve our staked NFTs (should be empty)
        const stakedNFTs = await diamond.getStakedNFTsV2(borrowerAddress)

        // we expect our staked NFTs length to be 0
        stakedNFTs.staked_.length.should.equal(0)
        stakedNFTs.amounts_.length.should.equal(0)
      })

      it('should not be able to unstake V2 NFTs from the wrong address', async () => {
        // unstake all of our staked nfts from the wrong address
        await diamond
          .connect(deployer)
          .unstakeNFTsV2(balances.ids, balances.balances)
          .should.be.revertedWith('Teller: not the owner of the NFT ID!')
      })
    })
  }
})
