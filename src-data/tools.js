import { request, gql } from 'graphql-request'
import { QuerySales, QueryCollects } from './query.js'
import fs from 'fs'
import dayjs from 'dayjs'

import {
  formatTz,
  tzProfiles,
  nf,
  getTokenLink,
  TEZTOK_API,
  YYMMDDHHMM,
  getPeriods,
  sortEvents,
  timestamp,
  getTokenCSV,
  toCSV,
  AMOUNT,
  ARTIST,
  TIME,
  OPHASH,
  TYPE,
  PLATFORM,
  TOKEN_ID,
  PRICE,
  EDITIONS,
  NAME,
  SELLER,
  BUYER,
  MINTER,
  FA2,
  URL,
  THUMBNAIL,
  PRICE_EUR,
  getUserInfo,
} from './util.js'
import { toEUR } from './xtz-historical.js'

const csvColumns = [
  TIME,
  PLATFORM,
  TOKEN_ID,
  PRICE,
  PRICE_EUR,
  'sales_volume',
  AMOUNT,
  EDITIONS,
  NAME,
  SELLER,
  BUYER,
  ARTIST,
  FA2,
  URL,
  TYPE,
  OPHASH,
  THUMBNAIL,
]

async function queryCollects(wallet) {
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
  let collects, query
  let timeStr = timestamp()

  await queryCollects(wallet).then((response) => {
    collects = response
  })

  let users = []
  collects.events.forEach((ev) => {
    if (ev.seller_address && users.indexOf(ev.seller_address) < 0) users.push(ev.seller_address)
    if (ev.buyer_address && users.indexOf(ev.buyer_address) < 0) users.push(ev.buyer_address)
    if (ev.token[ARTIST] && users.indexOf(ev.token[ARTIST]) < 0) users.push(ev.token[ARTIST])
  })

  await getUserInfo(users).then((response) => {
    console.log('get profiles: ' + users.length)
  })

  console.log('collects: ', collects.events ? collects.events.length : 'no events!')
  fs.writeFileSync(`output/${timeStr}-collects.csv`, toCSV(getTokenCSV(collects, csvColumns), '\t').join('\n'))

  await querySales(wallet).then((response) => {
    query = response
  })

  query.events.forEach((ev) => {
    if (ev.seller_address && users.indexOf(ev.seller_address) < 0) users.push(ev.seller_address)
    if (ev.buyer_address && users.indexOf(ev.buyer_address) < 0) users.push(ev.buyer_address)
    if (ev.token[ARTIST] && users.indexOf(ev.token[ARTIST]) < 0) users.push(ev.token[ARTIST])
  })
  await getUserInfo(users).then((response) => {
    console.log('Sales - get profiles: ' + users.length)
  })

  fs.writeFileSync(`output/${timeStr}-sales.json`, JSON.stringify(query))

  console.log('tokens: ', query.events ? query.events.length : 'no events!')
  // sortEvents(query)

  let secondarySales = { events: [] }
  let primarySales = { events: [] }
  let otherSales = { events: [] }

  query.events.forEach((ev) => {
    if (ev.token[ARTIST] && ev.token[ARTIST].startsWith('KTR')) ev.token[ARTIST] = ev.token[MINTER]
    if (ev.token[ARTIST] != wallet) otherSales.events.push(ev)
    else if (ev[SELLER] != wallet) secondarySales.events.push(ev)
    else primarySales.events.push(ev)
  })

  console.log(`${primarySales.events.length} primary sales`)
  console.log(`${secondarySales.events.length} secondary sales`)
  console.log(`${otherSales.events.length} other sales`)

  if (primarySales.events.length > 0)
    fs.writeFileSync(`output/sales-primary.csv`, toCSV(getTokenCSV(primarySales, csvColumns), '\t').join('\n'))

  if (secondarySales.events.length > 0)
    fs.writeFileSync(`output/sales-secondary.csv`, toCSV(getTokenCSV(secondarySales, csvColumns), '\t').join('\n'))

  if (otherSales.events.length > 0) {
    // fs.writeFileSync(`output/${timeStr}-sales-other.csv`, toCSV(getTokenCSV(otherSales, csvColumns), '\t').join('\n'))

    getSalesGains(collects, otherSales)
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
    'gain',
    'gain_eur',
    'name',
    TOKEN_ID,
    FA2,
    URL,
  ])

  let sum = 0,
    high = -100,
    highEur = -100,
    low = 1000000

  sales.events.forEach((ev) => {
    let collectEv

    collects.events.forEach((tmp) => {
      if (tmp.token[FA2] == ev.token[FA2] && tmp.token[TOKEN_ID] == ev.token[TOKEN_ID]) collectEv = tmp
    })

    if (collectEv) {
      let gain = ev.price - collectEv.price
      sum += gain
      high = Math.max(high, gain)
      highEur = Math.max(highEur, toEUR(ev.timestamp, gain))
      low = Math.min(low, gain)

      diff.push([
        dayjs(collectEv.timestamp).format(YYMMDDHHMM),
        dayjs(ev.timestamp).format(YYMMDDHHMM),
        Math.ceil(dayjs(ev.timestamp).diff(dayjs(collectEv.timestamp), 'hours') / 24) + ' days',
        formatTz(collectEv.price).replace,
        nf(toEUR(collectEv.timestamp, collectEv.price)),
        formatTz(ev.price),
        nf(toEUR(ev.timestamp, ev.price)),
        formatTz(gain),
        nf(toEUR(ev.timestamp, ev.price) - toEUR(collectEv.timestamp, collectEv.price)),
        ev.token.name,
        ev.token[TOKEN_ID],
        ev.token[FA2],
        getTokenLink(ev.token),
      ])
    }
  })

  console.log('sales with gains: ', diff.length)
  console.log(' sum, gains: ', formatTz(sum), nf(toEUR(sum)))
  console.log(' highest gain: ', formatTz(high), nf(highEur))
  console.log(' lowest gain: ', formatTz(low), nf(toEUR(low)))

  fs.writeFileSync(`output/sales-diff.csv`, toCSV(diff, '\t').join('\n'))
}
