import fs from 'fs'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import NftLoanTree from '../../scripts/merkle/nft-loan-tree'
import { ITellerDiamond, TellerNFT } from '../../types/typechain'

import { getNFT } from '../../config'
import { evm } from 'hardhat'

interface AddMerklesArgs {
  loanTree?: NftLoanTree
  output?: string
  sendTx?: boolean
}

export const setLoanMerkle = async (
  args: AddMerklesArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, network, log, ethers } = hre
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

  // get deployer
  const deployer = await ethers.provider.getSigner(
    '0xAFe87013dc96edE1E116a288D80FcaA0eFFE5fe5'
  )

  await diamond.connect(deployer).setNFTMerkleRoot(tree.getHexRoot())

  log(`NFT loan size merkle set: ${tree.getHexRoot()}`, {
    indent: 2,
    star: true,
  })
  log('')

  if (args.output) {
    fs.writeFileSync(args.output, JSON.stringify(tree.getElements(), null, 2))

    log(`NFT size data written to ${args.output}`)
    log('')
  }
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
      const { index_, tier_ } = await nft.getTokenTier(nftID)
      const baseLoanSize = toBN(tier_.baseLoanSize, 18)
      info.push({
        id: nftID,
        baseLoanSize,
        tierIndex: index_,
      })
      nftID = nftID.add(1)
    }
  } catch (e) {
    // Throws once all NFTs have been looped
  }
  return new NftLoanTree(info)
}

task(
  'set-nft-loan-merkle',
  'Generates and sets the merkle used to verify NFT loan sizes while taking out a loan'
)
  .addParam(
    'output',
    'Path to file to output merkle proofs',
    undefined,
    types.string
  )
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(setLoanMerkle)
