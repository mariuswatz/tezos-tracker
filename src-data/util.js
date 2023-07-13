import dayjs from 'dayjs'
import { toUSD, toEUR } from './xtz-historical.js'
import { request, gql } from 'graphql-request'
import fs from 'fs'
import * as TEZ from './constants.js'

let LOCALE = 'en-us'

export const dataSet = { tzProfiles: {} }

export function setLocale(localeStr) {
  LOCALE = localeStr
}

export function toCSV(csv, delimiter) {
  let out = []

  const cols = csv.columns
  csv.rows.forEach((row) => {
    const arr = []
    cols.forEach((str) => {
      arr.push(row[str] ? row[str] : '')
    })
    out.push(arr.join(delimiter))
  })

  return out
}

export function loadTzProfiles() {
  let TEIA_USERS_FILE = './src-data/20230423-teia-users-short.tsv'

  if (fs.existsSync(TEIA_USERS_FILE)) {
    const teiaUsers = {}

    const TAB = '\t'
    let data = fs.readFileSync(TEIA_USERS_FILE, 'utf-8').split('\n')
    data.shift(0)
    data.forEach((ln) => {
      let user = ln.split(TAB)
      if (user[2]) teiaUsers[user[2]] = { alias: user[0], twitter: user[1] }
    })

    console.log(`Teia users: ${Object.keys(teiaUsers).length}`)
    dataSet.teiaUsers = teiaUsers
  }

  if (fs.existsSync('./output/tzProfiles.json')) {
    let data = JSON.parse(fs.readFileSync('./output/tzProfiles.json', 'utf-8'))
    Object.keys(data).forEach((key) => {
      dataSet.tzProfiles[key] = data[key]
    })

    console.log('Loading tzProfiles... ', Object.keys(dataSet.tzProfiles).length + ' profiles')
  }
}

export function saveTzProfiles() {
  if (!fs.existsSync('./output'))
    fs.mkdir('./output/', () => {
      console.log('mkdir output')
    })
  console.log('\nSaving tzProfiles... ', Object.keys(dataSet.tzProfiles).length + ' profiles')
  fs.writeFileSync('./output/tzProfiles.json', JSON.stringify(dataSet.tzProfiles))
}

export async function getUserInfo(tzprof) {
  await request(
    TEZ.TEZTOK_API,
    gql`
      query GetUsers($addresses: [String]) {
        tzprofiles(where: { account: { _in: $addresses } }) {
          account
          alias
          twitter
        }
      }
    `,
    {
      addresses: tzprof,
    }
  ).then((response) => {
    let tzProfiles = dataSet.tzProfiles
    response = response.tzprofiles
    if (response && response.length > 0)
      response.forEach((addr) => {
        if (!tzProfiles[addr.account])
          tzProfiles[addr.account] = {
            alias: addr.alias ? addr.alias : '',
            twitter: addr.twitter ? addr.twitter : '',
          }
      })
    console.log(`getUserInfo - ${Object.keys(tzProfiles).length} aliases`)
  })
}

export function getAlias(wallet) {
  if (!wallet) return wallet

  let teiaUser = dataSet.teiaUsers[wallet] ? dataSet.teiaUsers[wallet] : undefined
  let user = dataSet.tzProfiles[wallet] ? dataSet.tzProfiles[wallet] : undefined
  const options = []
  if (user && user.alias) options.push(user.alias)
  if (teiaUser && teiaUser.alias) options.push(teiaUser.alias)
  if (user && user.twitter) options.push(user.twitter)
  if (teiaUser && teiaUser.twitter) options.push(teiaUser.twitter)
  options.push(shortenTzAddress(wallet))

  return options[0]
}

export function calcRoyaltyPayment(sale, inEuro = false) {
  let royalty
  if (sale.token[SELLER] != sale.token[ARTIST]) {
    royalty = sale.price * (0.01 * (sale.token[ROYALTY] / 10000))
  }

  return inEuro ? toEUR(sale.timestamp, royalty) : royalty
}

export function mapValue(type, row) {
  let fieldType = TEZ.CSV_TYPES[type] ? TEZ.CSV_TYPES[type] : TEZ.STRING
  // if(fieldType==TEZ.FIAT && row[type]) {
  //   return
  // }
  return row[type]
}

export function processRow(row) {
  const keys = Object.keys(row)
  keys.forEach((key) => {
    if (!row[key]) console.log(`${key} has no value`)
    else {
      row[key] = mapValue(key, row)
    }
  })
}

export function getTokenCSV(tokens, csvColumns) {
  let csv = { columns: csvColumns }
  let rows = [csvColumns]

  tokens.events.forEach((ev) => {
    const row = {}
    csvColumns.forEach((col) => {
      let val = '-'
      try {
        if (col == AMOUNT) row[TEZ.AMOUNT] = ev.amount ? ev.amount : 1
        if (col == TEZ.ARTIST) row[TEZ.ARTIST] = getAlias(ev.token[ARTIST])
        if (col == TEZ.BUYER && ev.buyer_address) row[TEZ.BUYER] = getAlias(ev.buyer_address)
        if (col == TEZ.EDITIONS) row[col] = ev.token.editions
        if (col == TEZ.FA2) row[col] = ev.token.fa2_address
        if (col == TEZ.MINTER && ev.token.minter_address) row[col] = ev.token[TEZ.MINTER]
        if (col == TEZ.OPHASH) row[col] = ev.ophash
        if (col == TEZ.PLATFORM) row[col] = ev.token.platform
        if (col == TEZ.LAST_SALE_AT && ev.token[LAST_SALE_AT]) row[col] = ev.token[LAST_SALE_AT]
        if (col == TEZ.LAST_SALES_PRICE && ev.token[LAST_SALES_PRICE])
          row[col] = {
            price: ev.token[LAST_SALES_PRICE],
            timestamp: ev.token[TEZ.LAST_SALE_AT],
          }
        if (col == TEZ.LAST_SALES_PRICE_EUR && ev.token[LAST_SALES_PRICE]) row[col] = ev.token[LAST_SALES_PRICE]
        if (col == TEZ.PRICE && ev.price) row[col] = ev.price
        if (col == TEZ.PRICE_EUR && ev.price) row[col] = ev.price
        if (col == TEZ.NAME) row[col] = clean(ev.token.name)
        if (col == TEZ.URL) row[col] = getTokenLink(ev.token)
        if (col == TEZ.THUMBNAIL) row[col] = ev.token.thumbnail_uri ? ev.token.thumbnail_uri : ''
        if (col == TEZ.SELLER && ev[TEZ.SELLER]) row[col] = ev[TEZ.SELLER]
        if (col == TEZ.SALES_VOLUME && ev.token[TEZ.SALES_VOLUME]) row[col] = ev.token[TEZ.SALES_VOLUME]
        if (col == ROYALTY && ev.token[TEZ.ROYALTY]) row[col] = ev.token[TEZ.ROYALTY] / 10000
        // if (col == 'royalty_paid' && ev.token[ROYALTY]) {
        //   let paid = calcRoyaltyPayment(ev)
        //   row[col] =paid ? formatTz(paid) : ''
        // }
        // if (col == 'royalty_paid_eur' && ev.token[ROYALTY]) {
        //   let paid = calcRoyaltyPayment(ev, true)
        //   row[col] =paid ? formatTz(paid) : ''
        // }
        if (col == TEZ.TIME) row[TEZ.TIME] = ev.timestamp
        if (col == TEZ.TOKEN_ID) row[TEZ.TOKEN_ID] = ev.token.token_id
        if (col == TEZ.TYPE) row[TEZ.TYPE] = ev.type
      } catch (e) {
        val = 'err'
      }
    })
    rows.push(row)
  })

  csv.rows = rows

  return csv
}

export function timestamp() {
  return dayjs().format(TEZ.YYMMDDHHMM)
}

export function tzToUSD(date, amount) {
  return toUSD(date, amount)
}

export function clean(str, maxChar) {
  if (!str) return '--'
  str = str.replaceAll(/(\r\n|\n|\r)/gm, '')
  if (str.length > maxChar) str = str.substring(0, maxChar)
  return str
}

export function nf(str) {
  if (!str) return ''
  let out = str
  if (typeof str === 'number') out = str.toLocaleString(LOCALE, { maximumFractionDigits: 2 })
  else console.log(`not number? '${str}'`)

  return out.replaceAll(' ', '').replaceAll('-', '-')
}

export function formatTz(amount) {
  if (!amount) return ''
  return nf(amount / 1000000)
}

export function shortenTzAddress(address) {
  return `${address.substr(0, 5)}…${address.substr(-5)}`
}

export function tokenIdent(token) {
  return `${token[FA2]}/${token.token_id}`
}

export function getTokenLink(token) {
  switch (token.platform) {
    case 'HEN': {
      return `https://teia.art/objkt/${token.token_id}`
    }
    case 'FXHASH': {
      if (token.fa2_address === 'KT1EfsNuqwLAWDd3o4pvfUx1CAh5GMdTrRvr') {
        return `https://www.fxhash.xyz/gentk/FX1-${token.token_id}`
      } else {
        return `https://www.fxhash.xyz/gentk/${token.token_id}`
      }
    }
    case 'VERSUM': {
      return `https://versum.xyz/token/versum/${token.token_id}`
    }
    case 'TYPED': {
      return `https://typed.art/${token.token_id}`
    }
    case '8BIDOU': {
      if (token.fa2_address === 'KT1MxDwChiDwd6WBVs24g1NjERUoK622ZEFp') {
        return `https://www.8bidou.com/listing/?id=${token.token_id}`
      }

      if (token.fa2_address === 'KT1TR1ErEQPTdtaJ7hbvKTJSa1tsGnHGZTpf') {
        return `https://ui.8bidou.com/item_g/?id=${token.token_id}`
      }

      if (token.fa2_address === 'KT1VikAWA8wQHLZgHoAGL7Z9kCjgbCEnvWA3') {
        return `https://www.8bidou.com/r_item/?id=${token.token_id}`
      }
      break
    }
    default: {
      return `https://objkt.com/asset/${token.fa2_address}/${token.token_id}`
    }
  }
}

export function sortEvents(data) {
  data.events.sort((a, b) => {
    return dayjs(a.timestamp).diff(dayjs(b.timestamp))
  })
}

export function getPeriods(data) {
  const period = {}
  let arrKey = Object.keys(data)[0]

  data[arrKey].forEach((tok) => {
    const year = dayjs(tok.timestamp).year()

    if (!period[year]) period[year] = []
    period[year].push(tok)
  })

  let str = 'getPeriods - '
  Object.keys(period).forEach((key) => {
    str += `${key}: ${period[key].length}`
  })

  return period
}

export async function getThumb(token) {
  let fileExt

  try {
    const filename = `output/thumb/${token.token.fa2_address}_${token.token.token_id}`

    const found = false
    let cnt = 0
    const dir = fs.readdirSync('output/thumb/')
    dir.forEach((file) => {
      cnt++
      if (file.indexOf(filename) > -1) found = true
    })

    if (found) {
      console.log('Thunbnail found. ', filename)
      return
    } else {
      let uri = token.token.thumbnail_uri.substring(7)
      if (token.token.fx_collection_thumbnail_uri) uri = token.token.fx_collection_thumbnail_uri.substring(7)

      let file = 'https://ipfs.io/ipfs/' + uri
      console.log(`${cnt} thumbs`, 'getThumb', "'" + token.token.name + "'", file)
      var req = await fetch(file)

      fileExt = req.headers.get('content-type')
      if (fileExt.startsWith('text')) {
        fileExt = 'txt'
      } else fileExt = fileExt.substring(fileExt.indexOf('/') + 1)

      if (fileExt.indexOf('.') > -1) fileExt = fileExt.substring(0, fileExt.indexOf('.'))

      let binary
      if (fileExt.startsWith('txt')) binary = await req.text()
      else binary = await req.arrayBuffer()

      if (fileExt.startsWith('txt')) fs.writeFileSync(`${filename}.${fileExt}`, binary)
      else fs.writeFileSync(`${filename}.${fileExt}`, new Int8Array(binary))
      console.log('file type', req.headers.get('content-type'), fileExt, '\t' + token.token.name)
    }
  } catch (e) {
    console.log('getThumb:', fileExt, e, token)
  }
}
