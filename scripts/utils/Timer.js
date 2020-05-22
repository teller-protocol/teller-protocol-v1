
class Timer {
  constructor(web3) {
      this.web3 = web3;
  }
}

Timer.prototype.takeSnapshot = function() {
  return new Promise( (resolve, reject) => {
    this.web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_snapshot',
      id: new Date().getTime()
    }, (err, snapshotId) => {
      if (err) { return reject(err) }
      return resolve(snapshotId)
    })
  });
}

Timer.prototype.advanceTime = function(time) {
  return new Promise( (resolve, reject) => {
    this.web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [time],
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  })
}

Timer.prototype.advanceBlock = function() {
  return new Promise((resolve, reject) => {
    this.web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  });
}

Timer.prototype.advanceBlockAndSetTime = function(time) {
  return new Promise((resolve, reject) => {
      this.web3.currentProvider.send({
          jsonrpc: '2.0',
          method: 'evm_mine',
          params: [time],
          id: new Date().getTime()
      }, (err, result) => {
          if (err) { return reject(err) }
          return resolve(result)
      })
  });
}

Timer.prototype.advanceTimeAndBlock = async function(time) {
    //capture current time
    let block = await web3.eth.getBlock('latest')
    let forwardTime = block['timestamp'] + time

    return new Promise((resolve, reject) => {
      this.web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [forwardTime],
        id: new Date().getTime()
    }, (err, result) => {
        if (err) { return reject(err) }
        return resolve(result)
    })
  });
}

Timer.prototype.revertToSnapshot = async function(id) {
  return new Promise((resolve, reject) => {
    this.web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_revert',
      params: [id],
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  });
}

module.exports = Timer;