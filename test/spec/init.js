'use strict'

let PxlDynamodb = require('../../')

describe('To initialize, PxlDynamodb', () => {

    it('should not accept multiple connect(...) calls', () => {

        let pxl = new PxlDynamodb({
            collectionPxls: 'pxl-dynamodb-text-pxls',
            collectionLinks: 'pxl-dynamodb-text-links'
        })

        return pxl.connect()
            .then(() => {

                return pxl.connect()
                    .then(
                        () => {
                            throw new Error('Expected an error')
                        },
                        (err) => {
                            // Error expected
                            expect(err.message).to.eql('Database connection is already established. Please do not call PxlDynamodb.connect(...) twice.')
                        }
                    )

            })
            .then(
                () => {
                    pxl.disconnect()
                },
                (err) => {

                    return pxl.disconnect()
                        .then(() => {
                            throw err
                        })

                }
            )

    })

    it('should not accept createPxl(...) calls before connect(...)', () => {

        let pxl = new PxlDynamodb({
            collectionPxls: 'pxl-dynamodb-text-pxls',
            collectionLinks: 'pxl-dynamodb-text-links'
        })

        return pxl.createPxl()
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
                }
            )

    })

    it('should not accept logPxl(...) calls before connect(...)', () => {

        let pxl = new PxlDynamodb({
            collectionPxls: 'pxl-dynamodb-text-pxls',
            collectionLinks: 'pxl-dynamodb-text-links'
        })

        return pxl.logPxl('abcdefgh')
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
                }
            )

    })

    it('should not accept shorten(...) calls before connect(...)', () => {

        let pxl = new PxlDynamodb({
            collectionPxls: 'pxl-dynamodb-text-pxls',
            collectionLinks: 'pxl-dynamodb-text-links'
        })

        return pxl.shorten('some link')
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
                }
            )

    })

    it('should not accept unshorten(...) calls before connect(...)', () => {

        let pxl = new PxlDynamodb({
            collectionPxls: 'pxl-dynamodb-text-pxls',
            collectionLinks: 'pxl-dynamodb-text-links'
        })

        return pxl.unshorten('abcdefgh')
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
                }
            )

    })

    it('should not accept disconnect() calls before connect(...)', () => {

        let pxl = new PxlDynamodb({
            collectionPxls: 'pxl-dynamodb-text-pxls',
            collectionLinks: 'pxl-dynamodb-text-links'
        })

        return pxl.disconnect()
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlDynamodb.connect(...) first.')
                }
            )

    })

    it('should reject connect(...) if db connection cannot be established', () => {

        let pxl = new PxlDynamodb({
            collectionPxls: 'pxl-dynamodb-text-pxls',
            collectionLinks: 'pxl-dynamodb-text-links'
        })

        return pxl.connect('dynamodb:invalid')
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                () => {
                    // Error expected
                }
            )

    })

})
