'use strict'

let assign = require('lodash/assign')
let AWS = require('aws-sdk')
let Pxl = require('pxl')

class DynamodbPersistenceLayer extends Pxl.PersistenceLayerBase {

    constructor({ collectionPxls = 'pxls', collectionLinks = 'links', alwaysShortenWithNewLinkId = false } = {}) {

        super()

        this.db = null
        this.collectionPxls = collectionPxls
        this.collectionLinks = collectionLinks
        this.alwaysShortenWithNewLinkId = alwaysShortenWithNewLinkId

    }

    connect(connectionOptions = {
        region: 'localhost',
        endpoint: 'http://localhost:8000',
        accessKeyId: 'MOCK_ACCESS_KEY_ID',
        secretAccessKey: 'MOCK_SECRET_ACCESS_KEY'
    }) {

        if (this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is already established. Please do not call PxlDynamodb.connect(...) twice.')
            })
        }

        return new Promise((resolve, reject) => {
            this.db = new AWS.DynamoDB.DocumentClient(connectionOptions)
            resolve('Success')
        })
    }

    disconnect() {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
            })
        }

        return new Promise((resolve, reject) => {
            this.db = null
            resolve('Success')
        })

    }

    checkAndAddPxl(pxl, metadata) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
            })
        }

        let pxlObj = assign({}, metadata, {
            pxl,
            count: 0
        })

        const params = {
            TableName: this.collectionPxls,
            Item: pxlObj,
            ConditionExpression: 'attribute_not_exists(pxl)'
        }

        return this.db.put(params).promise()
            .then((result) => {
                return pxlObj
            })
            .catch((err) => {
                if (err.code === 'ConditionalCheckFailedException') {
                    throw new Pxl.errors.KeyCollisionError()
                }
                throw err
            })
    }

    logPxl(pxl) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
            })
        }

        const params = {
            TableName: this.collectionPxls,
            Key: {
                pxl
            },
            ExpressionAttributeNames: {
                '#count': 'count'
            },
            ExpressionAttributeValues: {
                ':count': 1
            },
            ConditionExpression: 'attribute_exists(pxl)',
            UpdateExpression: 'ADD #count :count',
            ReturnValues: 'ALL_NEW'
        }

        return this.db.update(params).promise()
            .then((result) => {
                return result.Attributes
            })
            .catch((err) => {
                if (err.code === 'ConditionalCheckFailedException') {
                    throw new Error('Pxl not found.')
                }
                throw err
            })
    }

    checkAndAddLink(linkId, link, _skipExistingLinkCheck = false) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
            })
        }

        if (!_skipExistingLinkCheck && this.alwaysShortenWithNewLinkId === false) {
            const skipParams = {
                TableName: this.collectionLinks,
                IndexName: 'link',
                KeyConditionExpression: 'link=:link',
                ExpressionAttributeValues: {
                    ':link': link
                }
            }

            return this.db.query(skipParams).promise()
                .then((result) => {
                    if (result && result.Items.length > 0) {
                        return result.Items[0]
                    }
                    return this.checkAndAddLink(linkId, link, true)
                })
        }

        let linkObj = {
            linkId,
            link
        }

        const params = {
            TableName: this.collectionLinks,
            Item: linkObj,
            ConditionExpression: 'attribute_not_exists(linkId)'
        }

        return this.db.put(params).promise()
            .then((result) => {
                return linkObj
            })
            .catch((err) => {
                if (err.code === 'ConditionalCheckFailedException') {
                    throw new Pxl.errors.KeyCollisionError()
                }
                throw err
            })
    }

    lookupLink(linkId) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
            })
        }

        const params = {
            TableName: this.collectionLinks,
            Key: {
                linkId
            }
        }

        return this.db.get(params).promise()
            .then((result) => {
                if (!result || !Object.keys(result).length) {
                    throw new Error('Link not found.')
                }
                return result.Item.link
            })
    }

}

module.exports = DynamodbPersistenceLayer
