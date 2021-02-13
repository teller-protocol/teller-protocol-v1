const Ganache = require("ganache-core");
const { config } = require('dotenv')

config()

async function main() {
  let accountsToUnlock = []
  if (process.env.ACCOUNTS) {
    accountsToUnlock = accountsToUnlock.concat(process.env.ACCOUNTS.split(","));
  }

  const host = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;

  const server = Ganache.server({
    unlocked_accounts: accountsToUnlock,
    logger: console,
    locked: false,
    fork: host,
    network_id: 1,
    mnemonic: process.env.MNEMONIC_KEY,
    total_accounts: process.env.ADDRESS_COUNT_KEY,
    default_balance_ether: 100000
  });

  server.listen(4545, (err, blockchain) => {
    console.log("Ganache chain started");
  });
}

main()
