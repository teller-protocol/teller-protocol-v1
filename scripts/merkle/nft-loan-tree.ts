import { BigNumber, BigNumberish, utils } from 'ethers'

import MerkleTree from './merkle-tree'

type NftSizeElements = Array<{
  id: BigNumberish
  baseLoanSize: BigNumberish
  tierIndex: BigNumberish
}>
type NftSizeElementsOutput = Array<{
  id: string
  baseLoanSize: string
  proof: string[]
  tierIndex: string
}>

export default class NftLoanTree {
  private readonly tree: MerkleTree
  private readonly elements: NftSizeElements

  constructor(elements: NftSizeElements) {
    this.elements = elements
    this.tree = new MerkleTree(
      elements.map(({ id, baseLoanSize }) => {
        return NftLoanTree.toNode(id, baseLoanSize)
      })
    )
  }

  public static verifyProof(
    id: BigNumberish,
    baseLoanSize: BigNumberish,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = NftLoanTree.toNode(id, baseLoanSize)
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item)
    }

    return pair.equals(root)
  }

  public static toNode(id: BigNumberish, baseLoanSize: BigNumberish): Buffer {
    return Buffer.from(
      utils
        .solidityKeccak256(['uint256', 'uint256'], [id, baseLoanSize])
        .substr(2),
      'hex'
    )
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot()
  }

  // returns the hex bytes32 values of the proof
  public getProof(id: BigNumberish, baseLoanSize: BigNumberish): string[] {
    return this.tree.getHexProof(NftLoanTree.toNode(id, baseLoanSize))
  }

  public getElements(): NftSizeElementsOutput {
    return this.elements.map((e) => ({
      id: BigNumber.from(e.id).toString(),
      baseLoanSize: BigNumber.from(e.baseLoanSize).toString(),
      proof: this.getProof(e.id, e.baseLoanSize),
      tierIndex: BigNumber.from(e.tierIndex).toString(),
    }))
  }
}
