import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { ethers, toBN } from 'hardhat'

import { ERC20, MainnetNFTFacetMock } from '../../types/typechain'
import { setTestEnv, TestEnv } from '../helpers/set-test-env'

chai.should()
chai.use(solidity)

setTestEnv('Loans - NFT', (testEnv: TestEnv) => {
  const nftLoan = async (
    lendingAsset: ERC20,
    amount: string
  ): Promise<void> => {
    const { tellerDiamond, borrower, nft } = testEnv

    // Loan params
    const lendingToken = lendingAsset
    const loanDuration = '84600'
    const loanAmount = toBN(amount, await lendingToken.decimals())

    // Get borrower NFT
    const ownedNfts = await nft
      .connect(borrower)
      .getOwnedTokens(await borrower.getAddress())

    // Set NFT approval
    await nft.connect(borrower).setApprovalForAll(tellerDiamond.address, true)

    // Stake NFT
    await (tellerDiamond as any as MainnetNFTFacetMock)
      .connect(borrower)
      .mockStakeNFTsV1([ownedNfts[0]])

    // Encode token data
    const tokenData = ethers.utils.defaultAbiCoder.encode(
      ['uint16', 'bytes'],
      [1, ethers.utils.defaultAbiCoder.encode(['uint256[]'], [[ownedNfts[0]]])]
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
    const loan = await tellerDiamond.getLoan(
      loanID[loanID.length - 1].toString()
    )

    expect(loan.duration.toString()).to.eq(loanDuration)
    expect(loan.borrowedAmount).to.eq(loanAmount)
  }

  it('Should be able to successfully take out a DAI loan with an NFT', async () => {
    const { dai } = testEnv
    await nftLoan(dai, '2000')
  })
  it('Should be able to successfully take out a USDC loan with an NFT', async () => {
    const { usdc } = testEnv
    await nftLoan(usdc, '400')
  })
  it('Should be able to successfully take out a LINK loan with an NFT', async () => {
    const { link } = testEnv
    await nftLoan(link, '10')
  })
  it('Should be able to successfully take out a WETH loan with an NFT', async () => {
    const { weth } = testEnv
    await nftLoan(weth, '0.2')
  })
  it('Should be able to successfully take out a WBTC loan with an NFT', async () => {
    const { wbtc } = testEnv
    await nftLoan(wbtc, '0.01')
  })
})
