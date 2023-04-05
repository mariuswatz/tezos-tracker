import './Tokens.css'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import Graph from './graph/Graph'

const Tokens = ({ input, size }) => {
  const [tokens, setTokens] = useState(undefined)

  useEffect(() => {
    console.log('prep token data')
    input.forEach((tok) => {
      tok.timestamp = dayjs(tok['minted_at'])
    })
    input.sort((a, b) => a.timestamp - b.timestamp)

    setTokens(input)
  }, [input])

  return (
    <div className="tokens">
      {!tokens && <div> no tokens</div>}
      {tokens && (
        <div>
          <h2>{tokens.length} tokens</h2>
          <Graph data={tokens} width={size.width - 20} height={400} />
          <ul>
            {tokens.map((tok) => {
              if (tok.editions > 0)
                return (
                  <li key={tok['token_id'] + ' ' + tok.name}>
                    <a href={getTokenLink(tok)}>
                      {' '}
                      {tok['token_id']} {tok.name}
                    </a>
                  </li>
                )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function getTokenLink(token) {
  switch (token.platform) {
    case 'HEN': {
      return `https://teia.art/objkt/${token.token_id}`
    }
    case 'FXHASH': {
      if (token.fa2_address === 'KT1EfsNuqwLAWDd3o4pvfUx1CAh5GMdTrRvr') {
        return `https://www.fxhash.xyz/gentk/FX1-${token.token_id}`
      } else {
        return `https://www.fxhash.xyz/gentk/${token.token_id}`
      }
    }
    case 'VERSUM': {
      return `https://versum.xyz/token/versum/${token.token_id}`
    }
    case 'TYPED': {
      return `https://typed.art/${token.token_id}`
    }
    case '8BIDOU': {
      if (token.fa2_address === 'KT1MxDwChiDwd6WBVs24g1NjERUoK622ZEFp') {
        return `https://www.8bidou.com/listing/?id=${token.token_id}`
      }

      if (token.fa2_address === 'KT1TR1ErEQPTdtaJ7hbvKTJSa1tsGnHGZTpf') {
        return `https://ui.8bidou.com/item_g/?id=${token.token_id}`
      }

      if (token.fa2_address === 'KT1VikAWA8wQHLZgHoAGL7Z9kCjgbCEnvWA3') {
        return `https://www.8bidou.com/r_item/?id=${token.token_id}`
      }
      break
    }
    default: {
      return `https://objkt.com/asset/${token.fa2_address}/${token.token_id}`
    }
  }
}

export default Tokens
