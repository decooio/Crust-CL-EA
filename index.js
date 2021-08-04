const { Requester, Validator } = require('@chainlink/external-adapter')
const { ApiPromise, WsProvider } = require('@polkadot/api')
const { typesBundleForPolkadot } = require('@crustio/type-definitions')
const { create } = require('ipfs-http-client')
const { sendTx } = require('./utils')

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
  cid: true,  // IPFS CID of file to store to crust. This is required
  hostNodes: false, // Multiaddresses of IPFS nodes the file is already stored on
  ipfsPinHost: false,  // Ipfs node to host the cid. This should be provided by Oracle Node
  crustNodeUrl: false, 
  crustOrderSeeds: false
}

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(input, customParams)

  const jobRunID = validator.validated.id
  const cid = validator.validated.data.cid
  const ipfsPinHost = validator.validated.data.ipfsPinHost || process.env.DEFAULT_IPFS_PIN_HOST
  const crustNodeUrl = validator.validated.data.crustNodeUrl || process.env.DEFAULT_CRUST_NODE_URL
  const crustOrderSeeds = validator.validated.data.crustOrderSeeds || process.env.DEFAULT_CRUST_ORDER_SEEDS

  // TODO: invoke '/api/v0/swarm/connect' API if 'hostNodes' is provided
  const ipfsUrl = `${ipfsPinHost}/api/v0/pin/add`
  console.log(`Pinning ${cid} to ${ipfsPinHost}`)

  // TODO: Add authentication token if passed

  // IPFS params
  const ipfsParams = {
    arg: cid,
    recursive: true,
    progress: true
  }
  
  const ipfsConfig = {
    url: ipfsUrl,
    params: ipfsParams,
    method: 'POST'
  }
  console.log(ipfsConfig)


  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(ipfsConfig, customError)
    .then(async (response) => {
      // It's common practice to store the desired value at the top-level
      // result key. This allows different adapters to be compatible with
      // one another.

      // get file size
      const ipfsClient = create(`${ipfsPinHost}`)
      const statRes = await ipfsClient.files.stat(`/ipfs/${cid}`, {size: true})
      const cumulativeSize = statRes.cumulativeSize

      // place crust order
      const crustChain = new ApiPromise({
        provider: new WsProvider(crustNodeUrl),
        typesBundle: typesBundleForPolkadot
      });
      await crustChain.isReadyOrError

      const tx = crustChain.tx.market.placeStorageOrder(cid, cumulativeSize, 0);
      const res = await sendTx(tx, crustOrderSeeds);
      if (res) {
        console.log(`Publish ${cid} success`)
      } else {
        console.error('Publish failed with \'Send transaction failed\'')
      }

      response.data.result = cid
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      console.log(error)
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
