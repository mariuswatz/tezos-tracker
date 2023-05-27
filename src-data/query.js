import { request, gql } from 'graphql-request'

const TEZTOK_API = 'https://api.teztok.com/v1/graphql'

export const QueryGetCreations = gql`
  query getCreations($artistAddress: String!) {
    tokens(where: { artist_address: { _eq: $artistAddress } }, order_by: { minted_at: desc }) {
      fa2_address
      platform
      token_id
      minted_at
      name
      editions
      burned_editions
      objkt_artist_collection_id
      royalties_total
      sales_count
      sales_volume
      description
      mime_type
      artifact_uri
      thumbnail_uri
    }
  }
`

const QuerySalesString = `query getSales {
    events(where: {
                implements: { _eq: "SALE" },
        _or: [
            #TOKENS
        ]
    }) {
        ophash
        type
        timestamp
        seller_address
        buyer_address
        price
        token {
          fa2_address

          minter_address
          token_id
          name
        }
    }
}`

//

export const QuerySales = `
  query getSales($wallet: String!) {
    events(
      where: { implements: { _eq: "SALE" }, _or: [{seller_address: { _eq: $wallet }},{artist_address: { _eq: $wallet }}] }
      order_by: { timestamp: asc }
    ) {
      ophash
      type
      timestamp
      seller_address
      buyer_address
      amount      
      price
      token {
        platform
        fa2_address
        artist_address
        minter_address
        token_id
        name
        royalties_total
        sales_volume		
        editions
        thumbnail_uri
        fx_collection_thumbnail_uri
      }
    }
  }
`

export const QueryCollects = `
  query getCollects($wallet: String!) {
    events(
      where: { implements: { _eq: "SALE" }, buyer_address: { _eq: $wallet } }
      order_by: { timestamp: asc }
    ) {
      ophash
      type
      timestamp
      seller_address
      buyer_address
      artist_address
      price
      token {
        platform
        fa2_address
        token_id
        name
        editions
        thumbnail_uri
        fx_collection_thumbnail_uri
      }
    }
  }
`

export const QueryListings = `
  query GetListings($wallet: String) {
    listings(where: {seller_address: {_eq: $address}, status: {_ne: 'sold_out'}}) {
      seller_address
      price
      status
      token {
        name
        artist_address
        token_id
        fa2_address
        listings {
          amount
          seller_address
          created_at
          price
          amount
          amount_left
        }
      }
    }
  }
`

export const QueryRecentSales = gql`
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
        platform
        name
        description
        price
        last_sale_at
        last_sales_price
      }
    }
  }
`

async function execQuery(query) {
  return await request(TEZTOK_API, query, {})
}

const getSales = (tokens) => {
  const pos = QuerySalesString.indexOf('#TOKENS')
  let query = QuerySalesString.substring(0, pos)

  tokens = tokens.tokens
  tokens.forEach((tok) => {
    query += `  \n{ fa2_address: { _eq: "${tok['fa2_address']}" }, token_id: { _eq: "${tok['token_id']}" } },`
    // console.log(tok["token_id"],tok["fa2_address"])
  })

  query += QuerySalesString.substring(pos + 7)
  console.log('getSales - ' + tokens.length + ' tokens')

  return execQuery(query)
}
/*

getCreations, getSales
List all sales of all tokens created by a certain Tezos account. 
For performance reasons, it’s recommended to split this up into two queries. 
In the first query, you fetch all tokens that were created by an account. 
In the second query, you then fetch the sale events of those tokens, by 
creating an or-condition with the contract addresses and the token ids.
*/
