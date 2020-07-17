import http from 'axios';
import { Frequency } from './chart.service';
import { IndicatorApi, IndicatorApiType } from '../indicators/indicator';
import { EntityLevel } from './entities.service';

export interface StatsResponse {
    id: string;
    platform_id: string;
    date: string;
    structure_id?: string;
    class_id?: string;
    profile: string;
}

export interface StatsAccountsResponse extends StatsResponse {
    loaded: number;
    activated: number;
    authentications: number;
    unique_visitors: number;
    activations: number;
    sessions: number;
};

export interface StatsAccessResponse extends StatsResponse {
    type: string;
    module: string;
    access: number;
    unique_access_minute: number;
    unique_access: number;
}

export class StatsApiService {
    
    /**
     * API Call for Accounts stats with query string
     * @param from from date
     * @param frequency day or week or month
     * @param entitylevel structure or class
     * @param entities ids of structure or class
     */
    async getStats(api: IndicatorApi, from: string, frequency: Frequency, entitylevel: EntityLevel, entities?: Array<string>): Promise<Array<StatsResponse>> {
        let queryString = `?indicator=${api}&from=${from}&frequency=${frequency}&entityLevel=${entitylevel}`
            
        let entitiesString = '';
        if (entities) {
            entities.forEach(entity => {
                entitiesString = `${entitiesString}&entity=${entity}`;
            });
        }
        queryString = queryString + entitiesString;
        let res = await http.get(`/stats/list${queryString}`);
        return res.data as Array<StatsResponse>;
    }
    
    /**
     * Returns Object with key associated to attribute name values from a data array returned by getStats API.
     * 
     * @param data data array returned by getStats API
     * @param key the key to group by
     * @param attributeName the data attribute name containing values
     * 
     * Example:
     * 
     * array = [{
     *  activations: 12
     *  authentications: 20
     *  profile: "Personnel"
     * },
     * {
     *  activations: 12
     *  authentications: 30
     *  profile: "Personnel"
     * },
     * {
     *  activations: 12
     *  authentications: 40
     *  profile: "Student"
     * },
     * {
     *  activations: 12
     *  authentications: 50
     *  profile: "Student"
     * }]
     * 
     * groupByKey($array, 'profile', 'authentications')
     * 
     * will group 'authentications' values by 'profile' like this:
     * 
     * {
     *  Personnel: [20, 30], 
     *  Student: [40, 50], 
     *  ...
     * }
     * 
     */
    public groupByKey(data: Array<StatsResponse>, key: string, attributeName: IndicatorApiType) {
        return data.reduce((acc, x) => {
            (acc[x[key]] = acc[x[key]] || []).push(x[attributeName]);
            return acc;
        }, {});
    }
    
    public groupByKeys(data: Array<StatsResponse>, key1: string, key2: string, attributeName: IndicatorApiType) {
        return data.reduce((acc, x) => {
            if (!acc[x[key1]]) {
                acc[x[key1]] = {};
            }
            (acc[x[key1]][x[key2]] = acc[x[key1]][x[key2]] || []).push(x[attributeName]);
            return acc;
        }, {});
    }
    
    public groupByProfileWithDate(data, attributeName: IndicatorApiType) {
        return data.reduce((acc, x) => {
            (acc[x['profile']] = acc[x['profile']] || []).push({date: new Date(x.date), value: x[attributeName]});
            return acc;
        }, {});
    }
};

export const statsApiService = new StatsApiService();