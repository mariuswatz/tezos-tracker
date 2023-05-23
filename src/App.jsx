import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import Tokens from './Tokens'
import viteLogo from '/vite.svg'
import './App.css'
import Papa from 'papaparse'
import Markets from './graph/Markets'

function App() {
  const [count, setCount] = useState(0)
  const [tokenData, setTokenData] = useState(undefined)
  const [marketData, setMarketData] = useState(undefined)
  const size = useWindowSize()

  const fetchCSV = () => {
    const csvFile = "/data/20230515-sales_volume_week.report.lv-dao.xyz.csv";
    console.log('fetch CSV')
    fetch(csvFile)
      .then((response) => {
        return response.text()
      })
      .then((data) => {
        console.log(data)

        Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            setMarketData(results.data)
          },
        });
        // const records = parse(data, {
        //   columns: true,
        //   skip_empty_lines: true
        // })

        // console.log(records)
      })
      .catch((e) => {
        console.log(e.message)
      })
  }
  const fetchJson = () => {
    console.log('fetch')
    fetch('/data/creations.json')
      .then((response) => {
        console.log(response)
        return response.json()
      })
      .then((data) => {
        setTokenData(data)
        console.log('set data', data.tokens.length)
      })
      .catch((e) => {
        console.log(e.message)
      })
  }
  useEffect(() => {
    fetchJson()
  }, [])

  return (
    <div className="App">
      <h1>Tezos Artist Tracker</h1>
      <Markets data={marketData} width={100} height={100} />
      {tokenData && <Tokens input={tokenData.tokens} size={size} />}
      {!tokenData && <div>Loading</div>}
    </div>
  )
}

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  })
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    // Add event listener
    window.addEventListener('resize', handleResize)
    // Call handler right away so state gets updated with initial window size
    handleResize()
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Empty array ensures that effect is only run on mount
  return windowSize
}
export default App
