import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { ITellerDiamond } from '../../types/typechain'

interface PauseProtocolArgs {
  id?: string
  state: boolean
}

const pauseProtocol = async (
  args: PauseProtocolArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, getNamedSigner, ethers, log } = hre

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const deployer = await getNamedSigner('deployer')

  log('')

  let ID = ethers.utils.formatBytes32String('')
  if (args.id == null) {
    log(`Pausing the entire Teller Protocol`, { indent: 1, star: true })
  } else {
    ID = ethers.utils.id(args.id)

    log(`Pausing the Teller Protocol ID "${args.id}" (${ID})`, {
      indent: 1,
      star: true,
    })
  }

  await diamond.connect(deployer).pause(ID, args.state)
}

task('pause-protocol', 'Pause the whole Teller Protocol or a specific ID')
  .addOptionalParam(
    'id',
    'A specific id of the Teller Protocol to pause',
    undefined,
    types.string
  )
  .addOptionalParam(
    'state',
    'Indicate what paused state the protocol should be in',
    true,
    types.boolean
  )
  .setAction(pauseProtocol)
