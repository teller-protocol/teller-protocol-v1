import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { ethers } from 'hardhat'

import { MainnetNFTFacetMock } from '../../types/typechain'
import { setTestEnv, TestEnv } from '../helpers/set-test-env'

chai.should()
chai.use(solidity)

setTestEnv('Loans', (testEnv: TestEnv) => {
  it('Should be able to successfully take out a DAI loan with an NFT', async () => {
    const { tellerDiamond, borrower, dai, nft } = testEnv

    // Loan params
    const lendingToken = dai
    const loanDuration = '84600'
    const loanAmount = '1000'

    // Get borrower NFT
    const ownedNfts = await nft
      .connect(borrower)
      .getOwnedTokens(await borrower.getAddress())

    // Set NFT approval
    await nft.connect(borrower).setApprovalForAll(tellerDiamond.address, true)

    // Stake NFT
    await (tellerDiamond as any as MainnetNFTFacetMock)
      .connect(borrower)
      .mockStakeNFTsV1(ownedNfts)

    // Encode token data
    const tokenData = ethers.utils.defaultAbiCoder.encode(
      ['uint16', 'bytes'],
      [1, ethers.utils.defaultAbiCoder.encode(['uint256[]'], [ownedNfts])]
    )

    // Take out loan
    await tellerDiamond
      .connect(borrower)
      .takeOutLoanWithNFTs(
        lendingToken.address,
        loanAmount,
        loanDuration,
        tokenData
      )

    const ownedNftsAfter = await nft
      .connect(borrower)
      .getOwnedTokens(await borrower.getAddress())

    expect(ownedNftsAfter.length).to.be.lt(ownedNfts.length)

    const loanID = await tellerDiamond.getBorrowerLoans(
      await borrower.getAddress()
    )
    const loan = await tellerDiamond.getLoan(loanID[0].toString())

    expect(loan.duration.toString()).to.eq(loanDuration)
    expect(loan.borrowedAmount).to.eq(loanAmount)
  })
})
