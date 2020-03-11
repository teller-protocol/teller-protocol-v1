const _ = require('lodash');

class EnvValue {
    constructor(key, value, defaultValue, description) {
        this.key = key;
        this.value = value;
        this.defaultValue = defaultValue;
        this.description = description;
    }
}

EnvValue.prototype.hasValue = function() {
    return  !_.isUndefined(this.value) &&
            !_.isNull(this.value);
}

EnvValue.prototype.get = function() {
    return this.value;
}

EnvValue.prototype.getOrDefault = function() {
    return this.hasValue() ? this.get() : this.defaultValue;
}

module.exports = EnvValue;