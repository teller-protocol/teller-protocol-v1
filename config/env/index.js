const EnvConfig = require('./EnvConfig');

module.exports = () => {
    const envConfig = new EnvConfig();
    envConfig.validate();
    console.log('Environment variables were validated.');
    return envConfig;
};
