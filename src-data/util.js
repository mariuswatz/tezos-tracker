import dayjs from 'dayjs'
import { toUSD, toEUR } from './xtz-historical.js'
import { request, gql } from 'graphql-request'

let LOCALE = 'en-us'

export const TEZTOK_API = 'https://api.teztok.com/v1/graphql'
export const YYMMDDHHMM = 'YYYYMMDD-HHmm'
export const TOKEN_ID = 'token_id',
  AMOUNT = 'amount',
  ARTIST = 'artist_address',
  BUYER = 'buyer_address',
  EDITIONS = 'editions',
  FA2 = 'fa2_address',
  MINTER = 'minter_address',
  NAME = 'name',
  OPHASH = 'ophash',
  PLATFORM = 'platform',
  PRICE = 'price',
  PRICE_EUR = 'price_eur',
  SELLER = 'seller_address',
  THUMBNAIL = 'thumbnail_uri',
  TIME = 'time',
  TYPE = 'type',
  URL = 'url'

export const tzProfiles = {}

export function setLocale(localeStr) {
  LOCALE = localeStr
}

export function toCSV(csv, delimiter) {
  let out = []
  csv.forEach((row) => {
    out.push(row.join(delimiter))
  })

  return out
}

export async function getUserInfo(tzprof) {
  return await request(
    TEZTOK_API,
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
    response = response.tzprofiles
    if (response && response.length > 0)
      response.forEach((addr) => {
        if (!tzProfiles[addr.account]) tzProfiles[addr.account] = { alias: addr.alias, twitter: addr.twitter }
      })
  })
}

export function getAlias(wallet) {
  if (!wallet) return wallet
  if (tzProfiles[wallet]) return tzProfiles[wallet].twitter
  else return wallet
}

export function getTokenCSV(tokens, csvColumns) {
  let rows = [csvColumns]

  tokens.events.forEach((ev) => {
    const row = []
    csvColumns.forEach((col) => {
      if (col == AMOUNT) row.push(ev.amount)
      if (col == ARTIST) row.push(getAlias(ev.token[ARTIST])) // row.push(ev.token.artist_address)
      if (col == BUYER) row.push(getAlias(ev.buyer_address))
      if (col == EDITIONS) row.push(ev.token.editions)
      if (col == FA2) row.push(ev.token.fa2_address)
      if (col == MINTER) row.push(ev.token.minter_address)
      if (col == OPHASH) row.push(ev.ophash)
      if (col == PLATFORM) row.push(ev.token.platform)
      if (col == PRICE) row.push(formatTz(ev.price))
      if (col == PRICE_EUR) row.push(toEUR(ev.timestamp, ev.price).toLocaleString(LOCALE))
      if (col == NAME) row.push(ev.token.name)
      if (col == URL) row.push(getTokenLink(ev.token))
      if (col == THUMBNAIL) row.push(ev.token.thumbnail_uri)
      if (col == SELLER) row.push(getAlias(ev.seller_address))
      if (col == TIME) row.push(dayjs(ev.timestamp).format(YYMMDDHHMM))
      if (col == TOKEN_ID) row.push(ev.token.token_id)
      if (col == TYPE) row.push(ev.type)
    })
    rows.push(row)
  })
  return rows
}

export function timestamp() {
  return dayjs().format(YYMMDDHHMM)
}

export function tzToUSD(date, amount) {
  return toUSD(date, amount)
}

export function nf(str) {
  if (typeof str === 'number') str = str.toLocaleString(LOCALE)
  let pos = str.indexOf('.')
  if (pos < 0) pos = str.indexOf(',')
  if (pos > 0 && pos < str.length - 2) str = str.substring(0, pos + 2)
  return str
}

export function formatTz(amount) {
  // if (!isNumber(amount)) {
  //   return '–'
  // }

  const amountFixed = (amount / 1000000).toLocaleString(LOCALE)

  return `${amountFixed.endsWith('00') ? amountFixed.slice(0, -3) : amountFixed}`
}

export function shortenTzAddress(address) {
  return `${address.substr(0, 5)}…${address.substr(-5)}`
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
