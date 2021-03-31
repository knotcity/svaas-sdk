import axios = require('axios');
import reqSigner = require('@knotcity/http-request-signer');
import {
    AuthorizationHeaderComponents,
    parseAuthorizationHeader,
    verifyAuthorization
} from '@knotcity/http-request-signer';

import { KnotCode } from './KnotCode';
import { SVaaSError } from './SVaaSError';
import type {
    BadgeReaderStatus,
    ConfirmLockAnswer,
    DisabledStations,
    EnabledStations,
    KnotStationEvent,
    StationConfigType,
    StationInformation
} from './station';
import type {
    DisabledVehicles,
    EnabledVehicles,
    KnotVehicleEvent,
    VehicleConfig,
    VehicleInformation
} from './vehicle';
import { VehicleLightState, VehicleSoundType } from './vehicle';

export type KnotEvent = KnotStationEvent | KnotVehicleEvent;

export type RequestResults = {
    code: KnotCode;
    message: string;
};

export type RequestResultsFailure = RequestResults & { code: Exclude<KnotCode, KnotCode.SUCCESS> };
export type RequestResultsSuccessWithData<T = any> = RequestResults & {
    code: KnotCode.SUCCESS;
    data: T;
};

export type RequestResultsWithData<T> = RequestResultsFailure | RequestResultsSuccessWithData<T>;

/**
 * Interface for SVaaS option used in the KnotSVaaS class constructor.
 * @interface
 */
interface KnotSVaaSOptions
{
    /**
     * Url of the stations endpoint (by default: 'https://staas.knotcity.io').
     */
    stationsEndpoint?: string;
    /**
     * Url of the vehicles endpoint (by default: 'https://vaas.knotcity.io').
     */
    vehiclesEndpoint?: string;
    /**
     * Private key used to sign your request.
     */
    privateKey: string;
    /**
     * Public key used for check events signature.
     */
    knotPublicKey: string;
    /**
     * Key's identifier.
     */
    keyId: string;
    /**
     * Axios' configuration.
     */
    axiosRequestConfig?: axios.AxiosRequestConfig;
}

/**
 * Interface describing the structure of data used to verify the signature of a request.
 * @interface
 */
interface SignatureEvent
{
    headers: { [key: string]: any };
    httpMethod: string;
    path: string;
}

/**
 * Knot Stations and Vehicles as a Service SDK main class.
 */
export class KnotSVaaS
{
    #options: KnotSVaaSOptions;
    #ax: axios.AxiosInstance;

    /**
     * Class constructor.
     * @param {KnotSVaaSOptions} options - Information for the SVaaS connection (keys and endpoints).
     */
    constructor(options: KnotSVaaSOptions)
    {
        if (typeof (options) !== 'object')
        {
            throw new SVaaSError('Options should be an object');
        }
        if (options.stationsEndpoint !== undefined)
        {
            if (typeof options.stationsEndpoint !== 'string')
            {
                throw new SVaaSError('The given stations endpoint should be a string');
            }
            if (options.stationsEndpoint.length < 3)
            {
                throw new SVaaSError('The given stations endpoint is too short to be valid');
            }
            if (options.stationsEndpoint.endsWith('/'))
            {
                options.stationsEndpoint = options.stationsEndpoint.substr(0, options.stationsEndpoint.length - 1);
            }
        }
        if (options.vehiclesEndpoint !== undefined)
        {
            if (typeof options.vehiclesEndpoint !== 'string')
            {
                throw new SVaaSError('The given vehicles endpoint should be a string');
            }
            if (options.vehiclesEndpoint.length < 3)
            {
                throw new SVaaSError('The given vehicles endpoint is too short to be valid');
            }
            if (options.vehiclesEndpoint.endsWith('/'))
            {
                options.vehiclesEndpoint = options.vehiclesEndpoint.substr(0, options.vehiclesEndpoint.length - 1);
            }
        }
        if (typeof options.keyId !== 'string')
        {
            throw new SVaaSError('The given keyId should be a string');
        }
        if (typeof options.privateKey !== 'string')
        {
            throw new SVaaSError('The given privateKey should be a string');
        }
        if (!options.axiosRequestConfig)
        {
            options.axiosRequestConfig = {};
        }

        this.#options = options;
        this.#ax = axios.default.create({ validateStatus: status => status === 200 });
        this.#ax.interceptors.request.use(c =>
        {
            c.headers['X-Knot-Date'] = +new Date();
            c.headers['X-Api-Key'] = this.#options.keyId;
            c.headers['Content-Type'] = 'application/json';
            c.headers['Content-Length'] = c.data ? JSON.stringify(c.data).length : 0;
            try
            {
                const url =  c.url ? new URL(c.url) : undefined;
                c.headers['Authorization'] = reqSigner.generateAuthorization({
                    headers: c.headers,
                    method: c.method || 'POST',
                    path: url?.href.split(url.origin)[1] || '/'
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
                throw new SVaaSError(`Generating the request signature failed: ${err.toString()}`);
            }
            return c;
        });
    }

    //#region Station commands
    /**
     * Request a station to reboot.
     * @param {number} stationId - The identifier of the station.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1{stationId}~1reboot/post
     */
    rebootStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest<RequestResults>('POST', 'v1', 'reboot', stationId);
    }

    /**
     * Ping a station.
     * @param {number} stationId - The identifier of the station.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1{stationId}~1ping/post
     */
    pingStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest<RequestResults>('POST', 'v1', 'ping', stationId);
    }

    /**
     * Update a station configuration.
     * @param {number} stationId - The identifier of the station.
     * @param {StationConfigType} type - The name of the configuration to edit.
     * @param {number} value - The value of the configuration.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1{stationId}~1config/post
     */
    configureStation(stationId: number, type: StationConfigType, value: number): Promise<RequestResults>
    {
        return this.makeStationRequest<RequestResults>('POST', 'v1', 'config', stationId, {
            config: type,
            value
        });
    }

    /**
     * Unlock a spot of a station.
     * @param {number} stationId - The identifier of the station.
     * @param {number} spotId - The identifier of the spot to unlock.
     * @param {number} unlockId - An identifier to track this unlock request. This will be sent back in the unlocked event.
     * @param {boolean} ignoreVehicleResponse - When true, we ignore the vehicle unlock response if there is vehicle with IoT on the spot. Useful for maintenance as it allow to unlock a spot with a broken or unavailable vehicle.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1{stationId}~1unlock/post
     */
    unlockSpot(stationId: number, spotId: number, unlockId: number, ignoreVehicleResponse?: boolean): Promise<RequestResults>
    {
        if (!Number.isInteger(spotId) || spotId < 1)
        {
            throw new SVaaSError('Spot ID should be an integer greater or equal to 1');
        }
        if (!Number.isInteger(unlockId) || unlockId < 1)
        {
            throw new SVaaSError('Unlock ID should be an integer greater or equal to 1');
        }
        if (ignoreVehicleResponse !== undefined && typeof ignoreVehicleResponse !== 'boolean')
        {
            throw new SVaaSError('Ignore vehicle response should be a boolean or undefined');
        }
        return this.makeStationRequest<RequestResults>('POST', 'v1', 'unlock', stationId, {
            spot: spotId,
            unlock: unlockId,
            ignore_vehicle_response: ignoreVehicleResponse
        });
    }

    /**
     * Request a station to scan all of its spots. For each spot with a vehicle in, the station will re-send the locked event.
     * @param {number} stationId - The identifier of the station.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1{stationId}~1refresh/post
     */
    scanAllStationSpot(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest<RequestResults>('POST', 'v1', 'refresh', stationId);
    }

    /**
     * Confirm the locking of the station. This is to be used as a response to the locked event.
     * @param {number} stationId - The identifier of the station.
     * @param {number} spotId - The identifier of the spot to which to send the lock response.
     * @param {ConfirmLockAnswer} accepted - Response status of the vehicle's lock on the station.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1{stationId}~1lock-response/post
     */
    confirmLockSpot(stationId: number, spotId: number, accepted: ConfirmLockAnswer): Promise<RequestResults>
    {
        return this.makeStationRequest<RequestResults>('POST', 'v1', 'lock-response', stationId, {
            spot: spotId,
            accepted
        });
    }

    /**
     * Send a feedback to the badge reader of a station. This is used as a response to the badge event to show a success or failure to the user.
     * @param {number} stationId - The identifier of the station.
     * @param {BadgeReaderStatus} status - Type of feedback.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1{stationId}~1badge/post
     */
    badgeReaderFeedback(stationId: number, status: BadgeReaderStatus): Promise<RequestResults>
    {
        return this.makeStationRequest<RequestResults>('POST', 'v1', 'badge', stationId, {
            status
        });
    }

    /**
     * Enable a station.
     * @param {number} stationId - The identifier of the station.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1enabled/get
     */
    enableStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest<RequestResults>('POST', 'v1', 'enable', stationId);
    }

    /**
     * Get a station's information and current state.
     * @param {number} stationId - The identifier of the station.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1{stationId}/get
     */
    async getStationInformation(stationId: number): Promise<StationInformation>
    {
        const requestResults = await this.makeStationRequest<StationInformation>('GET', 'v1', '', stationId);
        if (requestResults.code == KnotCode.SUCCESS && requestResults.data.activation_date)
        {
            requestResults.data.activation_date = new Date(requestResults.data.activation_date);
        }
        return requestResults;
    }

    /**
     * Get the list of enabled stations.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1enabled/get
     */
    async getEnabledStations(): Promise<EnabledStations>
    {
        const requestResults = await this.makeStationRequest<EnabledStations>('GET', 'v1', 'enabled');
        if (requestResults.code == KnotCode.SUCCESS)
        {
            requestResults.data.forEach((r: any) =>
            {
                r.activation_date = new Date(r.activation_date);
                return r;
            });
        }
        return requestResults;
    }

    /**
     * Get the list of disabled stations.
     * @documentation https://doc.knotcity.io/services/station/request/swagger.html#/paths/~1v1~1disabled/get
     */
    getDisabledStations(): Promise<DisabledStations>
    {
        return this.makeStationRequest<DisabledStations>('GET', 'v1', 'disabled');
    }
    //#endregion Station commands

    //#region Vehicle commands
    /**
     * Unlock a vehicle. This will also unlock the spot on which the vehicle is (if it is on a spot).
     * @param {number} vehicleId - The identifier of the vehicle.
     * @param {number} unlockId - An identifier to track this unlock request. This will be sent back in the unlocked event.
     * @description https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}~1unlock/post
     */
    unlockVehicle(vehicleId: number, unlockId: number): Promise<RequestResults>
    {
        if (!Number.isInteger(unlockId) || unlockId < 1)
        {
            throw new SVaaSError('Unlock ID should be an integer greater or equal to 1');
        }
        return this.makeVehicleRequest<RequestResults>('POST', 'v1', 'unlock', vehicleId, {
            unlock: unlockId
        });
    }

    /**
     * Lock a vehicle in freefloating.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @param {number} lockId - An identifier to track this lock request. This will be sent back in the locked event. Warning, 0 is used for automatic locks when a vehicle enter a station so it can be difficult to differentiate them from your requests if you use it.
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}~1lock/post
     */
    lockVehicle(vehicleId: number, lockId: number): Promise<RequestResults>
    {
        if (!Number.isInteger(lockId) || lockId < 0)
        {
            throw new SVaaSError('Lock ID should be an integer greater or equal to 0');
        }
        return this.makeVehicleRequest<RequestResults>('POST', 'v1', 'lock', vehicleId, {
            lock: lockId
        });
    }

    /**
     * Request a vehicle to play a sound.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @param {VehicleSoundType} soundType - The name of the sound to play.
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}~1sound/post
     */
    emitVehicleSound(vehicleId: number, soundType: VehicleSoundType): Promise<RequestResults>
    {
        if (soundType != VehicleSoundType.GEO_FENCE && soundType != VehicleSoundType.TOOT && soundType != VehicleSoundType.LOW_BATTERY)
        {
            throw new SVaaSError('Sound type should be an string equal to \'geo-fence\', \'toot\' or \'low_battery\'');
        }
        return this.makeVehicleRequest<RequestResults>('POST', 'v1', 'sound', vehicleId, {
            sound_type: soundType
        });
    }

    /**
     * Send request to open the battery cover of the vehicle.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}~1battery-cover/post
     */
    openVehicleBatteryCover(vehicleId: number): Promise<RequestResults>
    {
        return this.makeVehicleRequest<RequestResults>('POST', 'v1', 'battery-cover', vehicleId);
    }

    /**
     * Enable a vehicle.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}~1enable/post
     */
    enableVehicle(vehicleId: number): Promise<RequestResults>
    {
        return this.makeVehicleRequest<RequestResults>('POST', 'v1', 'enable', vehicleId, {});
    }

    /**
     * Request a vehicle to shutdown (ex: for the transport). WARNING: you need a physical action to restart the scooter.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}~1shutdown/post
     */
    shutdownVehicle(vehicleId: number): Promise<RequestResults>
    {
        return this.makeVehicleRequest<RequestResults>('POST', 'v1', 'shutdown', vehicleId);
    }

    /**
     * Update a vehicle configuration.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @param {VehicleConfig} config - Element to be configured on the vehicle
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}~1config/post
     */
    configureVehicle(vehicleId: number, config: VehicleConfig): Promise<RequestResults>
    {
        if (config.lowSpeedLimit !== undefined && (!Number.isInteger(config.lowSpeedLimit) || config.lowSpeedLimit < 6 || config.lowSpeedLimit > 25))
        {
            throw new SVaaSError('Low speed limit should be an integer between 6 and 25 or undefined');
        }
        if (config.mediumSpeedLimit !== undefined && (!Number.isInteger(config.mediumSpeedLimit) || config.mediumSpeedLimit < 6 || config.mediumSpeedLimit > 25))
        {
            throw new SVaaSError('Medium speed limit should be an integer between 6 and 25 or undefined');
        }
        if (config.highSpeedLimit !== undefined && (!Number.isInteger(config.highSpeedLimit) || config.highSpeedLimit < 6 || config.highSpeedLimit > 25))
        {
            throw new SVaaSError('High speed limit should be an integer between 6 and 25 or undefined');
        }
        if (config.cruiseControl !== undefined && typeof config.cruiseControl !== 'boolean')
        {
            throw new SVaaSError('Cruise control should be a boolean or undefined');
        }
        if (config.buttonSwitchSpeedMode !== undefined && typeof config.buttonSwitchSpeedMode !== 'boolean')
        {
            throw new SVaaSError('Button switch speed mode should be a boolean or undefined');
        }
        return this.makeVehicleRequest<RequestResults>('POST', 'v1', 'config', vehicleId, config);
    }

    /**
     * Request a vehicle to change the light state.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @param {VehicleLightState} lightState - New vehicle light state
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}~1config/post
     */
    changeVehicleLightState(vehicleId: number, lightState: VehicleLightState ): Promise<RequestResults>
    {
        if (lightState != VehicleLightState.OFF && lightState != VehicleLightState.ON && lightState != VehicleLightState.FLICKER)
        {
            throw new SVaaSError('Light state should be an string equal to \'off\', \'on\' or \'flicker\'');
        }
        return this.makeVehicleRequest<RequestResults>('POST', 'v1', 'light', vehicleId, {
            state: lightState
        });
    }

    /**
     * Get a vehicle's information.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1{vehicleId}/get
     */
    async getVehicleInformation(vehicleId: number): Promise<VehicleInformation>
    {
        const requestResults = await this.makeVehicleRequest<VehicleInformation>('GET', 'v1', '', vehicleId);
        if ( requestResults.code == KnotCode.SUCCESS && requestResults.data.activation_date)
        {
            requestResults.data.activation_date = new Date(requestResults.data.activation_date);
        }
        return requestResults;
    }

    /**
     * Get the list of enabled vehicles.
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1enabled/get
     */
    async getEnabledVehicles(): Promise<EnabledVehicles>
    {
        const requestResults = await this.makeVehicleRequest<EnabledVehicles>('GET', 'v1', 'enabled');
        if (requestResults.code == KnotCode.SUCCESS)
        {
            requestResults.data.forEach((r: any) =>
            {
                r.activation_date = new Date(r.activation_date);
                return r;
            });
        }
        return requestResults;
    }

    /**
     * Get the list of disabled vehicles.
     * @documentation https://doc.knotcity.io/services/vehicle/request/swagger.html#/paths/~1v1~1disabled/get
     */
    getDisabledVehicles(): Promise<DisabledVehicles>
    {
        return this.makeVehicleRequest<DisabledVehicles>('GET', 'v1', 'disabled');
    }
    //#endregion Vehicle commands

    // Signature validation
    /**
     * Check a request's signature comming from Knot SVaaS.
     * @param {SignatureEvent} event - Information needed to check the signature.
     * @documentation https://doc.knotcity.io/services/http-signature/
     */
    checkKnotEventSignature(event: SignatureEvent)
    {
        try
        {
            const headers = Object.entries(event.headers);
            const authHeader = headers.find(e => e[0].toLocaleLowerCase() == 'authorization');
            if (!authHeader || typeof authHeader[1] !== 'string')
            {
                return false;
            }

            const authComponents = parseAuthorizationHeader(authHeader[1]);
            if (!authComponents.headers.includes('x-knot-date') || !authComponents.headers.includes('(request-target)'))
            {
                return false;
            }

            const compts: AuthorizationHeaderComponents = authComponents.algorithm && authComponents.hash ?
                (authComponents as AuthorizationHeaderComponents) :
                Object.assign(authComponents, { hash: 'sha256', algorithm: 'ecdsa' });

            return verifyAuthorization(compts, {
                headers: event.headers,
                method: event.httpMethod,
                path: event.path
            }, this.#options.knotPublicKey);
        }
        catch (e)
        {
            return false;
        }
    }

    /**
     * Make a request on the station API.
     * @param {axios.Method} method - HTTP method used for make the request.
     * @param {string} version - Version of the service to call.
     * @param {string} action - Action to call.
     * @param {number} [id] - The identifier of the station if necessary.
     * @param {*} [data] - Other data.
     * @private
     */
    private makeStationRequest<T>(method: axios.Method, version: string, action: string, id?: number, data?: any)
    {
        let path: string;
        if (id)
        {
            if (!Number.isInteger(id) || id < 1)
            {
                throw new SVaaSError('Station ID should be an integer greater or equal to 1');
            }
            path = `/${version}/${id}/${action}`;
        }
        else
        {
            path = `/${version}/${action}`;
        }

        return this.makeRequest<T>(method, `${this.#options.stationsEndpoint || 'https://staas.knotcity.io'}${path}`, data);
    }

    /**
     * Make a request on the vehicle API.
     * @param {axios.Method} method - HTTP method used for make the request.
     * @param {string} version - Version of the service to call.
     * @param {string} action - Action to call.
     * @param {number} [id] - The identifier of the vehicle if necessary.
     * @param {*} [data] - Other data.
     * @private
     */
    private makeVehicleRequest<T>(method: axios.Method, version: string, action: string, id?: number, data?: any)
    {
        let path: string;
        if (id)
        {
            if (!Number.isInteger(id) || id < 1)
            {
                throw new SVaaSError('Vehicle ID should be an integer greater or equal to 1');
            }
            path = `/${version}/${id}/${action}`;
        }
        else
        {
            path = `/${version}/${action}`;
        }
        return this.makeRequest<T>(method, `${this.#options.vehiclesEndpoint || 'https://vaas.knotcity.io'}${path}`, data);
    }

    /**
     * Make a request to a SVaaS API.
     * @param {axios.Method} method - HTTP method used for make the request.
     * @param {string} url - SVaaS url to call.
     * @param {*} [data] - Other data.
     * @private
     */
    private async makeRequest<T>(method: axios.Method, url: string, data?: any)
    {
        const results = await this.#ax(Object.assign(this.#options.axiosRequestConfig, {
            method,
            data,
            url
        }));

        if (results.data.code === undefined)
        {
            throw new SVaaSError(`Request return an error: ${JSON.stringify(results.data)}`);
        }
        return results.data as T;
    }
}
