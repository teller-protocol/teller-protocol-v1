const advanceTimeAndBlock = async (time) => {
    await advanceTime(time);
    await advanceBlock();

    return Promise.resolve(web3.eth.getBlock('latest'));
}

const advanceTime = async (time) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [time],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err); }
            return resolve(result);
        });
    });
}

const advanceBlock = async () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err); }
            const newBlockHash = web3.eth.getBlock('latest').hash;

            return resolve(newBlockHash)
        });
    });
}

const advanceBlocks = async (blocks) => {
    for (let i = 0; i < blocks; i++) {
        await advanceBlock();
    }
    return Promise.resolve(web3.eth.getBlock('latest'));
}

const latestBlock = async () => {
    return Promise.resolve(web3.eth.getBlock('latest'));
}

module.exports = {
    advanceTime,
    advanceBlock,
    advanceTimeAndBlock,
    advanceBlocks,
    latestBlock
}