import fs, { mkdirSync } from 'fs'
import glob from 'glob'
import path from 'path'
try {
  mkdirSync(path.join(__dirname, '../new-contracts-truffle'))
} catch (e) {}
const base = glob.sync('base/**/*.sol/+([a-zA-Z0-9]).json', {
  cwd: path.join(__dirname, '../artifacts/contracts'),
})
const interfaces = glob.sync('interfaces/**/*.sol/+([a-zA-Z0-9]).json', {
  cwd: path.join(__dirname, '../artifacts/contracts'),
})

base.concat(interfaces).forEach((pth) => {
  const fileName = pth.split('/').pop()
  fs.writeFileSync(
    path.join(__dirname, '../new-contracts-truffle', fileName as string),
    fs.readFileSync(path.join(__dirname, '../artifacts/contracts/', pth))
  )
})
