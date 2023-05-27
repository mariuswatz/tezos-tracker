const TEZTOK_API = 'https://api.teztok.com/v1/graphql'
import { getHoldings } from './tools.js'

import { setLocale, loadTzProfiles, saveTzProfiles, getAlias } from './util.js'

setLocale('no-NO')

const profiles = [
  'tz1MH7vTRc4yXkttnoU93CYqiZfhEzk7C17a',
  'tz1TSWEDs9wcBx2KiRzVzyzECsNpRiZaLJ1D',
  'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
  'tz1dEF5ZMTnBSkz2ZQPvpJjwyfeUUyGjeMtf',
  'tz1NgN7FCrSzs4vfMroKXyKE32WsReYD4WPd',
  'tz1MH7vTRc4yXkttnoU93CYqiZfhEzk7C17a',
]
const artistAddress = profiles[0]

loadTzProfiles()
console.log('\n\n----------- ', getAlias(artistAddress))

getHoldings(artistAddress).then(() => {
  saveTzProfiles()

  console.log('\n\n-----------\n')
})
