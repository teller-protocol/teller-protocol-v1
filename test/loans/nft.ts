import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { contracts, ethers, network, toBN } from 'hardhat'

import { isEtheremNetwork } from '../../config'
import {
  ERC20,
  MainnetNFTFacetMock,
  PolyTellerNFTMock,
} from '../../types/typechain'
import { mergeV2IDsToBalances } from '../helpers/nft'
import { setTestEnv, TestEnv } from '../helpers/set-test-env'

chai.should()
chai.use(solidity)

setTestEnv('Loans - NFT', (testEnv: TestEnv) => {
  const nftLoan = async (
    lendingAsset: ERC20,
    amount: string
  ): Promise<void> => {
    const { tellerDiamond, borrower, deployer, nft } = testEnv

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

    if (isEtheremNetwork(network)) {
      // Encode token data
      const tokenData = ethers.utils.defaultAbiCoder.encode(
        ['uint16', 'bytes'],
        [
          2,
          ethers.utils.defaultAbiCoder.encode(
            ['uint256[]', 'uint256[]'],
            [[ownedNfts[0]], [1]]
          ),
        ]
      )
      // Stake NFT
      await nft
        .connect(borrower)
        .safeBatchTransferFrom(
          await borrower.getAddress(),
          tellerDiamond.address,
          [ownedNfts[0]],
          ['1'],
          '0x'
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
    } else {
      await (nft as any as PolyTellerNFTMock)
        .connect(deployer)
        .addDepositor(await deployer.getAddress())

      const depositData = ethers.utils.defaultAbiCoder.encode(
        ['uint256[]', 'uint256[]', 'bytes'],
        [[ownedNfts[0]], [1], '0x']
      )

      const takeOutLoanData = ethers.utils.defaultAbiCoder.encode(
        ['uint16', 'bytes'],
        [
          2,
          ethers.utils.defaultAbiCoder.encode(
            ['uint256[]', 'uint256[]'],
            [[ownedNfts[0]], [1]]
          ),
        ]
      )

      await (nft as any as PolyTellerNFTMock)
        .connect(deployer)
        .deposit(await borrower.getAddress(), depositData)

      const balances = mergeV2IDsToBalances([ownedNfts[0]])
      // diamond and teller nft
      await nft.connect(borrower).setApprovalForAll(tellerDiamond.address, true)
      await nft
        .connect(borrower)
        .safeBatchTransferFrom(
          await borrower.getAddress(),
          tellerDiamond.address,
          balances.ids,
          balances.balances,
          '0x'
        )
      // Take out loan
      await tellerDiamond
        .connect(borrower)
        .takeOutLoanWithNFTs(
          lendingToken.address,
          loanAmount,
          loanDuration,
          takeOutLoanData
        )
    }

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
    const { tokens } = testEnv
    const dai = tokens.find((o) => o.name === 'DAI')!.token
    await nftLoan(dai, '1000')
  })
  it('Should be able to successfully take out a USDC loan with an NFT', async () => {
    const { tokens } = testEnv
    const usdc = tokens.find((o) => o.name === 'USDC')!.token
    await nftLoan(usdc, '40')
  })
  if (isEtheremNetwork(network)) {
    it('Should be able to successfully take out a LINK loan with an NFT', async () => {
      const { tokens } = testEnv
      const link = tokens.find((o) => o.name === 'LINK')!.token
      await nftLoan(link, '1')
    })
  } else {
    it('Should be able to successfully take out a WMATIC loan with an NFT', async () => {
      const { tokens } = testEnv
      const wmatic = tokens.find((o) => o.name === 'WMATIC')!.token
      await nftLoan(wmatic, '1')
    })
  }
  it('Should be able to successfully take out a WETH loan with an NFT', async () => {
    const { tokens } = testEnv
    const weth = tokens.find((o) => o.name === 'WETH')!.token
    await nftLoan(weth, '0.2')
  })
  it('Should be able to successfully take out a WBTC loan with an NFT', async () => {
    const { tokens } = testEnv
    const wbtc = tokens.find((o) => o.name === 'WBTC')!.token
    await nftLoan(wbtc, '0.01')
  })
})
