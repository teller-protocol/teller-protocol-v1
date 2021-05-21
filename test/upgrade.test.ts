import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import {
  contracts,
  deployments,
  ethers,
  getNamedAccounts,
  getNamedSigner,
} from 'hardhat'

import { ITellerDiamond, SettingsFacet } from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'
import { RUN_EXISTING } from './helpers/env-helpers'

chai.should()
chai.use(solidity)

describe('Upgrading the Teller diamond', () => {
  it('Should be able to disable adding an authorized address', async () => {
    await deployments.fixture('protocol', {
      keepExistingDeployments: RUN_EXISTING,
    })

    const deployer = await getNamedSigner('deployer')
    const from = await deployer.getAddress()
    const { address: teller } = await deployments.get('TellerDiamond')
    const protocol = await contracts.get<ITellerDiamond>('TellerDiamond', {
      at: teller,
      from,
    })

    // Add an authorized address
    const { borrower: user } = await getNamedAccounts()
    await protocol.addAuthorizedAddress(user)
    const SettingsFacet = await contracts.get<SettingsFacet>('SettingsFacet')
    SettingsFacet.interface.functions['addAuthorizedAddress(address)'].format
    const selector = SettingsFacet.interface.getSighash('addAuthorizedAddress')
    await protocol.diamondCut(
      [
        {
          action: 2,
          facetAddress: NULL_ADDRESS,
          functionSelectors: [selector],
        },
      ],
      NULL_ADDRESS,
      '0x',
      {
        from,
      }
    )
    await protocol
      .addAuthorizedAddress(from)
      .then((tx) => tx.wait())
      .should.revertedWith('Diamond: Function does not exist')
  })
})
