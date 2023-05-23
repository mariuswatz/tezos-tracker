import { request, gql } from 'graphql-request'
import { QuerySales, QueryCollects } from './query.js'
import { getPeriods, sortEvents } from './tokenUtil.js'
import { formatTz, getTokenLink, TEZTOK_API, YYMMDDHHMM } from './util.js'
import dayjs from 'dayjs'
import fs from 'fs'

const TOKEN_ID = 'token_id',
  TIME = 'time',
  PLATFORM = 'platform',
  PRICE = 'price',
  EDITIONS = 'editions',
  NAME = 'name',
  SELLER = 'seller_address',
  BUYER = 'buyer_address',
  FA2 = 'fa2_address',
  URL = 'url',
  THUMBNAIL = 'thumbnail_uri',
  TYPE = 'type',
  OPHASH = 'ophash'

async function queryHoldings(wallet) {
  return await request(
    TEZTOK_API,
    gql`
      ${QueryCollects}
    `,
    {
      wallet: wallet,
    }
  )
}

async function querySales(wallet) {
  return await request(
    TEZTOK_API,
    gql`
      ${QuerySales}
    `,
    {
      wallet: wallet,
    }
  )
}

export async function getHoldings(wallet) {
  let query

  await queryHoldings(wallet).then((response) => {
    query = response
  })

  // await querySales(wallet).then((response) => {
  //   response.events.forEach((ev) => query.events.push(ev))
  // })

  console.log('tokens', query.events ? query.events.length : 'no events!')
  sortEvents(query)

  const csvColumns = [TIME, OPHASH, TYPE, PLATFORM, TOKEN_ID, PRICE, EDITIONS, NAME, SELLER, BUYER, FA2, URL, THUMBNAIL]

  let csv = getCSV(query, csvColumns)

  let out = toCSV(csv, '\t')
  fs.writeFileSync(`output/sales.csv`, out.join('\n'))

  //   Object.keys(csv).forEach((key) => {
  //     fs.writeFileSync(`output/${key}.csv`, csv[key].join('\n'))
  //   })
  /*
    const createdCnt = tokens[key].length
    console.log('QueryHoldings - Success. ' + createdCnt + ' tokens')
    fs.writeFileSync('output/holdings.json', JSON.stringify(response))

    let headers = 'time\tplatform\ttoken_id\tprice\teditions\tname\tseller\tfa2_address\turl\tthumbnail_uri'
    const csvOut = [headers]
    let sum = 0
    tokens[key].forEach((tok) => {
      let time = dayjs(tok.timestamp).format(YYMMDDHHMM)
      sum += tok.price
      csvOut.push(
        `${time}\t${tok.token.platform}\t${tok.token.token_id}\t${formatTz(tok.price).replace('.', ',')}\t${formatTz(
          sum
        ).replace('.', ',')}\t` +
          `${tok.token.editions}\t${tok.token.name}\t${tok.seller_address}\t${tok.token.fa2_address}\t${getTokenLink(
            tok.token
          )}\t${tok.token.thumbnail_uri}`
      )
    })

    for (let i = 0; i < 10; i++) getThumb(tokens[key][Math.floor(Math.random() * createdCnt)])

    console.log('CSV output... ' + csvOut.length + ' lines.')

    let csv = {
      holdings: csvOut,
    }

    csvOut.forEach((line) => {
      let year = line.substring(0, 4)
      if (year.startsWith('20')) {
        let csvName = 'holdings-' + year
        let csvYear = csv[csvName] ? csv[csvName] : []
        csvYear.push(line)
        csv[csvName] = csvYear
      }
    })

    Object.keys(csv).forEach((key) => {
      fs.writeFileSync(`output/${key}.csv`, csv[key].join('\n'))
    })

    console.log('SUM', formatTz(sum))
    // getAllSales(tokens)
    */
}
// \teditions\tname\tseller\tfa2_address\turl\tthumbnail_uri'

export function toCSV(csv, delimiter) {
  let out = []
  csv.forEach((row) => {
    out.push(row.join(delimiter))
  })

  return out
}

export function getCSV(tokens, csvColumns) {
  let rows = [csvColumns]

  tokens.events.forEach((ev) => {
    const row = []
    csvColumns.forEach((col) => {
      if (col == TIME) row.push(dayjs(ev.timestamp).format(YYMMDDHHMM))
      if (col == TYPE) row.push(ev.type)
      if (col == OPHASH) row.push(ev.ophash)
      if (col == PLATFORM) row.push(ev.token.platform)
      if (col == TOKEN_ID) row.push(ev.token.token_id)
      if (col == EDITIONS) row.push(ev.token.editions)
      if (col == PRICE) row.push(formatTz(ev.price))
      if (col == BUYER) row.push(ev.buyer_address)
      if (col == SELLER) row.push(ev.seller_address)
      if (col == FA2) row.push(ev.token.fa2_address)
      if (col == NAME) row.push(ev.token.name)
      if (col == URL) row.push(getTokenLink(ev.token))
      if (col == THUMBNAIL) row.push(ev.token.thumbnail_uri)
    })
    rows.push(row)
  })
  return rows
}
