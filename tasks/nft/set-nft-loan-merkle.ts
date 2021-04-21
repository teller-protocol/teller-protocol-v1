import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import NftLoanTree from '../../scripts/merkle/nft-loan-tree'
import { ITellerDiamond, TellerNFT } from '../../types/typechain'

interface AddMerklesArgs {
  loanTree?: NftLoanTree
  sendTx?: boolean
}

export const setLoanMerkle = async (
  args: AddMerklesArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, network, log } = hre

  if (!['localhost', 'hardhat'].includes(network.name) && !args.sendTx) {
    log('')
    log('================================================')
    log('  Must pass --send-tx flag to execute tx')
    log('================================================')
    log('')
    return
  }

  log('')
  log('Setting NFT loan size merkle root', { indent: 1, star: true })
  log('')

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const tree = args.loanTree ?? (await getLoanMerkleTree(hre))
  await diamond.setNFTMerkleRoot(tree.getHexRoot())

  log(`NFT loan size merkle set: ${tree.getHexRoot()}`, {
    indent: 2,
    star: true,
  })
  log('')
}

export const getLoanMerkleTree = async (
  hre: HardhatRuntimeEnvironment
): Promise<NftLoanTree> => {
  const { contracts, ethers, toBN } = hre

  const nft = await contracts.get<TellerNFT>('TellerNFT')

  const info: ConstructorParameters<typeof NftLoanTree>[0] = []
  try {
    let nftID = ethers.BigNumber.from(0)
    while (await nft.ownerOf(nftID)) {
      const { tier_ } = await nft.getTokenTier(nftID)
      const baseLoanSize = toBN(tier_.baseLoanSize, 18)
      info.push({
        id: nftID,
        baseLoanSize,
      })
      nftID = nftID.add(1)
    }
  } catch (e) {
    if (!e.message.includes('ERC721: owner query for nonexistent token')) {
      throw e
    }
  }
  return new NftLoanTree(info)
}

task(
  'set-nft-loan-merkle',
  'Generates and sets the merkle used to verify NFT loan sizes while taking out a loan'
)
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(setLoanMerkle)
