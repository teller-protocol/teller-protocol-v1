import Web3 from "web3";

const web3 = new Web3();

module.exports = {
    CTokenAddressAssetSetting: web3.utils.soliditySha3("CTokenAddress"),
    CRVPoolAddressSetting: web3.utils.soliditySha3("CRVPoolAddress"),
    YVaultAddressSetting: web3.utils.soliditySha3("YVaultAddress"),
    MaxLoanAmountSetting: web3.utils.soliditySha3("MaxLoanAmount"),
    Initialized: web3.utils.soliditySha3("Initialized")
}