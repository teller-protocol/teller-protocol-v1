const Ganache = require("ganache-core");
const ethers = require("ethers");
const envConfig = require("../../config/env")();
const { maxGasLimit } = require("../../config/networks/ganache-mainnet");

// Environment Configuration
const addressCountValue = envConfig.getAddressCount().getOrDefault();
const mnemonic = envConfig.getMnemonic().get();
const infuraKeyValue = envConfig.getInfuraKey().get();
const gasKeyValue = envConfig.getGasWei().getOrDefault();
const gasPriceKeyValue = envConfig.getGasPriceGwei().getOrDefault();

const pathPrefix = "m/44'/60'/0'/0/"

async function main() {
  let accountsToUnlock = []
  if (process.env.ACCOUNTS) {
    accountsToUnlock = accountsToUnlock.concat(process.env.ACCOUNTS.split(","));
  }
  console.log(accountsToUnlock)

  const host = `https://mainnet.infura.io/v3/${infuraKeyValue}`;

  const server = Ganache.server({
    unlocked_accounts: accountsToUnlock,
    logger: console,
    locked: false,
    fork: host,
    network_id: 1,
    mnemonic,
    total_accounts: addressCountValue,
    default_balance_ether: 100000,
    gasLimit: ethers.utils.hexlify(maxGasLimit),
    gasPrice: ethers.utils.hexlify(parseInt(gasPriceKeyValue))
  });

  server.listen(4545, (err, blockchain) => {
    console.log("Ganache chain started");
  });
}

main()