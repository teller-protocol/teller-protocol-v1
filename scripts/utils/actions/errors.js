const assert = require('assert');

const handleContractError = async (
  labelText,
  { testContext },
  { fnPromise, expectedErrorMessage = undefined }
) => {
  const { verbose } = testContext;
  const shouldFail = expectedErrorMessage !== undefined;
  if (shouldFail) {
    try {
      await assert.rejects(fnPromise, (error) => {
        assert(shouldFail, `${labelText}: It should have failed.`);
        assert.equal(error.reason, expectedErrorMessage);
      });
    } catch (error) {
      if (verbose) {
        console.log(error);
      }
      assert(shouldFail, `${labelText}: It should have failed.`);
      assert.equal(error.reason, expectedErrorMessage);
      console.log(`${labelText}: expected error '${error.reason}'`);
      return {
        failed: true,
        expectedErrorMessage,
      };
    }
  } else {
    const result = await fnPromise();
    return {
      failed: false,
      expectedErrorMessage,
      tx: result,
    };
  }
};

module.exports = {
  handleContractError,
};
