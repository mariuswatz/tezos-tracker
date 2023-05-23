# tezos-tracker

Experimental tool to track minted tokens and transactions on Tezos. Uses the [TezTok API](https://www.teztok.com/), leaning heavily on the [example code](https://www.teztok.com/docs/examples) to get an idea of how to get data.

This is a preliminary work-in-progress, most parts (like the Vite app) are incomplete. There is some functional parts related to using the TezTok API in the _src-data/_ folder.

### 2023-05-23

Basic Tezos data tools can be found in /src-data, specifically _sales.js_ and _index.js_.

Set _artistAddress_ in _index.js_ to the wallet you want.

Run it with _node src-data/index.js_.

CSV Output will go to _output/sales.csv_.
