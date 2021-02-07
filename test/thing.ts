// import { writeFileSync } from 'fs';
// import { expect } from 'chai';
// import { ethers } from 'hardhat';
// import { Dummy, Dummy__factory, Settings__factory } from '../typechain';

// before(async () => {
//   console.log('Running Global setup');

//   let snapshots = [];

//   for (let i = 0; i < 10; i++) snapshots.push(await ethers.provider.send('evm_snapshot', []));

//   writeFileSync(
//     '/tmp/hardhat-test-state',
//     JSON.stringify({
//       snapshots,
//       contracts: {
//         Dummy: dummy.address,
//       },
//     })
//   );
// });
