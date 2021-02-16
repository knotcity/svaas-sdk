# Knot Station and Vehicles as a Service (SVaaS) Software Development Kit (SDK)

This sdk allows you to use our service allowing you to control stations and vehicles.

More info on the service on our [Documentation](https://doc.knotcity.io/services/)

_README is a Work in progress_

# Installation

This project is written in TypeScript using Node.js 12 and targeting es2017.
It MAY work for older versions of Node.js.

Install using npm:
```
npm install @knotcity/svaas-sdk
```

# Usage

Import the module in the same way as you do normally.

```
// JavaScript
const svaas = require('@knotcity/svaas-sdk');
// TypeScript
import svaas = require('@knotcity/svaas-sdk');
```

## Creating a client

Before making request you need to create a new KnotSVaaS object with your keys

```
// Fetch your info
const yourKeyId = "...";
// Watch out for line break (should be `\n` and not `\\n`)
const yourPrivateKey = "...";
// The knot's public key is available on our [documentation](https://doc.knotcity.io/services/http-signature/#3-verify-signature)
// It's used if you want to verify the request we make to your API/Webhooks
const knotPublicKey = "...";

export const SVaaS = new svaas.KnotSVaaS({
    keyId: yourKeyId,
    privateKey: yourPrivateKey,
    knotPublicKey: knotPublicKey,
    vehiclesEndpoint: '...', // Optionally you can set a custom endpoint for the vehicles API (like if you are on our test environment)
    stationsEndpoint: '...' // Optionally you can set a custom endpoint for the stations API (like if you are on our test environment)
});

```

## Calling an action

To call a specific action use the client you just created and call the function you need.

```
try
{
    const resp = await SVaaS.unlockVehicle(vehicleId, unlockId);
    resp.code; // Response code, 0 most of the time, which meed success but it can be something else to inform of other actions to take
    resp.message; // A descriptive message associated with the code
    resp.data; // Data requested, if any
}
catch(err)
{
    // Something went wrong
}
```

## Verifying a request made to your API/Webhook from us

To be sure that a request to your API comes from us, you can verify its signature with the following function.
`req` is an Express request object

```
try
{
    const valid = SaaS.checkKnotRequestSignature({ headers: req.headers, httpMethod: req.method, path: req.originalUrl });
}
catch(err)
{
    // Something failed
}
```
