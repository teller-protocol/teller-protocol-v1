// Smart contracts

// Util classes
const SignatureValidator = artifacts.require("./mock/util/SignatureValidator.sol");

module.exports = async (callback) => {
    try {
        const newInstance  = await SignatureValidator.new();
        console.log(`SignatureValidator deployed at :${newInstance.address}`);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
