export interface DeployConfig {
  network:
    | 'ganache-mainnet'
    | 'kovan'
    | 'mainnet'
    | 'rinkeby'
    | 'ropsten'
    | 'soliditycoverage'
    | 'test';
  deployerAddress: string;
}
