/* eslint-disable no-console */
// Local (no-fork) verification of the PolyTellerNFT upgrade + recoverAdmin flow.
// Stands up the real OZ TransparentUpgradeableProxy stack with the proxy admin
// set to the address hardcoded in PolyTellerNFT.PROXY_ADMIN, reproduces the
// "ADMIN held by someone else" situation, then proves the recovery path.
//
// Run: TESTING=1 yarn hardhat run scripts/verify-recover-admin-fork.ts
import hre, { artifacts, ethers } from 'hardhat'

// Must match the constant hardcoded in contracts/nft/polygon/PolyTellerNFT.sol
const PROXY_ADMIN = '0x00BfeCF575FBDF4367dD70Dc9c729475173dBABf'
const ADMIN_ROLE =
  '0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42'

const ok = (c: boolean, m: string): void => {
  console.log(`${c ? '✅' : '❌ FAIL'}  ${m}`)
  if (!c) process.exitCode = 1
}

async function main(): Promise<void> {
  const deployer = (await ethers.getSigners())[0]
  // The repo configures a single signer; mint extra funded accounts for the test.
  const fund = async (w: any): Promise<any> => {
    await hre.network.provider.send('hardhat_setBalance', [
      w.address,
      '0x' + ethers.parseEther('100').toString(16),
    ])
    return w.connect(ethers.provider)
  }
  const newAdmin = await fund(
    new ethers.Wallet(
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      ethers.provider
    )
  )
  const rando = await fund(
    new ethers.Wallet(
      '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      ethers.provider
    )
  )
  const dummyOld = ethers.Wallet.createRandom() // only its address is used

  const nftArt = await artifacts.readArtifact('PolyTellerNFT')
  // OZ proxy ships as a prebuilt artifact (not a project source) — load directly.
  const proxyArt = require('@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json')
  const nftIface = new ethers.Interface(nftArt.abi)

  // 1) Deploy logic impl #1 and the transparent proxy, with the proxy admin set
  //    to the hardcoded PROXY_ADMIN. initialize() runs from `deployer`, so
  //    `deployer` receives ADMIN.
  const implFactory = new ethers.ContractFactory(
    nftArt.abi,
    nftArt.bytecode,
    deployer
  )
  const impl1 = await implFactory.deploy()
  await impl1.waitForDeployment()

  const initData = nftIface.encodeFunctionData('initialize', ['0x'])
  const proxyFactory = new ethers.ContractFactory(
    proxyArt.abi,
    proxyArt.bytecode,
    deployer
  )
  const proxy = await proxyFactory.deploy(
    await impl1.getAddress(),
    PROXY_ADMIN,
    initData
  )
  await proxy.waitForDeployment()
  const proxyAddr = await proxy.getAddress()
  const nft = new ethers.Contract(proxyAddr, nftArt.abi, ethers.provider)

  ok(await nft.hasRole(ADMIN_ROLE, deployer.address), 'setup: deployer got ADMIN at init')

  // 2) Reproduce the live situation: ADMIN sits with an address we do NOT
  //    control, and we hold neither ADMIN nor anything but the proxy admin key.
  await (await nft.connect(deployer).grantRole(ADMIN_ROLE, dummyOld.address)).wait()
  await (await nft.connect(deployer).revokeRole(ADMIN_ROLE, deployer.address)).wait()
  ok(await nft.hasRole(ADMIN_ROLE, dummyOld.address), 'setup: ADMIN handed to an unrecognized holder')
  ok(!(await nft.hasRole(ADMIN_ROLE, newAdmin.address)), 'setup: target does NOT yet hold ADMIN')

  // 3) We control only the proxy admin (PROXY_ADMIN). Impersonate + fund it.
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [PROXY_ADMIN],
  })
  await hre.network.provider.send('hardhat_setBalance', [
    PROXY_ADMIN,
    '0x' + ethers.parseEther('100').toString(16),
  ])
  const adminSigner = await ethers.getSigner(PROXY_ADMIN)

  // 4) Deploy logic impl #2 (the new build) and atomically upgrade + recover.
  const impl2 = await implFactory.deploy()
  await impl2.waitForDeployment()
  const proxyAsAdmin = new ethers.Contract(proxyAddr, proxyArt.abi, adminSigner)
  const recoverData = nftIface.encodeFunctionData('recoverAdmin', [newAdmin.address])
  await (
    await proxyAsAdmin.upgradeToAndCall(await impl2.getAddress(), recoverData)
  ).wait()

  // 5) Postconditions.
  ok(await nft.hasRole(ADMIN_ROLE, newAdmin.address), 'recoverAdmin granted ADMIN to the target')

  // recoverAdmin must not be replayable by an ordinary caller.
  let reverted = false
  try {
    await (await nft.connect(rando).recoverAdmin(rando.address)).wait()
  } catch {
    reverted = true
  }
  ok(reverted, 'recoverAdmin reverts for a non-ProxyAdmin caller (not a standing backdoor)')

  // Standard role management now works from the recovered ADMIN.
  await (await nft.connect(newAdmin).revokeRole(ADMIN_ROLE, dummyOld.address)).wait()
  ok(!(await nft.hasRole(ADMIN_ROLE, dummyOld.address)), 'old holder revoked via standard revokeRole')

  // The recovered ADMIN can use the new powers (adminMint / adminBurn).
  const before = await nft.balanceOf(newAdmin.address, 1)
  await (await nft.connect(newAdmin).adminMint(newAdmin.address, 1, 5)).wait()
  const after = await nft.balanceOf(newAdmin.address, 1)
  ok(after - before === 5n, 'adminMint works from the recovered ADMIN')
  await (await nft.connect(newAdmin).adminBurn(newAdmin.address, 1, 2)).wait()
  ok((await nft.balanceOf(newAdmin.address, 1)) === 3n, 'adminBurn works from the recovered ADMIN')

  console.log(process.exitCode === 1 ? '\nSOME CHECKS FAILED' : '\nALL CHECKS PASSED')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
