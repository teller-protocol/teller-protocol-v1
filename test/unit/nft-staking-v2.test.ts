import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber, BigNumberish, Signer } from 'ethers'
import hre from 'hardhat'
import Prando from 'prando'

import { getNetworkName, isEtheremNetwork } from '../../config'
import { Address } from '../../types/custom/config-types'
import {
  ITellerDiamond,
  TellerNFT,
  TellerNFTDictionary,
  TellerNFTV2,
} from '../../types/typechain'

chai.should()
chai.use(solidity)

const { getNamedSigner, contracts, tokens, ethers, evm, toBN } = hre

type V2Balances = [BigNumber[], BigNumber[]]

describe.only('NFT Staking', () => {
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
  }

  const mergeV2IDsToBalances = (v2IDs: BigNumber[]): V2Balances => {
    const v2Balances: { [v2ID: number]: BigNumber } = {}
    for (const v2IDBN of v2IDs) {
      const v2ID = v2IDBN.toNumber()
      if (v2Balances[v2ID] == null) v2Balances[v2ID] = BigNumber.from(0)
      v2Balances[v2ID] = v2Balances[v2ID].add(1)
    }

    const response: V2Balances = [[], []]
    for (const [v2ID, v2Balance] of Object.entries(v2Balances)) {
      response[0].push(BigNumber.from(v2ID))
      response[1].push(v2Balance)
    }
    return response
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
        const v2IDs = await Promise.all(
          V1IDs.map<BigNumber>((id) => tellerNFTV2.convertV1TokenId(id))
        )
        return mergeV2IDsToBalances(v2IDs)
      }

      describe('V1 => V2', () => {
        let ownedNFTsV1: BigNumber[]

        beforeEach(async () => {
          await setup(true)

          // diamond and teller nft
          await tellerNFTV1
            .connect(borrower)
            .setApprovalForAll(diamond.address, true)

          await mintV1(0)
          await mintV1(2)
          ownedNFTsV1 = await tellerNFTV1.getOwnedTokens(borrowerAddress)
        })

        it('should be able to stake V1 NFTs and auto migrate to V2 NFTs', async () => {
          const expectedV2IDs = await convertV1IDsToV2Balances(ownedNFTsV1)

          // stake NFTs on behalf of user
          await diamond.connect(borrower).stakeNFTs(ownedNFTsV1)

          // get staked
          const stakedNFTs = await diamond.getStakedNFTsV2(borrowerAddress)

          // every tokenId of the owned NFT should equate a token ID from the stakedNFT
          stakedNFTs.should.eql(expectedV2IDs)
        })

        it('should be able to unstake V1 NFTs and get V2 NFTs in return', async () => {
          // Stake V1 NFTs with a special mock function that does not migrate to V2
          const ownedNFTsV1 = await tellerNFTV1.getOwnedTokens(borrowerAddress)
          await diamond.connect(borrower).mockStakeNFTsV1(ownedNFTsV1)
          const stakedNFTsV1 = await diamond.getStakedNFTs(borrowerAddress)
          ownedNFTsV1.should.eql(stakedNFTsV1)

          const expectedV2IDs = await convertV1IDsToV2Balances(ownedNFTsV1)

          await diamond.connect(borrower).unstakeNFTs(stakedNFTsV1)
          const ownedTokensV2 = await tellerNFTV2.getOwnedTokens(
            borrowerAddress
          )
          const addresses = new Array(ownedTokensV2.length).fill(
            borrowerAddress
          )
          const tokenBalancesV2 = await tellerNFTV2.balanceOfBatch(
            addresses,
            ownedTokensV2
          )
          tokenBalancesV2.should.eql(expectedV2IDs[1])
        })

        it('should not be able to unstake NFTs from the wrong address', async () => {
          const ownedNFTsV1 = await tellerNFTV1.getOwnedTokens(borrowerAddress)
          await diamond.connect(borrower).mockStakeNFTsV1(ownedNFTsV1)
          const stakedNFTsV1 = await diamond.getStakedNFTs(borrowerAddress)

          // unstake all of our staked nfts from the wrong address
          await diamond
            .connect(deployer)
            .unstakeNFTs(stakedNFTsV1)
            .should.be.revertedWith('Teller: not the owner of the NFT ID!')
        })
      })
    })
  } else {
    describe(`${getNetworkName(hre.network)}`, () => {
      let balances: V2Balances

      before(async () => {
        await setup(false)

        // diamond and teller nft
        await tellerNFTV2
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
        const tierTokenCount = await tellerNFTV2.tierTokenCount(tierIndex)
        const tierTokenID = prando.nextInt(0, tierTokenCount.toNumber())
        const tokenIDV2 = BigNumber.from(
          `${tierIndex}${tierTokenID.toString().padStart(4, '0')}`
        )
        const data = ethers.utils.defaultAbiCoder.encode(
          ['uint256[]', 'uint256[]', 'bytes'],
          [[tokenIDV2], [1], '0x']
        )
        await tellerNFTV2.connect(deployer).deposit(borrowerAddress, data)
        return tokenIDV2
      }

      it('should be able to stake V2 NFTs', async () => {
        // stake NFTs on behalf of user
        await diamond.connect(borrower).stakeNFTsV2(...balances)

        // get staked
        const stakedNFTs = await diamond.getStakedNFTsV2(borrowerAddress)

        // every tokenId of the owned NFT should equate a token ID from the stakedNFT
        stakedNFTs.should.eql(balances)
      })

      it('should be able to unstake V2 NFTs', async () => {
        // unstake all of our staked NFTs
        await diamond.connect(borrower).unstakeNFTsV2(...balances)

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
          .unstakeNFTsV2(...balances)
          .should.be.revertedWith('Teller: not the owner of the NFT ID!')
      })
    })
  }
})
