import dayjs from 'dayjs'

export function sortEvents(data) {
  data.events.sort((a, b) => {
    return dayjs(a.timestamp).diff(dayjs(b.timestamp))
  })
}

export function getPeriods(data) {
  const period = {}
  let arrKey = Object.keys(data)[0]

  data[arrKey].forEach((tok) => {
    const year = dayjs(tok.timestamp).year()

    if (!period[year]) period[year] = []
    period[year].push(tok)
  })

  let str = 'getPeriods - '
  Object.keys(period).forEach((key) => {
    str += `${key}: ${period[key].length}`
  })

  return period
}

export async function getThumb(token) {
  let fileExt

  try {
    const filename = `output/thumb/${token.token.fa2_address}_${token.token.token_id}`

    const found = false
    let cnt = 0
    const dir = fs.readdirSync('output/thumb/')
    dir.forEach((file) => {
      cnt++
      if (file.indexOf(filename) > -1) found = true
    })

    if (found) {
      console.log('Thunbnail found. ', filename)
      return
    } else {
      let uri = token.token.thumbnail_uri.substring(7)
      if (token.token.fx_collection_thumbnail_uri) uri = token.token.fx_collection_thumbnail_uri.substring(7)

      let file = 'https://ipfs.io/ipfs/' + uri
      console.log(`${cnt} thumbs`, 'getThumb', "'" + token.token.name + "'", file)
      var req = await fetch(file)

      fileExt = req.headers.get('content-type')
      if (fileExt.startsWith('text')) {
        fileExt = 'txt'
      } else fileExt = fileExt.substring(fileExt.indexOf('/') + 1)

      if (fileExt.indexOf('.') > -1) fileExt = fileExt.substring(0, fileExt.indexOf('.'))

      let binary
      if (fileExt.startsWith('txt')) binary = await req.text()
      else binary = await req.arrayBuffer()

      if (fileExt.startsWith('txt')) fs.writeFileSync(`${filename}.${fileExt}`, binary)
      else fs.writeFileSync(`${filename}.${fileExt}`, new Int8Array(binary))
      console.log('file type', req.headers.get('content-type'), fileExt, '\t' + token.token.name)
    }
  } catch (e) {
    console.log('getThumb:', fileExt, e, token)
  }
}
