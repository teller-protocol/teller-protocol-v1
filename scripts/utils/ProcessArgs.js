
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

module.exports = ProcessArgs;