import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { fundedMarket } from './fixtures'

chai.should()
chai.use(chaiAsPromised)

module.exports = async () => {
  const { deployments, ethers, contracts, getNamedSigner } = hre

  // Get deployer account
  const deployer = await getNamedSigner('deployer')

  // Get snapshot
  const { loans, lendingPool } = await fundedMarket()

  console.log('ROADRUNNer', loans.address)

  // - Creating a loan with terms, depositing collateral and taking out a loan successfully

  // - Creating a loan with terms and try to take out a loan without collateral unsuccessfully

  // - Taking out and repaying a loan successfully

  // - Taking out a loan unsuccessfully with invalid debt ratio

  // - Liquidating an expired loan successfully

  // - Liquidating an active loan unsuccessfully
}
