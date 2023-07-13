import fs from 'fs'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

import { text, csv } from 'd3-fetch'

const header = 'Date,Open,High,Low,Close,Adj Close,Volume'
const columns = header.split(',')
const CLOSE = 4
dayjs.extend(utc)

const XTZEUR_URL = [
  'https://query1.finance.yahoo.com/v7/finance/download/XTZ-EUR?period1=',
  '&period2=',
  '&interval=1d&events=history&includeAdjustedClose=true',
]
const XTZUSD_URL = [
  'https://query1.finance.yahoo.com/v7/finance/download/XTZ-USD?period1=',
  '&period2=',
  '&interval=1d&events=history&includeAdjustedClose=true',
]

const xtzusd = {},
  xtzeur = {}

export function toUSD(date, value) {
  if (!xtzusd.first) xtzusd = parseHistorical(xtzusd, './public/data/XTZ-USD.csv')
  date = dayjs(date).format('YYYY-MM-DD')
  if (xtzusd[date]) return xtzusd[date][CLOSE] * (value / 1000000)

  return -1
}

export function toEUR(date, value) {
  // 1609459200 = Jan 1, 2021
  // URL https://query1.finance.yahoo.com/v7/finance/download/XTZ-EUR?period1=1609459200&period2=1685145600&interval=1d&events=history&includeAdjustedClose=true
  if (!xtzeur.first) parseHistorical(xtzeur, './public/data/XTZ-EUR.csv')

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

function toCSV(dataset) {
  const out = [header]
  const keys = Object.keys(dataset).sort()
  keys.forEach((key) => {
    if (!(key == 'first' || key == 'last')) {
      out.push(dataset[key].join(','))
    }
  })

  return out.join('\n')
}

export function updateXTZData() {
  parseHistorical(xtzusd, './public/data/XTZ-USD.csv')
  parseHistorical(xtzeur, './public/data/XTZ-EUR.csv')

  let dayD = dayjs().diff(dayjs(xtzeur.last), 'hour')
  let dates = [dayjs(xtzeur.last).utc().unix(), dayjs().utc().startOf('date').unix()]
  if (dayD < 24) console.log('delta hours: ' + dayD + ' - no fetch')
  else fetchYahoo(XTZEUR_URL, dates[0], dates[1])

  dates = [dayjs(xtzusd.last).utc().unix(), dayjs().utc().startOf('date').unix()]
  dayD = dayjs().diff(dayjs(xtzusd.last), 'hour')
  if (dayD < 24) console.log('delta hours: ' + dayD + ' - no fetch')
  else fetchYahoo(XTZUSD_URL, dates[0], dates[1])
}

async function fetchYahoo(urlFormat, date1, date2) {
  console.log('fetch', date1, date2, dayjs.unix(date1).toString(), dayjs.unix(date2).toString())

  let url = urlFormat[0] + date1 + urlFormat[1] + date2 + urlFormat[2]
  const isEUR = url.indexOf('EUR') > -1
  const dataset = isEUR ? xtzeur : xtzusd

  console.log(dayjs().unix(), 'fetch', url)
  let data
  data = text(url)

  let dataPrefix = isEUR ? 'XTZ-EUR' : 'XTZ-USD'

  data.then(
    (res) => {
      console.log(
        dayjs.unix(date1).format('YYYY-MM-DD'),
        dayjs.unix(date2).format('YYYY-MM-DD'),
        dataPrefix,
        'data fetched'
      )
      data = res
      addData(dataset, data.split('\n'))

      console.log(`Write: ${dataPrefix}.csv - ${Object.keys(dataset).length} values`)
      fs.writeFileSync('./public/data/' + dataPrefix + '.csv', toCSV(dataset))
    },
    (err) => {
      console.error('ERROR', err)
    }
  )

  return data

  //https://query1.finance.yahoo.com/v7/finance/download/XTZ-USD?period1=1609459200&period2=1689206400&interval=1d&events=history&includeAdjustedClose=true
  //https://query1.finance.yahoo.com/v7/finance/download/XTZ-EUR?period1=1689215092&period2=1684533600&interval=1d&events=history&includeAdjustedClose=true
  // .then(
  //   (res) => {
  //     console.log(dayjs().unix(), 'got csv')
  //     data = res
  //   },
  //   (err) => {}
  // )

  // await req

  // // csv(url).then((res) => {
  // //   console.log('then', res)
  // //   data = res
  // // })

  // while (!data) {
  //   for (let i = 0; i < 1000; i++) Math.sqrt(400)
  // }
  // //   await sleep(500)
  // //   console.log(dayjs().unix(), 'delay', data)
  // // }
  // console.log(dayjs().unix(), data)

  // return data
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function addData(dataset, data) {
  data.forEach((row) => {
    if (!row.startsWith('Date')) {
      let tok = row.split(',')
      if (tok[1] != 'null') dataset[tok[0]] = tok
    }
  })

  if (dataset.first) {
    delete dataset.first
    delete dataset.last
  }

  const keys = Object.keys(dataset).sort()
  dataset.first = keys[0]
  dataset.last = keys[keys.length - 1]
}

function parseHistorical(dataset, filename) {
  let result = {}

  let data = fs.readFileSync(filename, 'utf-8').split('\n')
  console.log('parse', filename, data.length)
  addData(dataset, data)

  return dataset
}
