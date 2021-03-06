'use strict'

let assign = require('lodash/assign')
let DynamodbPersistenceLayer = require('./DynamodbPersistenceLayer.js')
let Pxl = require('pxl')


class PxlDynamodb extends Pxl {

    constructor(options) {

        super(assign({
            persistenceLayer: new DynamodbPersistenceLayer(options)
        }, options))

    }

    connect(connectionOptions) {
        return this.persistenceLayer.connect(connectionOptions)
    }

    disconnect() {
        return this.persistenceLayer.disconnect()
    }

}

module.exports = PxlDynamodb
