import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { ITellerDiamond } from '../../types/typechain'

interface AddAuthorizedAddressArgs {
  address: string
}

export async function addAuthorizedAddress(
  args: AddAuthorizedAddressArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { contracts, log } = hre

  log('')
  log(`Granting ${args.address} AUTHORIZED role`, {
    indent: 1,
    star: true,
  })
  log('')

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  await diamond.addAuthorizedAddress(args.address)

  log('Success!')
  log('')
}

task('add-authorized-address', 'Adds the AUTHORIZED role to an account')
  .addParam(
    'address',
    'Account to grant authorization',
    undefined,
    types.string
  )
  .setAction(addAuthorizedAddress)
