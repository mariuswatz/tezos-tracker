const TEZTOK_API = 'https://api.teztok.com/v1/graphql'
import { request, gql } from 'graphql-request'
import { QueryGetCreations } from './query.js'
import { getHoldings } from './tools.js'

import fs from 'fs'
import dayjs from 'dayjs'
import { setLocale, formatTz, getTokenLink } from './util.js'

setLocale('no-NO')

const YYMMDDHHMM = 'YYYYMMDD HH:mm'
const artistAddress = 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS'

getHoldings(artistAddress)

// const QueryHoldings = `query getHoldings($holderAddress: String!) {
//     holdings(where: {holder_address: {_eq: $holderAddress}, amount: {_gt: "0"}}, order_by: {last_received_at: desc}) {
//         amount
//         last_received_at
//         token {
//             token_id
//             fa2_address
//             name
//             price
//             thumbnail_uri

//         }
//     }
// }`

async function getCreations() {
  return await request(TEZTOK_API, QueryGetCreations, {
    artistAddress: 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
    // holderAddress: 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
  })
}

function getAllSales(tokens) {
  let start = dayjs()
  console.log('getAllSales - Sending query..', tokens.tokens.length)

  const tokenBatch = []
  let batch = { tokens: [] }
  let allSales = { events: [] },
    primary = { events: [] },
    secondary = { events: [] }

  tokens.tokens.forEach((tok) => {
    batch.tokens.push(tok)
    if (batch.tokens.length > 49) {
      tokenBatch.push(batch)
      batch = { tokens: [] }
    }
  })
  if (batch.tokens.length > 0) tokenBatch.push(batch)

  console.log(tokenBatch)
  let cnt = 0
  let i = 0
  tokenBatch.forEach((list) => {
    console.log(`tokens left: ${tokens.tokens.length - cnt}`)

    getHoldings(list).then((sales) => {
      sales.events.forEach((sale) => allSales.events.push(sale))
      console.log(
        dayjs().diff(start, 'ms'),
        'getAllSales - Success.',
        sales.events.length,
        'sales',
        allSales.events.length,
        'total'
      )

      cnt += list.tokens.length

      if (cnt === tokens.tokens.length) {
        console.log('Saving sales', allSales.events.length)
        allSales.events.sort((a, b) => {
          return dayjs(a.timestamp).diff(dayjs(b.timestamp), 'ms')
        })

        allSales.events.forEach((ev) => {
          if (ev['seller_address'] === artistAddress) primary.events.push(ev)
          else secondary.events.push(ev)
        })

        fs.writeFileSync('output/getSales.json', JSON.stringify(allSales))
        fs.writeFileSync('output/salesPrimary.json', JSON.stringify(primary))
        fs.writeFileSync('output/salesSecondary.json', JSON.stringify(secondary))

        const csv = []
        primary.events.forEach((ev) => {
          let url = `https://objkt.com/asset/${ev.token.fa2_address}/${ev.token.token_id}`
          csv.push(`${dayjs(ev.timestamp).format(YYMMDDHHMM)};${ev.price / 1000000};${ev.token.name};${url}`)
        })
        fs.writeFileSync('output/salesPrimary.csv', csv.join('\n'))
      }
    })
  })

  console.log('exit')
}
