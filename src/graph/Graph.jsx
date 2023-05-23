import { SVG, extend as SVGextend, Element as SVGElement } from '@svgdotjs/svg.js'
import dayjs from 'dayjs'
import './Graph.css'

const Graph = ({ data, width, height }) => {
  //   const svgString = `<svg
  //       width="${width}"
  //       height="${height}"

  //     >

  //           <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="$ffffff" />
  //       <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="#ffffff" />
  //       </svg>
  // `
  //   const htmlContent = { __html: svgString }
  //   return (
  //     <div className="graph-container" dangerouslySetInnerHTML={htmlContent} />
  //   )

  const YYMMDD = 'YYYYMMDD',
    HHMM = 'HHmm'
  const startDate = data[0].timestamp
  const endDate = data[data.length - 1].timestamp
  const dayRange = endDate.diff(startDate, 'd')
  const dayX = width / dayRange

  let maxValue = 0
  data.forEach((tok) => {
    maxValue = Math.max(tok['sales_volume'], maxValue)
  })
  console.log('max value', maxValue / 1000000)
  const getX = (tok) => {
    return dayX * tok.timestamp.diff(startDate, 'd')
  }

  const getY = (tok) => {
    const D = (tok.timestamp.hour() * 60 + tok.timestamp.minute()) / 1440
    return height * 0.5 * D
  }

  const circ = (x, y, r, fill, stroke = 'none', id) => {
    return <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} key={`${x} ${id}`} id={id} />
  }

  const rect = (x, y, w, h, fill, stroke = 'none', id) => {
    return <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} id={id} />
  }

  width = width - 20
  return (
    <div className="token-timeline">
      <svg width={width} height={height}>
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" stroke="#000000" />
        {rect(0, 20, width, height / 2 + 20, 'none', '#ff0000')}
        {data.map((tok) => {
          return circ(
            getX(tok),
            getY(tok) + 20,
            (tok['sales_volume'] / maxValue) * 20 + 2,
            '#ff9900',
            'none',
            tok['token_id']
          )
        })}
      </svg>
    </div>
  )
}

export default Graph
