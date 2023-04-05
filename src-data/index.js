const TEZTOK_API = 'https://api.teztok.com/v1/graphql'
import { request, gql } from 'graphql-request'
import { QueryGetCreations, getSales } from './query.js'
import fs from 'fs'

const TezosQuery = gql`
  query getCreations($artistAddress: String!) {
    tokens(
      where: { artist_address: { _eq: $artistAddress } }
      order_by: { minted_at: desc }
    ) {
      token_id
      fa2_address
      platform
      name
      description
      price
      editions
      listings {
        amount
        amount_left
        price
        seller_address
        seller_profile {
          twitter
        }
      }

      minted_at
      artifact_uri
    }
  }
`

const QueryHoldings = gql`
  query getTokensWithRecentSale($holderAddress: String!) {
    holdings(
      where: {
        holder_address: { _eq: $holderAddress }
        amount: { _gt: "0" }
        token: { last_sale_at: { _gte: "2023-01-01" } }
      }
      order_by: { last_received_at: desc }
    ) {
      amount
      last_received_at
      token {
        token_id
        fa2_address
        name
        description
        price
        last_sale_at
        last_sales_price
      }
    }
  }
`

const QuerySales = gql`
  query getSales($artistAddress: String!) {
    events(
      where: {
        implements: { _eq: "SALE" }
        seller_address: { _eq: $artistAddress }
      }
      order_by: { timestamp: asc }
    ) {
      type
      timestamp
      seller_address
      buyer_address
      price
      token {
        fa2_address
        token_id
        name
        editions
      }
    }
  }
`

async function getTokens(tags, orderColumn, platform, limit) {
  return await request(TEZTOK_API, TezosQuery, {
    artistAddress: 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
    // holderAddress: 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
  })
}

async function getCreations() {
  return await request(TEZTOK_API, QueryGetCreations, {
    artistAddress: 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
    // holderAddress: 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
  })
}

async function getHoldings() {
  return await request(TEZTOK_API, QuerySales, {
    artistAddress: 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
  })
}

getCreations().then((response) => {
  const createdCnt = response.tokens.length
  console.log('QueryGetCreations - Success. ' + createdCnt + ' creations')

  fs.writeFileSync('output/creations.json', JSON.stringify(response))

  const tokList = []
  tokList.push(response.tokens[Math.floor(Math.random() * createdCnt)])
  //   Object.keys(response.tokens).forEach((key) => {
  //     if (tokList.length < 1) tokList.push(response.tokens[key])
  //   })

  //   console.log(tokList)
  getSales(tokList).then((response) => {
    console.log('QueryGetCreations - Success.')
    fs.writeFileSync('output/getSales.json', JSON.stringify(response))
  })
})
// getTokens().then((response) => {
//   console.log('Success.')
//   fs.writeFileSync('output/tokens.json', JSON.stringify(response))
// })

// getHoldings().then((response) => {
//   console.log('Success.')
//   fs.writeFileSync('output/sales.json', JSON.stringify(response))
// })
