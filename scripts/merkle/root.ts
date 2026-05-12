import { BigNumberish, isAddress, getAddress } from 'ethers'

import BalanceTree from './balance-tree'

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
      amount: bigint
      flags?: { [flag: string]: boolean }
    }
  }>((memo, { address: account, count }) => {
    if (!isAddress(account)) {
      throw new Error(`Found invalid address: ${account}`)
    }
    const parsed = getAddress(account)
    if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`)
    const parsedNum = BigInt(count)
    if (parsedNum <= 0n)
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
      amount: '0x' + amount.toString(16),
      proof: tree.getProof(index, address, amount),
      ...(flags ? { flags } : {}),
    }
    return memo
  }, {})

  const tokenTotal: bigint = sortedAddresses.reduce<bigint>(
    (memo, key) => memo + dataByAddress[key].amount,
    0n
  )

  return {
    merkleRoot: tree.getHexRoot(),
    tierIndex: tierIndex,
    tokenTotal: '0x' + tokenTotal.toString(16),
    claims,
  }
}
