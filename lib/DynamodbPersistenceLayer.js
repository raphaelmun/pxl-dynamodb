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

    connect(connectionOptions = {}) {

        if (this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is already established. Please do not call PxlDynamodb.connect(...) twice.')
            })
        }

        const dynamoDb = new AWS.DynamoDB.DocumentClient(connectionOptions).Doc();
        this.db = dynamoDb;

        return new Promise((resolve, reject) => {});
    }

    disconnect() {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
            })
        }

        let db = this.db
        this.db = null

        return new Promise((resolve, reject) => {});

    }

    checkAndAddPxl(pxl, metadata) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
            })
        }

        const params = {
            TableName: this.collectionPxls,
            Item: {
                id: pxl,
                count: 0,
                metadata: metadata
            },
            ConditionExpression: "attribute_not_exists(id)"
        };

        return this.db.put(params).promise()
            .then((result) => {
                return result.Attributes;
            })
            .catch((err) => {
                if (err instanceof ConditionalCheckFailedException) {
                    throw new Pxl.errors.KeyCollisionError()
                }
                throw err;
            });
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
                id: pxl
            },
            ExpressionAttributeNames: {
                "#count": "count"
            },
            ExpressionAttributeValues: {
                ":count": 1
            },
            UpdateExpression: "ADD #count :count",
            ReturnValues: "ALL_NEW"
        };

        return this.db.update(params).promise()
            .then((result) => {
                return result.Attributes;
            })
            .catch((err) => {
                throw err;
            });
    }

    checkAndAddLink(linkId, link, _skipExistingLinkCheck = false) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
            })
        }

        if (!_skipExistingLinkCheck && this.alwaysShortenWithNewLinkId === false) {
            const params = {
                TableName: this.collectionLinks,
                Key: {
                    "id": linkId
                }
            };

            return this.db.get(params).promise()
                .then((result) => {
                    if (result) {
                        return result.Item;
                    }
                    return this.checkAndAddLink(linkId, link, true);
                });
        }

        const params = {
            TableName: this.collectionLinks,
            Item: {
                id: linkId,
                link: link
            },
            ConditionExpression: "attribute_not_exists(id)"
        };

        return this.db.put(params).promise()
            .then((result) => {
                return result.Attributes;
            })
            .catch((err) => {
                if (err instanceof ConditionalCheckFailedException) {
                    throw new Pxl.errors.KeyCollisionError()
                }
                throw err;
            });
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
                "id": linkId
            }
        };

        return this.db.get(params).promise()
            .then((result) => {
                if (!result) {
                    throw new Error('Link not found.')
                }
                return result.Item.link;
            });
    }

}

module.exports = DynamodbPersistenceLayer
