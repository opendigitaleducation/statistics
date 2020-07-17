import { Frequency, ChartType } from "../services/chart.service";

export type IndicatorApi = 'accounts' | 'access';
export type IndicatorApiType = 
    'authentications' | 
    'activations' | 
    'access' | 
    'unique_visitors' | 
    // mixed type stands for indicator type which data can't be retrieved directly from API 
    // but is a calculation of 2 indicators data (for example: ConnectionsDividedByUniqueVisitors)
    'mixed';

export type Indicator = {
    name: string;
    api: IndicatorApi;
    apiType: IndicatorApiType;
    frequency: Frequency;
	since: string;
    icon: string;
    chartType: ChartType;
    chartTitle: string;
    chartFrequencies?: Array<Frequency>;
    chartProfile?: string;
    chartProfiles?: Array<string>;
};