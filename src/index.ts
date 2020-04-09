import axios = require('axios');
import reqSigner = require('@knot/request-signer');

interface KnotSASOptions
{
    endpoint?: string;
    privateKey: string;
    keyId: string;
}

export class KnotSAS
{
    #options: KnotSASOptions;
    #ax: axios.AxiosInstance;

    constructor(options: KnotSASOptions)
    {
        if (typeof (options) !== 'object')
        {
            throwError("Options should be an object");
        }
        if (options.endpoint !== undefined)
        {
            if (typeof options.endpoint !== 'string')
            {
                throwError("The given endpoint should be a string");
            }
            if (options.endpoint.length < 3)
            {
                throwError("The given endpoint is too short to be valid");
            }
            if (options.endpoint.endsWith('/'))
            {
                options.endpoint = options.endpoint.substr(0, options.endpoint.length - 1);
            }
        }
        if (typeof options.keyId !== 'string')
        {
            throwError("The given keyId should be a string");
        }
        if (typeof options.privateKey !== 'string')
        {
            throwError("The given privateKey should be a string");
        }

        this.#options = options;
        this.#ax = axios.default.create({
            baseURL: this.#options.endpoint || 'https://services.knotcity.io'
        });
        this.#ax.interceptors.request.use(c =>
        {
            c.headers['X-Knot-Date'] = +new Date();
            c.headers['Content-Type'] = 'application/json';
            c.headers['Content-Length'] = c.data ? JSON.stringify(c.data).length : 0;
            try
            {
                c.headers['Authorization'] = reqSigner.generateAuthorization({
                    headers: c.headers,
                    method: c.method || 'POST',
                    path: c.url || '/'
                }, {
                    algorithm: 'ecdsa',
                    hash: 'sha256',
                    headers: ['X-Knot-Date', '(request-target)', 'Content-Type', 'Content-Length'],
                    keyId: this.#options.keyId,
                    privateKey: this.#options.privateKey
                });
            }
            catch (err)
            {
                throwError(`Generating the request signature failed: ${err.toString()}`);
            }
            return c;
        });
    }

    rebootStation(id: number)
    {
        return this.makeStationRequest(id, 'reboot');
    }

    pingStation(id: number)
    {
        return this.makeStationRequest(id, 'ping');
    }

    unlockSpot(stationId: number, spotId: number, unlockId: number)
    {
        if (!Number.isInteger(spotId) || spotId < 1)
        {
            throwError('Spot ID should be an integer greater or equal to 1');
        }
        if (!Number.isInteger(unlockId) || unlockId < 0)
        {
            throwError('Unlock ID should be an integer greater or equal to 0');
        }
        return this.makeStationRequest(stationId, 'unlock', {
            spot: spotId,
            unlock: unlockId
        });
    }

    private makeStationRequest(id: number, action: string, data?: any)
    {
        if (!Number.isInteger(id) || id < 1)
        {
            throwError('Station ID should be an integer greater or equal to 1');
        }
        return this.makeRequest(`/stations/${id}/${action}`, data);
    }

    private async makeRequest(urn: string, data?: any)
    {
        const response = await this.#ax.post(`${urn}`, data, {
            validateStatus: (status) => status >= 200 && status < 500
        });
        console.log(response);
    }
}

function throwError(text: string)
{
    throw new Error(`[Knot SAS SDK] ${text}`);
}
