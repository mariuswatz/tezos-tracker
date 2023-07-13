export const TEZTOK_API = 'https://api.teztok.com/v1/graphql'
export const YYMMDDHHMM = 'YYYYMMDD-HHmm'
export const YYMMDD = 'YYYYMMDD'
export const TOKEN_ID = 'token_id'
export const AMOUNT = 'amount'
export const ARTIST = 'artist_address'
export const BUYER = 'buyer_address'
export const EDITIONS = 'editions'
export const FA2 = 'fa2_address'
export const MINTER = 'minter_address'
export const NAME = 'name'
export const OPHASH = 'ophash'
export const PLATFORM = 'platform'
export const LAST_SALE_AT = 'last_sale_at'
export const LAST_SALES_PRICE = 'last_sales_price'
export const LAST_SALES_PRICE_EUR = 'last_sales_price_eur'
export const PRICE = 'price'
export const PRICE_EUR = 'price_eur'
export const ROYALTY = 'royalties_total'
export const SALES_VOLUME = 'sales_volume'
export const SELLER = 'seller_address'
export const THUMBNAIL = 'thumbnail_uri'
export const TIME = 'time'
export const TYPE = 'type'
export const URL = 'url'
export const TAGS = 'tags'
export const NUMBER = 'number'
export const TEZ = 'tezos'
export const FIAT = 'fiat'
export const TZWALLET = 'tezwallet'
export const PERC = 'percent'
export const DATE = 'date'
export const STRING = 'string'
export const CSV_TYPES = {
  AMOUNT: NUMBER,
  LAST_SALES_PRICE: TEZ,
  LAST_SALES_PRICE_EUR: FIAT,
  TOKEN_ID: NUMBER,
  ARTIST: TZWALLET,
  BUYER: TZWALLET,
  EDITIONS: NUMBER,
  FA2: STRING,
  MINTER: TZWALLET,
  NAME: STRING,
  OPHASH: STRING,
  PLATFORM: STRING,
  LAST_SALE_AT: DATE,
  LAST_SALES_PRICE: TEZ,
  LAST_SALES_PRICE_EUR: FIAT,
  PRICE: TEZ,
  PRICE_EUR: FIAT,
  ROYALTY: PERC,
  SALES_VOLUME: TEZ,
  SELLER: TZWALLET,
  THUMBNAIL: STRING,
  TIME: DATE,
  TYPE: STRING,
  URL: STRING,
  TAGS,
}
