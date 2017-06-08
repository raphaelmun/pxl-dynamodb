# pxl-dynamodb

Access counting for any Express-served url - e.g. for a [tracking pixel](https://en.wikipedia.org/wiki/Web_beacon) in emails

## Overview

`pxl-dynamodb` is an extension of the [`pxl` library](https://github.com/analog-nico/pxl) that adds a persistence layer for DynamoDB based on [pxl-mongodb](https://github.com/analog-nico/pxl-mongodb).

Please check out the [README of the `pxl` library](https://github.com/analog-nico/pxl#readme) and then come back for instructions on [installing](#installation) and [using](#usage) this library.

## Installation

[![NPM Stats](https://nodei.co/npm/pxl-dynamodb.png?downloads=true)](https://npmjs.org/package/pxl-dynamodb)

This is a module for node.js and is installed via npm:

``` bash
npm install pxl-dynamodb --save
```

`pxl` is installed automatically with `pxl-dynamodb`.

## Usage

Everything described in the [README of the `pxl` library](https://github.com/analog-nico/pxl#readme) is relevant for `pxl-dynamodb` as well. The only difference is that this library includes a persistence layer for DynamoDB and needs to be initialized differently.

NOTE: The Pxls and Links tables must be created on the DB beforehand.

``` js
let PxlDynamodb = require('pxl-dynamodb')

let pxl = new PxlDynamodb({

    // Options described for the pxl lib like queryParam and logPxlFailed can be passed here as well
    
    // Additional options are:
    collectionPxls: 'pxls', // Name of the DynamoDB table to store pxl documents for access tracking
    collectionLinks: 'links', // Name of the DynamoDB table to store shortened links
    
    alwaysShortenWithNewLinkId: false // Set to true if you need a different linkId each time you shorten a link - even if the link was shortened before
    
    // Omit the options to use the default values equal to the example values above
    
})
```

Before you use any functions like `pxl.createdPxl(...)` you need to connect to the database:

``` js
pxl.connect({
        region: 'localhost',
        endpoint: 'http://localhost:8000',
        accessKeyId: 'MOCK_ACCESS_KEY_ID',
        secretAccessKey: 'MOCK_SECRET_ACCESS_KEY'
    }) // Passed values are the defaults
    .then((collections) => {
        
        // Returns the collections to allow creating additional indexes etc.
        
        collections.pxls.stats().then(console.dir)
        collections.lists.stats().then(console.dir)
        
    })
```

- First parameter `uri`: The DynamoDB connection string that is used to connect to the database using the [`dynamodb` library](https://www.npmjs.com/package/dynamodb)
- Second parameter `connectionOptions`: Additional options to configure the connection. For details see the [`dynamodb` API docs](http://dynamodb.github.io/node-dynamodb-native/2.2/api/MongoClient.html#.connect).
- Returns a promise with the collection objects as shown above. For details see the [`dynamodb` API docs](http://dynamodb.github.io/node-dynamodb-native/2.2/api/Collection.html).

And finally:

``` js
pxl.disconnect()
    .then(() => {
        console.log('Database connection is closed')
    })
```

## Contributing

To set up your development environment for `pxl-dynamodb`:

1. Clone this repo to your desktop,
2. in the shell `cd` to the main folder,
3. hit `npm install`,
4. hit `npm install gulp -g` if you haven't installed gulp globally yet, and
5. run `gulp dev`. (Or run `node ./node_modules/.bin/gulp dev` if you don't want to install gulp globally.)

`gulp dev` watches all source files and if you save some changes it will lint the code and execute all tests. The test coverage report can be viewed from `./coverage/lcov-report/index.html`.

If you want to debug a test you should use `gulp test-without-coverage` to run all tests without obscuring the code by the test coverage instrumentation.

## Change History

- v0.0.5 (2017-06-07)
    - Readme updated
- v0.0.4 (2017-06-07)
    - Initial version

## License (MIT)

See the [LICENSE file](LICENSE) for details.
