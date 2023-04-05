export function formatTz(amount) {
  if (!isNumber(amount)) {
    return '–'
  }

  const amountFixed = (amount / 1000000).toFixed(2)
  return `${
    amountFixed.endsWith('.00') ? amountFixed.slice(0, -3) : amountFixed
  } ꜩ`
}

export function shortenTzAddress(address) {
  return `${address.substr(0, 5)}…${address.substr(-5)}`
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
