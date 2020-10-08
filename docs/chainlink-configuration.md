# How to Configure a Chainlink Aggregator

As a lending platform, Teller uses oracles to get the prices from different markets, like *DAI:ETH*, *USDC:LINK* and others.

To read more about the Oracles supported by  Chainlink, please go to [this link](https://docs.chain.link/docs/reference-contracts).

## Folders Structure

To configure an Oracle, we must add a new entry in the ```chainlink.js``` file located in the ```./config/networks/NETWORK/``` folder, where ***NETWORK*** is the network you are working on. For example: if you want to configure an Oracle in the ropsten testnet, then NETWORK placeholder is 'ropsten'.

## Collateral Tokens

Now Teller is supporting the following collateral tokens:

- ETH
- LINK

## Configure

To configure a new Chainlink oracle, we need the following values:

```json
  "DAI_ETH": {
    "address": "CHAINLINK_ORACLE_ADDRESS",
    "inversed": false,
    "collateralDecimals": 18,
    "responseDecimals": 18,
    "baseTokenName": "DAI",
    "quoteTokenName": "ETH"
  },
```

In the example, we want to configure the oracle for the market DAI:ETH.

- **address**: This is the Chainlink address for the current market (DAI:ETH). We need to check the Oracles supported by Chainlink [here](https://docs.chain.link/docs/reference-contracts).
- **baseTokenName**: the base token for the market DAI:ETH is DAI.
- **quoteTokenName**: the quote token for the market DAI:ETH is ETH.
- **collateralDecimals**: As we want to use ETH as collateral, the collateral decimals is 18.
- **responseDecimals**: This value depends on the Chainlink Oracle. We need to see a response value to see the decimals.
- **inverse**: If the *quoteTokenName* is equal to our collateral token, it must be false. Otherwise it must be true (because we need to inverse the oracle response).
