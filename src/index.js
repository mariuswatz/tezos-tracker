const TEZTOK_API = 'https://api.teztok.com/v1/graphql'
import { request, gql } from 'graphql-request'
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

async function getHoldings() {
  return await request(TEZTOK_API, QuerySales, {
    artistAddress: 'tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS',
  })
}

getTokens().then((response) => {
  console.log('Success.')
  fs.writeFileSync('tokens.json', JSON.stringify(response))
})

getHoldings().then((response) => {
  console.log('Success.')
  fs.writeFileSync('sales.json', JSON.stringify(response))
})
