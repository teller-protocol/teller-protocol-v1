import fs, { mkdirSync } from 'fs'
import glob from 'glob'
import path from 'path'
try {
  mkdirSync(path.join(__dirname, '../new-contracts-truffle'))
} catch (e) {}
const base = glob.sync('contracts/base/**/*.sol/+([a-zA-Z0-9]).json', {
  cwd: path.join(__dirname, '../artifacts'),
})
const interfaces = glob.sync(
  'contracts/interfaces/**/*.sol/+([a-zA-Z0-9]).json',
  {
    cwd: path.join(__dirname, '../artifacts'),
  }
)
const ERC20 = glob.sync(
  '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/**/*.sol/+([a-zA-Z0-9]).json',
  {
    cwd: path.join(__dirname, '../artifacts'),
  }
)
const providers = glob.sync(
  'contracts/providers/**/*.sol/+([a-zA-Z0-9]).json',
  {
    cwd: path.join(__dirname, '../artifacts'),
  }
)
base.concat(interfaces, ERC20, providers).forEach((pth) => {
  const fileName = pth.split('/').pop()
  fs.writeFileSync(
    path.join(__dirname, '../new-contracts-truffle', fileName as string),
    fs.readFileSync(path.join(__dirname, '../artifacts', pth))
  )
})
