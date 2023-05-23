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
        token_id
        name
        }
    }
}`

export const QuerySales = `
  query getSales($wallet: String!) {
    events(
      where: { implements: { _eq: "SALE" }, seller_address: { _eq: $wallet } }
      order_by: { timestamp: asc }
    ) {
      ophash
      type
      timestamp
      seller_address
      buyer_address
      price
      token {
        platform
        fa2_address
        token_id
        mime_type
        name
        editions
        thumbnail_uri
        fx_collection_thumbnail_uri
      }
    }
  }
`

export const QueryCollects = `
  query getSales($wallet: String!) {
    events(
      where: { implements: { _eq: "SALE" }, buyer_address: { _eq: $wallet } }
      order_by: { timestamp: asc }
    ) {
      ophash
      type
      timestamp
      seller_address
      buyer_address
      price
      token {
        platform
        fa2_address
        token_id
        mime_type
        name
        editions
        thumbnail_uri
        fx_collection_thumbnail_uri
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
