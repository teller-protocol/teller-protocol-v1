const Ganache = require("ganache-core");
const ethers = require("ethers");
const envConfig = require("../../config/env")();
const { maxGasLimit, tokens } = require("../../config/networks/ganache-ropsten");

// Environment Configuration
const addressCountValue = envConfig.getAddressCount().getOrDefault();
const mnemonic = envConfig.getMnemonic().get();
const infuraKeyValue = envConfig.getInfuraKey().get();
const gasKeyValue = envConfig.getGasWei().getOrDefault();
const gasPriceKeyValue = envConfig.getGasPriceGwei().getOrDefault();

const pathPrefix = "m/44'/60'/0'/0/"

async function main() {
  let accountsToUnlock = ["0x254c616922B637713524459Db4d9FC1550D0fE07"]
  for (const symbol in tokens) {
    if (symbol === 'ETH') continue
    accountsToUnlock.push(tokens[symbol])
  }
  if (process.env.ACCOUNTS) {
    accountsToUnlock = accountsToUnlock.concat(process.env.ACCOUNTS.split(","));
  }
  console.log(accountsToUnlock)

  const host = `https://ropsten.infura.io/v3/${infuraKeyValue}`;

  const server = Ganache.server({
    unlocked_accounts: accountsToUnlock,
    locked: false,
    fork: host,
    network_id: 3,
    debug: true,
    mnemonic,
    total_accounts: addressCountValue,
    default_balance_ether: 100000,
    gasLimit: ethers.utils.hexlify(maxGasLimit),
    gasPrice: ethers.utils.hexlify(parseInt(gasPriceKeyValue))
  });

  server.listen(4546, (err, blockchain) => {
    console.log("Ganache chain started");
  });
}

main()