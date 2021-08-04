# Crust Chainlink External Adapter

External Adapter to pin file to Crust network

## Input Params
- `cid`: IPFS CID of file to store to crust. This is required.
- `hostNodes`: Multiaddresses of IPFS nodes the file is already stored on. This is optional, but providing this could accelerate processing speed of the pinning process.
- `ipfsPinHost`: Ipfs host to pin the file before placing order to Crust network. This should be provided by Oracle node. If not provided, 'https://crustwebsites.net' will be used.
- `crustNodeUrl`: Crust node to send place order request to. If not passed, 'wss://rocky-api.crust.network' will be used.
- `crustOrderSeeds`: Private seeds of the Crust account to send the place-order transaction.


## Output

```json
{
 "jobRunID": "1",
  "data": {
    "Pins": [ "QmX7gkeWYuDUjRPpgLhUNX9MGzVMYqfqQypKQnht8Qf27P" ],
    "result": "QmX7gkeWYuDUjRPpgLhUNX9MGzVMYqfqQypKQnht8Qf27P"
  },
  "result": "QmX7gkeWYuDUjRPpgLhUNX9MGzVMYqfqQypKQnht8Qf27P",
  "statusCode": 200
}
```

## Install Locally

Install dependencies:

```bash
yarn
```

### Test

Run the local tests:

```bash
yarn test
```

Natively run the application (defaults to port 8080):

### Run

```bash
yarn start
```

## Call the external adapter/API server

```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "from": "ETH", "to": "USD" } }'
```

## Docker

If you wish to use Docker to run the adapter, you can build the image by running the following command:

```bash
docker build . -t external-adapter
```

Then run it with:

```bash
docker run -p 8080:8080 -it external-adapter:latest
```

## Serverless hosts

After [installing locally](#install-locally):

### Create the zip

```bash
zip -r external-adapter.zip .
```

### Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 12.x for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `external-adapter.zip` file
- Handler:
    - index.handler for REST API Gateways
    - index.handlerv2 for HTTP API Gateways
- Add the environment variable (repeat for all environment variables):
  - Key: API_KEY
  - Value: Your_API_key
- Save

#### To Set Up an API Gateway (HTTP API)

If using a HTTP API Gateway, Lambda's built-in Test will fail, but you will be able to externally call the function successfully.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose HTTP API
- Select the security for the API
- Click Add

#### To Set Up an API Gateway (REST API)

If using a REST API Gateway, you will need to disable the Lambda proxy integration for Lambda-based adapter to function.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose REST API
- Select the security for the API
- Click Add
- Click the API Gateway trigger
- Click the name of the trigger (this is a link, a new window opens)
- Click Integration Request
- Uncheck Use Lamba Proxy integration
- Click OK on the two dialogs
- Return to your function
- Remove the API Gateway and Save
- Click Add Trigger and use the same API Gateway
- Select the deployment stage and security
- Click Add

### Install to GCP

- In Functions, create a new function, choose to ZIP upload
- Click Browse and select the `external-adapter.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable (repeat for all environment variables)
  - NAME: API_KEY
  - VALUE: Your_API_key
