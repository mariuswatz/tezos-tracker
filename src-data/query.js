import { request, gql } from 'graphql-request'

export const TEZTOK_API = 'https://api.teztok.com/v1/graphql'

export const QueryTeiaNameForAddress = `query GetNameForAddress($address: String!) {
  teia_users(where: {user_address: {_eq: $address}}) {
    name
  }
}`

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
        tags {
            tag
        }
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
         tags {
            tag
        }
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

export const QueryActiveListings = `query activeListings($wallet: String!) {
  listings(where: {seller_address: {_eq: $wallet}, token: {artist_address: {_eq: $wallet}}, status:{_eq:"active"} amount_left: {_gt: 0}}, order_by: {created_at: asc}) {
    status
    created_at
    price
    amount
    amount_left
    type
    token {
      platform
      fa2_address
      artist_address
      token_id
      name
      editions
      price
      last_sale_at
      last_sales_price
      lowest_sales_price
      sales_volume
    }
  }
}`

export const QueryHoldings = gql`
  query getHoldings($wallet: String!) {
    holdings(
      where: { holder_address: { _eq: $wallet }, amount: { _gt: "1" }, token: { artist_address: { _neq: $wallet } } }
      order_by: { last_received_at: desc }
    ) {
      amount
      last_received_at
      token {
        platform
        fa2_address
        artist_address
        minter_address
        token_id
        price
        last_sale_at
        last_sales_price
        name
        royalties_total
        sales_volume
        editions
        tags {
          tag
        }
        thumbnail_uri
        fx_collection_thumbnail_uri
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

export const QueryHoldingsByTag = gql`
  query getHoldingsByTag($wallet: String!, $tag: String!) {
    holdings(
      where: { holder_address: { _eq: $wallet }, token: { tags: { tag: { _eq: $tag } } } }
      order_by: { last_received_at: desc }
    ) {
      last_received_at
      token {
        name
        fa2_address
        token_id
        artist_address
        artist_profile {
          twitter
          alias
        }
        tags {
          tag
        }
      }
    }
  }
`

export const QueryCollectsWithTag = gql`
  query getSaleStats($wallet: String!, $date1: timestamptz!, $date2: timestamptz!, $tag: String!) {
    events(
      where: {
        implements: { _eq: "SALE" }
        buyer_address: { _eq: $wallet }
        timestamp: { _gte: $date1, _lt: $date2 }
        token: { tags: { tag: { _eq: $tag } } }
      }
    ) {
      timestamp
      price
      seller_address
      seller_profile {
        alias
        twitter
      }
      token {
        name
        fa2_address
        token_id
        tags {
          tag
        }
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

/* aggregate events:


"""
Copy the following GraphQL query into the TezTok API Explorer at
https://graphiql.teztok.com/

Fill out the wallet, date1 and date2 parameters with the Tezos address 
and  date range you're interested in. The output combines events() and 
events_aggregate() query to give you a quick overview over sales and buys
over the time period.

{
  "wallet":  "tz2NY3Fgt5QufrYGP1JKdvLKcWWt86sLsqrS",
  "date1": "2023-06-01",
  "date2": "2023-07-01"
}tz1dFcfEbAb9abXBEXERV4uMv48e4x17MuBb
"""

query getSaleStats($wallet: String!, $date1: timestamptz!, $date2: timestamptz!) {
  buys: events_aggregate(where: {implements: {_eq: "SALE"}, buyer_address: {_eq: $wallet}, timestamp: {_gte: $date1, _lt: $date2}}, order_by: {price: asc}) {
    aggregate {
      sum {
        price
      }
      count(columns: timestamp)
      max {
        price
        timestamp
      }
      min {
        price
        timestamp
      }
    }
    nodes {
      timestamp
      price
      seller_address
      seller_profile {
        alias
        twitter
      }
      token {
        name
        fa2_address
        token_id
      }
    }
  }
  sales: events_aggregate(where: {implements: {_eq: "SALE"}, seller_address: {_eq: $wallet}, timestamp: {_gte: $date1, _lt: $date2}}, order_by: {price: asc}) {
    aggregate {
      sum {
        price
      }
      count(columns: timestamp)
      max {
        price
        timestamp
      }
      min {
        price
        timestamp
      }
    }
    nodes {
      timestamp
      price
      buyer_address
      buyer_profile {
        alias
        twitter
      }
      token {
        name
        fa2_address
        token_id
      }
    }
  }
  events(where: {implements: {_eq: "SALE"}, _or: [{seller_address: {_eq: $wallet}}, {buyer_address: {_eq: $wallet}}], timestamp: {_gte: $date1, _lt: $date2}}, order_by: {price: asc}) {
    timestamp
    type
    token_id
    price
    buyer_address
    buyer_profile {
      alias
      twitter
    }
    seller_address
    seller_profile {
      alias
      twitter
    }
    token {
      artist_address
      name
      fa2_address
      token_id
    }
  }
}


*/
/*

getCreations, getSales
List all sales of all tokens created by a certain Tezos account. 
For performance reasons, it’s recommended to split this up into two queries. 
In the first query, you fetch all tokens that were created by an account. 
In the second query, you then fetch the sale events of those tokens, by 
creating an or-condition with the contract addresses and the token ids.
*/
