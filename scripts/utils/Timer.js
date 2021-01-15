// See details: https://medium.com/sablier/writing-accurate-time-dependent-truffle-tests-8febc827acb5
class Timer {
  constructor(web3) {
    this.web3 = web3;
  }
}

const isError = (err, result) => {
  return err || result.error || !result.result;
};

const handleResultOrError = async (
  web3,
  title,
  { resolve, reject },
  err,
  result,
  log = (_) => {}
) => {
  if (isError(err, result)) {
    console.log(`${title} - Error: ${JSON.stringify(result)}`);
    console.log(err);
    console.log(result);
    reject(err);
  }
  const block = await web3.eth.getBlock('latest');
  log(block);
  resolve(result);
};

Timer.prototype.getCurrentTimestampInSeconds = async function () {
  const { timestamp } = await this.getLatestBlock();
  return parseInt(timestamp.toString());
};

Timer.prototype.getCurrentTimestamp = async function () {
  const { timestamp } = await this.getLatestBlock();
  return parseInt(timestamp.toString());
};

Timer.prototype.getCurrentDate = async function () {
  const timestamp = await this.getCurrentTimestamp();
  return new Date(parseInt(timestamp.toString()));
};

Timer.prototype.getCurrentTimestampInSecondsAndSum = async function (seconds) {
  const timestamp = await this.getCurrentTimestampInSeconds();
  return parseInt(timestamp.toString()) + parseInt(seconds.toString());
};

Timer.prototype.getLatestBlock = async function () {
  const block = await this.web3.eth.getBlock('latest');
  return block;
};

Timer.prototype.takeSnapshot = function () {
  console.log(`Taking blockchain snapshot.`);
  return new Promise((resolve, reject) => {
    this.web3.currentProvider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_snapshot',
        id: new Date().getTime(),
      },
      async (err, snapshotId) => {
        await handleResultOrError(
          this.web3,
          'TakingSnapshot',
          { resolve, reject },
          err,
          snapshotId,
          () =>
            console.log(
              `Taking blockchain snapshot ID ${
                snapshotId.result
              }. Result: ${JSON.stringify(snapshotId)}`
            )
        );
      }
    );
  });
};

Timer.prototype.advanceBlockAtTime = function (time) {
  return new Promise((resolve, reject) => {
    this.web3.currentProvider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [time],
        id: new Date().getTime(),
      },
      async (err, result) => {
        await handleResultOrError(
          this.web3,
          'AdvanceBlockAtTime',
          { resolve, reject },
          err,
          result,
          () =>
            console.log(
              `New blockchain timestamp/date: ${time} / ${new Date(
                time * 1000
              )}. Result: ${JSON.stringify(result)}`
            )
        );
      }
    );
  });
};

Timer.prototype.revertToSnapshot = function (id) {
  return new Promise((resolve, reject) => {
    this.web3.currentProvider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_revert',
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
          () =>
            console.log(
              `Reverting to snapshot ID ${id}. Result: ${JSON.stringify(result)}`
            )
        );
      }
    );
  });
};

module.exports = Timer;
