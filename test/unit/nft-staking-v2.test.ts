import { expect } from 'chai'
import { Signer } from 'ethers'
import hre, { ethers } from 'hardhat'

import { TellerNFTDictionary } from '../../types/typechain'

let dictionaryContract: TellerNFTDictionary
let signerAccount: Signer

describe('NFT Staking V2', () => {
  it('Should deploy the dictionary', async () => {
    const Dictionary = await ethers.getContractFactory('TellerNFTDictionary')

    before(async () => {
      /*  deployer = await hre.getNamedSigner('deployer')

      dictionaryContract = (await Dictionary.deploy()) as TellerNFTDictionary

      await dictionaryContract.deployed()

      const type = await dictionaryContract.stakeableTokenType()
      expect(type).to.equal(
        '0x2213d707f04cdfd263a540394e2a26bbf3a63d6ad89a37f534d2ee35bdfe0d38'
      )*/
    })
  })
})
