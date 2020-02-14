import { expect } from 'chai';
import ApifyClient from '../build';
import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage } from './_helper';

const DEFAULT_QUERY = {
    token: 'default-token',
};

function validateRequest(query = {}, params = {}, body = {}, headers = {}) {
    const request = mockServer.getLastRequest();
    const expectedQuery = getExpectedQuery(query);
    expect(request.query).to.be.eql(expectedQuery);
    expect(request.params).to.be.eql(params);
    expect(request.body).to.be.eql(body);
    expect(request.headers).to.include(headers);
}

function getExpectedQuery(callQuery = {}) {
    const query = optsToQuery(callQuery);
    return {
        ...DEFAULT_QUERY,
        ...query,
    };
}

function optsToQuery(params) {
    return Object
        .entries(params)
        .filter(([k, v]) => v !== false) // eslint-disable-line no-unused-vars
        .map(([k, v]) => {
            if (v === true) v = '1';
            else if (typeof v === 'number') v = v.toString();
            return [k, v];
        })
        .reduce((newObj, [k, v]) => {
            newObj[k] = v;
            return newObj;
        }, {});
}

describe('Actor methods', () => {
    let baseUrl = null;
    let page;
    before(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    after(() => mockServer.close());

    let client = null;
    beforeEach(async () => {
        page = await getInjectedPage(baseUrl, DEFAULT_QUERY);
        client = new ApifyClient({
            baseUrl,
            expBackoffMaxRepeats: 0,
            expBackoffMillis: 1,
            ...DEFAULT_QUERY,
        });
    });
    afterEach(async () => {
        client = null;
        await cleanUpBrowser(page);
    });

    it('listDispatches() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.webhookDispatches.listDispatches(opts);
        expect(res.id).to.be.eql('list-dispatches');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.webhookDispatches.listDispatches(options), opts);
        expect(browserRes).to.eql(res);
        validateRequest(opts);
    });

    it('getDispatch() works', async () => {
        const webhookDispatchId = 'some-id';

        const res = await client.webhookDispatches.getDispatch({ webhookDispatchId });
        expect(res.id).to.be.eql('get-dispatch');
        validateRequest({}, { webhookDispatchId });

        const browserRes = await page.evaluate(options => client.webhookDispatches.getDispatch(options), { webhookDispatchId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { webhookDispatchId });
    });

    it('getDispatch() 404 works', async () => {
        const webhookDispatchId = '404';

        const res = await client.webhookDispatches.getDispatch({ webhookDispatchId });
        expect(res).to.be.eql(null);
        validateRequest({}, { webhookDispatchId });

        const browserRes = await page.evaluate(options => client.webhookDispatches.getDispatch(options), { webhookDispatchId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { webhookDispatchId });
    });
});
