
class ProcessArgs {
    constructor(defaultNetwork = 'test', args = process.argv) {
        this.params = args;
        this.defaultNetwork = defaultNetwork;
    }
}

ProcessArgs.prototype.network = function() {
    for (const index in this.params) {
        const param = this.params[index];
        if(param.toLowerCase() === '--network') {
            const indexNumber = parseInt(index);
            return this.params.length >= (indexNumber + 1) ? this.params[(indexNumber + 1)] : this.defaultNetwork;
        }
    }
    return this.defaultNetwork;
}

ProcessArgs.prototype.getCurrentConfig = function() {
    const network = this.network();
    console.log(`Script will be executed in network ${network}.`)
    const appConf = require('../../config')(network);
    return appConf;
}

module.exports = ProcessArgs;