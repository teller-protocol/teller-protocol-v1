import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { ITellerDiamond } from '../../types/typechain'

interface AddAuthorizedAddressArgs {
  account: string
}

export async function addAuthorizedAccount(
  args: AddAuthorizedAddressArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { contracts, log } = hre

  log('')
  log(`Granting ${args.account} AUTHORIZED role`, {
    indent: 1,
    star: true,
  })
  log('')

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  await diamond.addAuthorizedAddress(args.account)

  log('Success!')
  log('')
}

task('add-authorized-account', 'Adds the AUTHORIZED role to an account')
  .addParam(
    'account',
    'Account to grant authorization',
    undefined,
    types.string
  )
  .setAction(addAuthorizedAccount)
