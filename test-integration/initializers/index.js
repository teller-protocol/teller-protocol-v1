const { printSeparatorLine } = require('../../test/utils/consts');
const _1_set_settings = require('./1_set_settings');

const initializersObject = {
    'init-1-set-settings': _1_set_settings,
};

module.exports = async (initConfig, initContext) => {
    printSeparatorLine();
    console.log('');
    const initializersList = Object.keys(initializersObject).map( key => ({ key, initializerMethod: initializersObject[key]}));
    console.group(`Executing initializers (#${initializersList.length})...`);
    for (const initializer of initializersList) {
        console.group(`Executing initializer: ${initializer.key}`);
        await initializer.initializerMethod(initConfig, initContext);
        console.groupEnd();
    }
    console.groupEnd();
    console.log('');
    printSeparatorLine();
};