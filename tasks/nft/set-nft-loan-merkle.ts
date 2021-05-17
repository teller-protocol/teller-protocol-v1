import { BigNumber } from 'ethers'
import fs from 'fs'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import NftLoanTree, { NFTSizeElement } from '../../scripts/merkle/nft-loan-tree'
import { ITellerDiamond, TellerNFT } from '../../types/typechain'

interface AddMerklesArgs {
  loanTree?: NftLoanTree
  output?: string
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

  if (args.output) {
    fs.writeFileSync(args.output, JSON.stringify(tree.getElements(), null, 2))

    log(`NFT size data written to ${args.output}`)
    log('')
  }
}

export const getLoanMerkleTree = async (
  hre: HardhatRuntimeEnvironment
): Promise<NftLoanTree> => {
  const { contracts, ethers, log } = hre

  const nft = await contracts.get<TellerNFT>('TellerNFT')

  const info: ConstructorParameters<typeof NftLoanTree>[0] = []
  let nftID = ethers.BigNumber.from(0)
  let cont = true
  while (cont) {
    const arr = new Array(50).fill(null).map(() => {
      const p = getTokenTier({
        nft,
        nftID,
        hre,
      })
      nftID = nftID.add(1)

      return p
    })
    const sizes = await Promise.all(arr)

    sizes.forEach((size) => {
      if (size == null) {
        cont = false
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      log(
        `#${size.id.toString()}: Tier ${size.tierIndex.toString()} ${size.baseLoanSize.toString()}`,
        { indent: 3, star: true }
      )
      info.push(size)
    })
  }
  return new NftLoanTree(info)
}

interface GetTokenTierArgs {
  nft: TellerNFT
  nftID: BigNumber
  hre: HardhatRuntimeEnvironment
}

const getTokenTier = async (
  args: GetTokenTierArgs
): Promise<NFTSizeElement | null> => {
  const { nft, nftID, hre } = args

  try {
    await nft.ownerOf(nftID)

    const { index_, tier_ } = await nft.getTokenTier(nftID)
    const baseLoanSize = hre.toBN(tier_.baseLoanSize, 18)
    return {
      id: nftID,
      baseLoanSize,
      tierIndex: index_,
    }
  } catch {
    return null
  }
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
