import chai from 'chai'

chai.Assertion.overwriteMethod(
  'eql',
  (_super) =>
    function (this: any, ...args: any[]) {
      const obj = chai.util.flag(this, 'object')
      if (typeof obj === 'bigint' || typeof args[0] === 'bigint') {
        new chai.Assertion(obj.toString()).to.eql(
          args[0].toString(),
          ...args.slice(1)
        )
      } else {
        _super.apply(this, args)
      }
    }
)
