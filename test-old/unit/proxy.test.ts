import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { Signer } from 'ethers'
import hre from 'hardhat'

import {
  InitializeableBeaconProxy,
  TTokenLogicTester,
  TTokenV1,
} from '../../types/typechain'

chai.should()
chai.use(solidity)

describe('Proxies', () => {
  describe('Logic Contract', () => {
    describe('Auto Initialization', () => {
      describe('Should not be able to initialize logic contract after deployment', () => {
        let attacker: Signer

        before(async () => {
          attacker = await hre.getNamedSigner('attacker')
        })

        it('InitializeableBeaconProxy', async () => {
          const ibpFactory = await hre.ethers.getContractFactory(
            'InitializeableBeaconProxy'
          )
          const ibpLogic =
            (await ibpFactory.deploy()) as InitializeableBeaconProxy
          await ibpLogic
            .connect(attacker)
            .initialize(ibpLogic.address, '0x')
            .should.be.revertedWith('Beacon: already initialized')
        })

        it('TToken', async () => {
          const tTokenFactory = await hre.ethers.getContractFactory(
            'TToken_V1',
            attacker
          )
          const logicTesterFactory = await hre.ethers.getContractFactory(
            'TTokenLogicTester',
            attacker
          )

          const tTokenLogic = (await tTokenFactory.deploy()) as TTokenV1
          const tester =
            (await logicTesterFactory.deploy()) as TTokenLogicTester
          const dai = await hre.tokens.get('dai')

          await tester
            .connect(attacker)
            .attack(
              tTokenLogic.address,
              await attacker.getAddress(),
              dai.address
            )
            .should.be.revertedWith(
              'Initializable: contract is already initialized'
            )
        })
      })
    })
  })
})
