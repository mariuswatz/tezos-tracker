import { SVG, extend as SVGextend, Element as SVGElement } from '@svgdotjs/svg.js'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import './Graph.css'
import { csv } from 'd3-fetch'
import Plot from 'react-plotly.js'

import isoWeek from 'dayjs/plugin/isoWeek'
dayjs.extend(isoWeek)

const csvFile = '/data/20230515-sales_volume_week.report.lv-dao.xyz.csv'

const Markets = ({ width, height }) => {
  const [plot, setPlots] = useState(undefined)
  const platforms = {}
  let parseDone = false

  // week,platform,total_volume,total_transactions,unique_buyers_wallets,unique_sellers_wallets,unique_artists_wallets
  useEffect(() => {
    if (!parseDone) {
      parseDone = true
      csv(csvFile).then((data) => {
        setPlots(parseData(data))
      })
    }
  }, [width])

  const years = {}

  function padStr(num, digits) {
    let str = '' + num
    while (str.length < digits) str = '0' + str
    return str
  }

  function unpack(rows, key) {
    return rows.map(function (row) {
      return row[key]
    })
  }

  function parseData(data) {
    const platformFilter = ['HEN', 'OBJKT', 'FXHASH', 'VERSUM']

    const marketData = []
    data.forEach((el) => {
      if (el.platform && platformFilter.indexOf(el.platform) > -1) {
        marketData.push(el)
        el.date = dayjs(el.week)
        el['weekNumber'] = el.date.isoWeek()
        el.weekStr = el.date.year() + '-' + padStr(el.date.isoWeek(), 2)
        if (!years[el.date.year()]) years[el.date.year()] = {}
        if (!years[el.date.year()][el.platform]) years[el.date.year()][el.platform] = []
        years[el.date.year()][el.platform].push(el)
      }
    })
    console.log(years)

    var trace1 = {
      type: 'bar',
      mode: 'lines',
      name: 'HEN',
      x: unpack(years['2021'].HEN, 'weekNumber'),
      y: unpack(years['2021'].HEN, 'total_volume'),
      line: { color: '#17BECF' },
    }

    var trace2 = {
      type: 'bar',
      mode: 'lines',
      name: 'OBJKT',
      x: unpack(years['2021'].OBJKT, 'weekNumber'),
      y: unpack(years['2021'].OBJKT, 'total_volume'),
      line: { color: '#7F7F7F' },
    }

    let W = 300,
      H = 240

    let plot = []
    plot.push({
      data: [trace1, trace2],
      layout: {
        title: '2021',
        yaxis: { range: [0, 1200000] },
        margin: { pad: '10px' },

        barmode: 'stack',
        width: W,
        height: H,
      },
    })

    trace1 = JSON.parse(JSON.stringify(trace1))
    trace2 = JSON.parse(JSON.stringify(trace2))
    ;(trace1.x = unpack(years['2022'].HEN, 'weekNumber')),
      (trace1.y = unpack(years['2022'].HEN, 'total_volume')),
      (trace2.x = unpack(years['2022'].OBJKT, 'weekNumber')),
      (trace2.y = unpack(years['2022'].OBJKT, 'total_volume')),
      plot.push({
        data: [trace1, trace2],
        layout: {
          yaxis: { range: [0, 1200000] },
          margin: { pad: '10px' },
          title: '2022',
          barmode: 'stack',
          width: W,
          height: H,
        },
      })
    console.log('plot.data', plot)
    return plot

    // const weeks = {}
    // data.forEach(wk => {
    //   if (!platforms[wk.platform]) platforms[wk.platform] = {}
    //   wk.weekStr = dayjs(wk.week).year() + '-' + dayjs(wk.week).isoWeek()

    //   platforms[wk.platform][wk.weekStr] = wk
    // })
    // // input.sort((a, b) => a.timestamp - b.timestamp)

    // console.log('platforms', platforms)

    // let output = []
    // const platform = 'HEN'
    // output.push('weeks,transactions,volume,buyers,sellers,artists')
    // Object.keys(platforms[platform]).forEach(key => {
    //   const wk = platforms[platform][key]

    //   let str = wk.weekStr
    //   str += `,${wk.total_transactions},${wk.total_volume},${wk.unique_buyers_wallets},${wk.unique_sellers_wallets},${wk.unique_artists_wallets}`
    //   output.push(str)
    // })

    // console.log(output.join('\n'))
    // setTokens(weeks)
  }
  // const YYMMDD = 'YYYYMMDD',
  //   HHMM = 'HHmm'
  // const startDate = data[0].timestamp
  // const endDate = data[data.length - 1].timestamp
  // const dayRange = endDate.diff(startDate, 'd')
  // const dayX = width / dayRange

  const rect = (x, y, w, h, fill, stroke = 'none', id) => {
    return <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} id={id} />
  }

  return (
    <div className="market-graph">
      <div>
        <div>PLOT</div>
        {plot != undefined && (
          <div>
            <Plot data={plot[0].data} layout={plot[0].layout} />
            <Plot data={plot[1].data} layout={plot[1].layout} />
          </div>
        )}
      </div>

      <svg width={width} height={height}>
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" stroke="#000000" />
        {rect(0, 20, width, height / 2 + 20, 'none', '#ff0000')}
        {/* {data.map((tok) => {
          return circ(
            getX(tok),
            getY(tok) + 20,
            (tok['sales_volume'] / maxValue) * 20 + 2,
            '#ff9900',
            'none',
            tok['token_id']
          )
        })} */}
      </svg>
    </div>
  )
}

export default Markets
