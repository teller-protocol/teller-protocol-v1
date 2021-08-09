import chai from 'chai'
import { BigNumber as BN } from 'ethers'

const areBNs = (obj: any, other: any): boolean =>
  BN.isBigNumber(obj) || BN.isBigNumber(other)

const assertBN = (obj: BN, other: BN, message: string): void => {
  new chai.Assertion(obj.toString()).to.eql(other.toString(), message)
}

chai.Assertion.overwriteMethod(
  'eql',
  (_super) =>
    function (this: any, ...args: any[]) {
      const obj = chai.util.flag(this, 'object')
      const other = args[0]
      const message = args[1]

      if (areBNs(obj, other)) {
        assertBN(obj, other, message)
      } else if (Array.isArray(obj) && Array.isArray(other)) {
        for (let i = 0; i < obj.length; i++) {
          if (areBNs(obj[i], other[i])) {
            assertBN(obj[i], other[i], message)
          }
        }
      } else {
        _super.apply(this, args)
      }
    }
)
