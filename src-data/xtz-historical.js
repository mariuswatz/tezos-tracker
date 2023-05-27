import fs from 'fs'
import dayjs from 'dayjs'

let xtzusd, xtzeur

export function toUSD(date, value) {
  if (!xtzusd) xtzusd = parseHistorical('src-data/XTZ-USD.csv')
  date = dayjs(date).format('YYYY-MM-DD')
  if (xtzusd[date]) return xtzusd[date] * (value / 1000000)

  return -1
}

export function toEUR(date, value) {
  if (!xtzeur) xtzeur = parseHistorical('src-data/XTZ-EUR.csv')

  date = dayjs(date).format('YYYY-MM-DD')

  if (xtzeur[date]) return xtzeur[date] * (value / 1000000)

  return -1
}

function parseHistorical(filename) {
  let result = {}

  let data = fs.readFileSync(filename, 'utf-8').split('\n')
  data.forEach((row) => {
    let tok = row.split(',')
    if (tok[1] != 'null') result[tok[0]] = tok[4]
  })

  return result
}
