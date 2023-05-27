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
  // 1609459200 = Jan 1, 2021
  // URL https://query1.finance.yahoo.com/v7/finance/download/XTZ-EUR?period1=1609459200&period2=1685145600&interval=1d&events=history&includeAdjustedClose=true
  if (!xtzeur) xtzeur = parseHistorical('src-data/XTZ-EUR.csv')

  let day = dayjs(date)
  let dateId = day.format('YYYY-MM-DD')

  value /= 1000000
  if (xtzeur[dateId]) return xtzeur[dateId] * value

  let list = Object.keys(xtzeur)
  let lastDate = dayjs(list[list.length - 1])
  let firstDate = dayjs(list[0])
  console.log(`Today ${dateId} - last in list: ${lastDate.format('YYYY-MM-DD')}`)
  if (day.isAfter(lastDate)) return xtzeur[list[list.length - 1]] * value

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
