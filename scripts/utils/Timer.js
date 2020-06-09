// See details: https://medium.com/sablier/writing-accurate-time-dependent-truffle-tests-8febc827acb5
class Timer {
  constructor(web3) {
      this.web3 = web3;
  }
}

const handleResultOrError = async (web3, title, {resolve, reject}, err, result, log = (_) => {}) => {
  if (err || result.error || !result.result) {
    console.log(`${title} - Error: ${JSON.stringify(result)}`);
    return reject(err);
  }
  const block = await web3.eth.getBlock("latest");
  console.log(`Latest block #: ${block.number}`);
  log(block);
  return resolve(result);
};

Timer.prototype.takeSnapshot = function () {
  console.log(`Taking blockchain snapshot.`);
  return new Promise((resolve, reject) => {
    this.web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_snapshot",
        id: new Date().getTime(),
      },
      async (err, snapshotId) => {
        await handleResultOrError(
          this.web3,
          'TakingSnapshot',
          { resolve, reject },
          err,
          snapshotId,
          () => console.log(`Taking blockchain snapshot ID ${snapshotId.result}. Result: ${JSON.stringify(snapshotId)}`)
        );
      },
    );
  });
};

Timer.prototype.advanceBlockAtTime = function (time) {
  return new Promise((resolve, reject) => {
    this.web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        params: [time],
        id: new Date().getTime(),
      },
      (err, result) => {
        handleResultOrError(
          'AdvanceBlockAtTime',
          { resolve, reject },
          err,
          result,
          () => console.log(`Advancing block at time ${time}. Result: ${JSON.stringify(result)}`)
        );
      },
    );
  });
};


Timer.prototype.revertToSnapshot = function (id) {
  return new Promise((resolve, reject) => {
    this.web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_revert",
        params: [id],
        id: new Date().getTime(),
      },
      async (err, result) => {
        await handleResultOrError(
          this.web3,
          'RevertingToSnapshot',
          { resolve, reject },
          err,
          result,
          () => console.log(`Reverting to snapshot ID ${id}. Result: ${JSON.stringify(result)}`)
        );
      },
    );
  });
};

module.exports = Timer;