const TEZTOK_API = 'https://api.teztok.com/v1/graphql'
import { getHoldings, getMultiples, getActiveListings, getCollectionInfo } from './tools.js'
import { updateXTZData } from './xtz-historical.js'
import { setLocale, dataSet, loadTzProfiles, saveTzProfiles, getAlias } from './util.js'

setLocale('no-NO')

function main() {
  updateXTZData()
  // process.exit(0)
}

const profiles = [
  'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
  'tz1MH7vTRc4yXkttnoU93CYqiZfhEzk7C17a',
  'tz1TSWEDs9wcBx2KiRzVzyzECsNpRiZaLJ1D',
  'tz1dEF5ZMTnBSkz2ZQPvpJjwyfeUUyGjeMtf',
  'tz1NgN7FCrSzs4vfMroKXyKE32WsReYD4WPd',
  'tz1MH7vTRc4yXkttnoU93CYqiZfhEzk7C17a',
]

main()
// loadTzProfiles()

// const artistAddress = profiles[0]
// dataSet['wallet'] = artistAddress
// dataSet['walletAlias'] = getAlias(artistAddress)

// console.log('\n\n----------- ', getAlias(artistAddress))

// getActiveListings(artistAddress)

// getHoldings(artistAddress).then(() => {
//   getMultiples()
//   saveTzProfiles()
//   getCollectionInfo()

//   console.log('\n\n-----------\n')
// })
