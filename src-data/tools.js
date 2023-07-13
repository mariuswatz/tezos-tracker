import { request, gql } from 'graphql-request'
import { QuerySales, QueryCollects, QueryHoldings, QueryActiveListings } from './query.js'
import fs from 'fs'
import dayjs from 'dayjs'
import * as TEZ from './constants.js'

import {
  formatTz,
  dataSet,
  nf,
  getUserInfo,
  getAlias,
  getTokenLink,
  tokenIdent,
  getPeriods,
  sortEvents,
  timestamp,
  getTokenCSV,
  toCSV,
} from './util.js'
import { toEUR } from './xtz-historical.js'
import { csv } from 'd3-fetch'

const csvColumns = [
  TEZ.TIME,
  TEZ.PLATFORM,
  TEZ.TOKEN_ID,
  TEZ.PRICE,
  TEZ.PRICE_EUR,
  TEZ.AMOUNT,
  TEZ.EDITIONS,
  TEZ.NAME,
  TEZ.SELLER,
  TEZ.BUYER,
  TEZ.ARTIST,
  TEZ.FA2,
  TEZ.URL,
  TEZ.TYPE,
  TEZ.OPHASH,
  TEZ.THUMBNAIL,
]

const DATA = {}

export async function getCreations() {
  return await request(TEZ.TEZTOK_API, QueryGetCreations, {
    artistAddress: artistAddress,
  })
}

async function queryCollects(wallet) {
  // if (dataSet['collects']) return JSON.parse(JSON.stringify(dataSet['collects']))

  let result
  await request(
    TEZ.TEZTOK_API,
    gql`
      ${QueryCollects}
    `,
    {
      wallet: wallet,
    }
  ).then((response) => {
    result = response
  })

  return result
}

async function queryActiveListings(wallet) {
  let result

  await request(
    TEZ.TEZTOK_API,
    gql`
      ${QueryActiveListings}
    `,
    {
      wallet: wallet,
    }
  ).then((response) => {
    result = response
  })

  dataSet['listings'] = result
  return result
}

async function querySales(wallet) {
  let result

  await request(
    TEZ.TEZTOK_API,
    gql`
      ${QuerySales}
    `,
    {
      wallet: wallet,
    }
  ).then((response) => {
    result = response
  })

  dataSet['collects'] = result
  return result
}

export async function getActiveListings(wallet) {
  const output = []
  const res = await queryActiveListings(wallet)

  const today = new dayjs().toString()

  output.push(
    'token_id\tname\tlist_date\tprice\tprice_created_eur\tprice_now_eur' +
      '\tlast_sale_date\tlast_sales_price\tlast_sales_price_eur'
  )

  res.listings.forEach((el) => {
    if (el.price) {
      el['price_created_eur'] = nf(toEUR(el.created_at, el.price))
      el['price_now_eur'] = nf(toEUR(today, el.price))
      el['created_at'] = new dayjs(el['created_at']).format(TEZ.YYMMDD)
    }

    let last
    if (el.token.last_sale_at) {
      last = new dayjs(el.token.last_sale_at).format(TEZ.YYMMDD)
    }

    el.token['last_sales_price_eur'] = nf(toEUR(el.token.last_sale_at, el.token.last_sales_price))
    output.push(
      el.token.token_id +
        `\t${el.token.name}\t${el['created_at']}` +
        `\t${formatTz(el.price)}\t${el['price_created_eur']}\t${el['price_now_eur']}` +
        `\t${last ? last : ''}` +
        `\t${last ? formatTz(el.token['last_sales_price']) : ''}` +
        `\t${last ? el.token['last_sales_price_eur'] : ''}`
    )
  })

  const walletName = getAlias(wallet)
  fs.writeFileSync(`output/${walletName}-activeListings.json`, JSON.stringify(res), 'utf-8')
  fs.writeFileSync(`output/${walletName}-activeListings.csv`, output.join('\n'), 'utf-8')
  console.log('Done - queryActiveListings')
}

export async function getMultiples() {
  let holding

  await request(TEZ.TEZTOK_API, QueryHoldings, {
    wallet: dataSet.wallet,
  }).then((response) => {
    holding = response

    fs.writeFileSync(`output/${dataSet.walletAlias}-holdings.json`, JSON.stringify(holding), 'utf-8')

    let holdingsCSVColumns = [
      TIME,
      PLATFORM,
      TOKEN_ID,
      LAST_SALE_AT,
      LAST_SALES_PRICE,
      LAST_SALES_PRICE_EUR,
      AMOUNT,
      EDITIONS,
      NAME,
      ARTIST,
      FA2,
      URL,
      TYPE,
      OPHASH,
      THUMBNAIL,
    ]
    holding.events = holding.holdings
    fs.writeFileSync(
      `output/${dataSet.walletAlias}-holdings.csv`,
      toCSV(getTokenCSV(holding, holdingsCSVColumns), '\t', holdingsCSVColumns).join('\n'),
      'utf-8'
    )
    console.log('holding:', holding.holdings.length)
    dataSet['holdings'] = holding
  })
}

export async function getCollectionInfo() {
  let collects = await queryCollects(dataSet.wallet)

  console.log('\n------ Collection: ')
  console.log(` ${collects.events.length} collect events`)
  fs.writeFileSync(`output/${dataSet.walletAlias}-collection.json`, JSON.stringify(collects), 'utf-8')

  let artists = {}
  let NFT = {}

  collects.events.forEach((ev) => {
    console.log(`${collects.events.indexOf(ev)} ${getAlias(ev.token[TEZ.ARTIST])} '${ev.token[NAME]}'`)
    let id = tokenIdent(ev.token)
    let token
    if (NFT[id]) token = NFT[id]
    else {
      token = {
        events: [],
        artist: getAlias(ev.token[TEZ.ARTIST]),
      }
      NFT[id] = token
    }
    token.events.push(ev)

    let artist
    if (artists[ev.token[TEZ.ARTIST]]) artist = artists[ev.token[TEZ.ARTIST]]
    else {
      artist = {
        [TEZ.ARTIST]: ev.token[TEZ.ARTIST],
        alias: getAlias(ev.token[TEZ.ARTIST]),
        events: [],
      }
      artists[ev.token[TEZ.ARTIST]] = artist
    }

    artist.events.push(ev)
  })

  dataSet['artists'] = artists

  const sortArtists = []
  Object.keys(artists).forEach((key) => {
    let tmp = { artist: key, alias: artists[key].alias, num: artists[key].events.length }
    sortArtists.push(tmp)
  })

  sortArtists.sort((a, b) => {
    return b.num - a.num
  })

  let ArtistCsvColumns = [
    TEZ.TIME,
    TEZ.ARTIST,
    TEZ.PLATFORM,
    TEZ.TOKEN_ID,
    TEZ.PRICE,
    TEZ.PRICE_EUR,
    TEZ.EDITIONS,
    TEZ.NAME,
    TEZ.SELLER,
    TEZ.FA2,
    TEZ.URL,
    TEZ.TYPE,
    TEZ.OPHASH,
    TEZ.THUMBNAIL,
  ]

  // BUILD CSV
  let collectionCSV = []
  collectionCSV.push(ArtistCsvColumns.join('\t'))
  let sum = 0
  console.log(` ${Object.keys(artists).length} artists`)
  sortArtists.forEach((el) => {
    let artist = artists[el.artist]
    let csv = getTokenCSV(artist, ArtistCsvColumns)
    csv.shift(0)

    if (csv.length > 1) collectionCSV.push('')
    collectionCSV.push(...toCSV(csv, '\t'))
  })

  fs.writeFileSync(`output/${dataSet.walletAlias}-collection.csv`, collectionCSV.join('\n'), 'utf-8')
}

export async function getHoldings(wallet) {
  let collects, query
  let timeStr = timestamp()

  collects = await queryCollects(wallet)
  // fs.writeFileSync(`output/${dataSet.walletAlias}-collection.json`, JSON.stringify(collects), 'utf-8')

  query = await querySales(wallet)

  let users = []
  collects.events.forEach((ev) => {
    if (ev.seller_address && users.indexOf(ev.seller_address) < 0) users.push(ev.seller_address)
    if (ev.buyer_address && users.indexOf(ev.buyer_address) < 0) users.push(ev.buyer_address)
    if (ev.token[TEZ.ARTIST] && users.indexOf(ev.token[TEZ.ARTIST]) < 0) users.push(ev.token[TEZ.ARTIST])
  })

  query.events.forEach((ev) => {
    if (ev.seller_address && users.indexOf(ev.seller_address) < 0) users.push(ev.seller_address)
    if (ev.buyer_address && users.indexOf(ev.buyer_address) < 0) users.push(ev.buyer_address)
    if (ev.token[TEZ.ARTIST] && users.indexOf(ev.token[TEZ.ARTIST]) < 0) users.push(ev.token[TEZ.ARTIST])
  })

  await getUserInfo(users)

  // OUTPUT

  let walletAlias = getAlias(wallet)
  dataSet.walletAlias = walletAlias

  console.log('\nCollects: ', collects.events ? collects.events.length : 'no events!')
  console.log(csvColumns)
  fs.writeFileSync(
    `output/${walletAlias}-collects.csv`,
    toCSV(getTokenCSV(collects, csvColumns), '\t').join('\n'),
    'utf-8'
  )

  console.log('Sales: ', query.events ? query.events.length : 'no events!')
  // sortEvents(query)

  let secondarySales = { events: [] }
  let primarySales = { events: [] }
  let otherSales = { events: [] }

  dataSet['sales'] = query

  query.events.forEach((ev) => {
    if (ev.token[TEZ.ARTIST] && ev.token[TEZ.ARTIST].startsWith('KTR')) ev.token[TEZ.ARTIST] = ev.token[MINTER]
    if (ev.token[TEZ.ARTIST] != wallet) otherSales.events.push(ev)
    else if (ev[TEZ.SELLER] != wallet) secondarySales.events.push(ev)
    else primarySales.events.push(ev)
  })

  console.log(`\n${primarySales.events.length} primary sales`)
  console.log(`${secondarySales.events.length} secondary sales`)
  console.log(`${otherSales.events.length} other sales`)

  if (primarySales.events.length > 0) {
    dataSet['salesPrimary'] = primarySales
    fs.writeFileSync(
      `output/${walletAlias}-sales-primary.csv`,
      toCSV(getTokenCSV(primarySales, csvColumns), '\t').join('\n'),
      'utf-8'
    )
  }

  csvColumns.splice(3, 0, TEZ.ROYALTY)
  csvColumns.splice(4, 0, 'royalty_paid')
  csvColumns.splice(5, 0, 'royalty_paid_eur')
  if (secondarySales.events.length > 0) {
    dataSet['salesSecondary'] = secondarySales
    fs.writeFileSync(
      `output/${walletAlias}-sales-secondary.csv`,
      toCSV(getTokenCSV(secondarySales, csvColumns), '\t').join('\n'),
      'utf-8'
    )
  }

  if (otherSales.events.length > 0) {
    dataSet['salesOther'] = otherSales
    fs.writeFileSync(
      `output/${walletAlias}-sales-other.csv`,
      toCSV(getTokenCSV(otherSales, csvColumns), '\t').join('\n')
    )

    getSalesGains(collects, otherSales).then((diff) => {
      fs.writeFileSync(`output/${walletAlias}-sales-gains.csv`, toCSV(diff, '\t').join('\n'), 'utf-8')
    })
  }
}

export async function getSalesGains(collects, sales) {
  let diff = []
  diff.push([
    'buy',
    'sale',
    'days held',
    'buy_price',
    'buy_eur',
    'sale_price',
    'sale_eur',
    TEZ.ROYALTY,
    'royalty_paid',
    'royalty_paid_eur',
    'gain',
    'gain_eur',
    'name',
    TEZ.TOKEN_ID,
    TEZ.FA2,
    TEZ.URL,
  ])

  let sum = 0,
    high = -100,
    highEur = -100,
    low = 1000000

  sales.events.forEach((ev) => {
    let collectEv

    collects.events.forEach((tmp) => {
      if (tmp.token[TEZ.FA2] == ev.token[TEZ.FA2] && tmp.token[TEZ.TOKEN_ID] == ev.token[TEZ.TOKEN_ID]) collectEv = tmp
    })

    if (collectEv) {
      let royalty_paid = calcRoyaltyPayment(ev)
      let royalty_paid_eur = calcRoyaltyPayment(ev, true)

      let gain = ev.price - collectEv.price - royalty_paid
      sum += gain
      high = Math.max(high, gain)
      highEur = Math.max(highEur, toEUR(ev.timestamp, gain))
      low = Math.min(low, gain)

      diff.push([
        dayjs(collectEv.timestamp).format(YYMMDDHHMM),
        dayjs(ev.timestamp).format(YYMMDDHHMM),
        Math.ceil(dayjs(ev.timestamp).diff(dayjs(collectEv.timestamp), 'hours') / 24),
        formatTz(collectEv.price),
        nf(toEUR(collectEv.timestamp, collectEv.price)),
        formatTz(ev.price),
        nf(toEUR(ev.timestamp, ev.price)),
        ev.token[TEZ.ROYALTY] / 10000,
        formatTz(royalty_paid),
        nf(royalty_paid_eur),
        formatTz(gain),
        nf(toEUR(ev.timestamp, ev.price) - toEUR(collectEv.timestamp, collectEv.price)),
        ev.token.name,
        ev.token[TEZ.TOKEN_ID],
        ev.token[TEZ.FA2],
        getTokenLink(ev.token),
      ])
    }
  })

  console.log('\nSales with gains: ', diff.length)
  console.log(' sum, gains: ', formatTz(sum), nf(toEUR(sum)))
  console.log(' highest gain: ', formatTz(high), nf(highEur))
  console.log(' lowest gain: ', formatTz(low), nf(toEUR(low)))

  return diff
}
