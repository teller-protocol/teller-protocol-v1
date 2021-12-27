import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { contracts, ethers, network, toBN } from 'hardhat'

import { ERC20, TTokenV3 } from '../../types/typechain'
import { setTestEnv, TestEnv } from '../helpers/set-test-env'

chai.should()
chai.use(solidity)

setTestEnv('Lending - TToken bonus interest', (testEnv: TestEnv) => {
  it.only('Should accurately dispense the bonus interest', async () => {
    // Load tToken
    const { tokens, tellerDiamond } = testEnv

    const dai: ERC20 = tokens.find((o) => o.name === 'DAI')!.token

    const tDai = await contracts.get<TTokenV3>('ITToken', {
      at: await tellerDiamond.getTTokenFor(dai.address),
    })

    // Deposit as lender

    // Advance time

    // Check tToken total underlying

    // Check tToken exchange rate
  })
})
