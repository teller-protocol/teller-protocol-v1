import { BigNumber, BigNumberish, utils } from 'ethers'

import BalanceTree from './balance-tree'

const { isAddress, getAddress } = utils

// This is the blob that gets distributed and pinned to IPFS.
// It is completely sufficient for recreating the entire merkle tree.
// Anyone can verify that all air drops are included in the tree,
// and the tree has no additional distributions.
export interface MerkleDistributorInfo {
  merkleRoot: string
  tierIndex: number
  tokenTotal: string
  claims: {
    [account: string]: {
      index: number
      amount: string
      proof: string[]
      flags?: {
        [flag: string]: boolean
      }
    }
  }
}

type Balances = Array<{ address: string; count: BigNumberish }>

export function generateMerkleDistribution(
  tierIndex: number,
  balances: Balances
): MerkleDistributorInfo {
  const dataByAddress = balances.reduce<{
    [address: string]: {
      amount: BigNumber
      flags?: { [flag: string]: boolean }
    }
  }>((memo, { address: account, count }) => {
    if (!isAddress(account)) {
      throw new Error(`Found invalid address: ${account}`)
    }
    const parsed = getAddress(account)
    if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`)
    const parsedNum = BigNumber.from(count)
    if (parsedNum.lte(0))
      throw new Error(`Invalid count for account: ${account}`)

    memo[parsed] = { amount: parsedNum }
    return memo
  }, {})

  const sortedAddresses = Object.keys(dataByAddress).sort()

  // construct a tree
  const tree = new BalanceTree(
    sortedAddresses.map((address) => ({
      account: address,
      amount: dataByAddress[address].amount,
    }))
  )

  // generate claims
  const claims = sortedAddresses.reduce<{
    [address: string]: {
      amount: string
      index: number
      proof: string[]
      flags?: { [flag: string]: boolean }
    }
  }>((memo, address, index) => {
    const { amount, flags } = dataByAddress[address]
    memo[address] = {
      index,
      amount: amount.toHexString(),
      proof: tree.getProof(index, address, amount),
      ...(flags ? { flags } : {}),
    }
    return memo
  }, {})

  const tokenTotal: BigNumber = sortedAddresses.reduce<BigNumber>(
    (memo, key) => memo.add(dataByAddress[key].amount),
    BigNumber.from(0)
  )

  return {
    merkleRoot: tree.getHexRoot(),
    tierIndex: tierIndex,
    tokenTotal: tokenTotal.toHexString(),
    claims,
  }
}
