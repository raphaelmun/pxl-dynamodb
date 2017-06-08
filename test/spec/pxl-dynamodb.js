'use strict'

let PxlDynamodb = require('../../')
let uuid = require('uuid')

describe('PxlDynamodb', () => {

    let pxl = null

    before(() => {

        pxl = new PxlDynamodb({
            collectionPxls: 'pxls',
            collectionLinks: 'links',
            alwaysShortenWithNewLinkId: true
        })

    })

    after(() => {

        return pxl.disconnect()

    })

    it('should succeed from connect(...)', () => {

        return pxl.connect()

    })

    it('creates and logs a pxl', () => {

        let user = String(Math.random())
        let pxlKey = null

        return pxl.createPxl({ user })
            .then((doc) => {

                expect(doc.user).to.eql(user)
                expect(doc.count).to.eql(0)

                pxlKey = doc.pxl

                return pxl.logPxl(pxlKey)

            })
            .then((doc) => {

                expect(doc.user).to.eql(user)
                expect(doc.count).to.eql(1)

            })
            .then(() => {

                return pxl.logPxl(pxlKey)

            })
            .then((doc) => {

                expect(doc.user).to.eql(user)
                expect(doc.count).to.eql(2)

            })

    })

    it('does not log a not existing pxl', () => {

        return pxl.logPxl('impossible pxl')
            .then(() => {
                throw new Error('Expected error')
            })
            .catch((err) => {
                expect(err.message).to.eql('Pxl not found.')
            })

    })

    it('handles a key collision when creating a pxl', () => {

        let origCheckAndAddPxl = pxl.persistenceLayer.checkAndAddPxl

        let i = 0
        let firstPxl = null

        pxl.persistenceLayer.checkAndAddPxl = function (pxlKey, metadata) {

            i+=1

            switch (i) {
                case 1:
                    firstPxl = pxlKey
                    break
                case 2:
                    pxlKey = firstPxl
                    break
            }

            return Reflect.apply(origCheckAndAddPxl, pxl.persistenceLayer, [ pxlKey, metadata ])
                .catch((err) => {
                    if (i === 2) {
                        expect(err.name).to.eql('KeyCollisionError')
                    }
                    throw err
                })

        }

        return pxl.createPxl()
            .then(() => {

                return pxl.createPxl()
                    .then((createdPxl) => {
                        return pxl.logPxl(createdPxl.pxl)
                    })

            })
            .then(
                () => {
                    pxl.persistenceLayer.checkAndAddPxl = origCheckAndAddPxl
                },
                (err) => {
                    pxl.persistenceLayer.checkAndAddPxl = origCheckAndAddPxl
                    throw err
                }
            )

    })

    it('handles an unexpected error when creating a pxl', () => {

        let origDb = pxl.persistenceLayer.db

        pxl.persistenceLayer.db = {
            put() {
                return {
                    promise() {
                        return new Promise((resolve, reject) => {
                            throw new Error('Some unexpected error')
                        })
                    }
                }
            }
        }

        return pxl.createPxl()
            .then(
                () => {
                    pxl.persistenceLayer.db = origDb
                    throw new Error('Expected error')
                },
                (err) => {
                    pxl.persistenceLayer.db = origDb
                    expect(err.message).to.eql('Some unexpected error')
                }
            )

    })

    it('shortens and unshortens a link', () => {

        let link = String(Math.random())

        return pxl.shorten(link)
            .then((doc) => {

                expect(doc.link).to.eql(link)

                return pxl.unshorten(doc.linkId)

            })
            .then((loadedlink) => {

                expect(loadedlink).to.eql(link)

            })

    })

    it('does not unshorten a not existing link', () => {

        return pxl.unshorten('impossible link')
            .then(() => {
                throw new Error('Expected error')
            })
            .catch((err) => {
                expect(err.message).to.eql('Link not found.')
            })

    })

    it('handles a key collision when shortening a link', () => {

        let origCheckAndAddLink = pxl.persistenceLayer.checkAndAddLink

        let i = 0
        let firstLinkId = null
        let keyCollisionThrown = false

        pxl.persistenceLayer.checkAndAddLink = function (linkId, link, _skipExistingLinkCheck) {

            i+=1

            switch (i) {
                case 1:
                    firstLinkId = linkId
                    break
                case 2:
                    linkId = firstLinkId
                    break
            }

            return Reflect.apply(origCheckAndAddLink, pxl.persistenceLayer, [ linkId, link, _skipExistingLinkCheck ])
                .catch((err) => {
                    if (i === 2 && err.name === 'KeyCollisionError') {
                        keyCollisionThrown = true
                    }
                    throw err
                })

        }

        return pxl.shorten('some link')
            .then(() => {

                return pxl.shorten('some other link') // Collision must occur here
                    .then((shortenedLink) => {

                        expect(keyCollisionThrown).to.eql(true)

                        return pxl.unshorten(shortenedLink.linkId) // Just to verify it doesn't crash

                    })

            })
            .then(
                () => {
                    pxl.persistenceLayer.checkAndAddLink = origCheckAndAddLink
                },
                (err) => {
                    pxl.persistenceLayer.checkAndAddLink = origCheckAndAddLink
                    throw err
                }
            )

    })

    it('handles an unexpected error when shortening a link', () => {

        let origDb = pxl.persistenceLayer.db

        pxl.persistenceLayer.db = {
            put() {
                return {
                    promise() {
                        return new Promise((resolve, reject) => {
                            throw new Error('Some unexpected error')
                        })
                    }
                }
            }
        }

        return pxl.shorten('some link')
            .then(
                () => {
                    pxl.persistenceLayer.db = origDb
                    throw new Error('Expected error')
                },
                (err) => {
                    pxl.persistenceLayer.db = origDb
                    expect(err.message).to.eql('Some unexpected error')
                }
            )

    })

    it('reuses shortened links by default', () => {

        pxl.persistenceLayer.alwaysShortenWithNewLinkId = false

        let link1 = uuid.v4()
        let link2 = uuid.v4()

        let linkId1 = null
        let linkId2 = null
        let linkId3 = null

        return pxl.shorten(link1)
            .then((shortened1) => {
                linkId1 = shortened1.linkId

                return pxl.shorten(link2)
            })
            .then((shortened2) => {
                linkId2 = shortened2.linkId

                return pxl.shorten(link2)
            })
            .then((shortened3) => {
                linkId3 = shortened3.linkId

                expect(linkId1).to.not.eql(linkId2)
                expect(linkId2).to.eql(linkId3)

            })
            .then(
                () => {
                    pxl.persistenceLayer.alwaysShortenWithNewLinkId = true
                },
                (err) => {
                    pxl.persistenceLayer.alwaysShortenWithNewLinkId = true
                    throw err
                }
            )

    })

})
