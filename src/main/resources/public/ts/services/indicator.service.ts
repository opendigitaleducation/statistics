import { idiom as lang } from "entcore";
import { Entity } from "./entities.service";
import { StatsAccountsResponse, statsApiService, StatsResponse } from "./stats-api.service";
import { ChartDataGroupedByProfile } from "./chart.service";
import { dateService } from "./date.service";
import { IndicatorName } from "../indicators/indicator";

export class IndicatorService {
	
	public initUniqueVisitorsTotalValue(entity: Entity) {
		let uniqueVisitorsTotalValue = 0;
		const uniqueVisitorsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.uniqueVisitors');
		
		uniqueVisitorsCacheIndicator.data.forEach((d: StatsAccountsResponse) => {
			if (dateService.isSameMonth(new Date(), new Date(d.date))) {
				uniqueVisitorsTotalValue += d.unique_visitors;
			}
		});
		
		uniqueVisitorsCacheIndicator.totalValue = uniqueVisitorsTotalValue;
	}
	
    public initConnectionsUniqueVisitorsTotalValue(entity: Entity) {
		let currentDate = new Date();
		
		let authenticationsTotalValue = 0;
		const authenticationsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.connections');
		authenticationsCacheIndicator.data.forEach((d: StatsAccountsResponse) => {
			if (dateService.isSameMonth(currentDate, new Date(d.date))) {
				authenticationsTotalValue += d.authentications;
			}
		});
		
		let uniqueVisitorsTotalValue = 0;
		const uniqueVisitorsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.uniqueVisitors');
		uniqueVisitorsCacheIndicator.data.forEach((d: StatsAccountsResponse) => {
			if (dateService.isSameMonth(currentDate, new Date(d.date))) {
				uniqueVisitorsTotalValue += d.unique_visitors;
			}
		});
		
		if (uniqueVisitorsTotalValue > 0) {
			const connectionsDividedUniqueVisitorsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.connectionsByUniqueVisitors');
			connectionsDividedUniqueVisitorsCacheIndicator.totalValue = Math.round(authenticationsTotalValue / uniqueVisitorsTotalValue);
		}
    }
	
	public initMostAccessedAppTotalValue(entity: Entity) {
		return this.initMostAccessedTotalValue(entity, 'stats.mostUsedApp');
	}
	
	public initMostAccessedConnectorTotalValue(entity: Entity) {
		return this.initMostAccessedTotalValue(entity, 'stats.mostUsedConnector');
	}
	
	private initMostAccessedTotalValue(entity: Entity, indicatorName: IndicatorName) {
		const cachedIndicator = entity.cacheData.indicators.find(indicator => indicator.name === indicatorName);
		const dataGroupedByModuleAndProfile = statsApiService.groupByKeys(cachedIndicator.data, 'module', 'profile', 'access');
		
		let sumArray: Array<{module: string, total: number}> = [];
		Object.keys(dataGroupedByModuleAndProfile).forEach(module => {
			let sum = 0;
			Object.keys(dataGroupedByModuleAndProfile[module]).forEach(profile => {
				sum += dataGroupedByModuleAndProfile[module][profile].reduce((acc, x) => acc + x);
			});
			sumArray.push({module: module, total: sum});
		});
		
		let max = 0;
		sumArray.forEach(x => {
			if (x.total > max) {
				max = x.total;
			}
		});
		
		let moduleTotal = sumArray.find(x => x.total === max);
		let app = '';
		if (moduleTotal) {
			app = lang.translate(moduleTotal.module.toLowerCase());
		}
		// save value to Entity cache data
		cachedIndicator.totalValue = app;
	}
    
    public async initConnectionsWeeklyPeakTotalValue(entity: Entity) {
		let chartData: ChartDataGroupedByProfile = {};
		const connectionsWeeklyPeakIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.weeklyPeak');
		let accountsData: Array<StatsResponse> = await statsApiService.getStats(
			'accounts',
			dateService.getSinceDateISOStringWithoutMs(),
			'day',
			entity.level,
			[entity.id]
		);
		
		if (accountsData && accountsData.length === 0) {
			connectionsWeeklyPeakIndicator.totalValue = '-';
			return;
		}
		
		const dataGroupedByProfileAndDay = accountsData.reduce((acc, x) => {
            if (!acc[x['profile']]) {
                acc[x['profile']] = {};
            }
            (acc[x['profile']][new Date(x.date).getDay()] = acc[x['profile']][new Date(x.date).getDay()] || []).push(x['authentications']);
            return acc;
		}, {});
		
		Object.keys(dataGroupedByProfileAndDay).forEach(profile => {
            chartData[profile] = [];
            Object.keys(dataGroupedByProfileAndDay[profile]).forEach((day, i) => {
                let sum = dataGroupedByProfileAndDay[profile][day].reduce((acc, x) => acc + x);
                chartData[profile].push(sum);
            });
            // move Sunday value to the last array element
            let sundayValue = chartData[profile].shift();
            chartData[profile].push(sundayValue);
		});
		
		const sumAll = [];
		Object.keys(chartData).forEach(profile => {
			if (sumAll.length === 0) {
				sumAll.push(...chartData[profile]);
			} else {
				chartData[profile].forEach((sumDay, i) => sumAll[i] += sumDay);
			}
		});
		const indexOfMaxValue = sumAll.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
		var daysMatch = [
			'stats.monday',
			'stats.tuesday',
			'stats.wednesday',
			'stats.thursday',
			'stats.friday',
			'stats.saturday',
			'stats.sunday',
		];
		
		// save value to Entity cache data
		connectionsWeeklyPeakIndicator.totalValue = lang.translate(daysMatch[indexOfMaxValue]);
    }
    
    public async initConnectionsDailyPeakTotalValue(entity: Entity) {
		let chartData: ChartDataGroupedByProfile = {};
		const connectionsDailyPeakIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.dailyPeak');
		
		let accountsData: Array<StatsResponse> = await statsApiService.getStats(
			'accounts',
			dateService.getSinceDateISOStringWithoutMs(),
			'hour',
			entity.level,
			[entity.id]
		);
		
		if (accountsData && accountsData.length === 0) {
			connectionsDailyPeakIndicator.totalValue = '-';
			return;
		}
		
		const dataGroupedByProfileAndDay = accountsData.reduce((acc, x) => {
            if (!acc[x['profile']]) {
                acc[x['profile']] = {};
            }
            (acc[x['profile']][new Date(x.date).getHours()] = acc[x['profile']][new Date(x.date).getHours()] || []).push(x['authentications']);
            return acc;
		}, {});
		
		Object.keys(dataGroupedByProfileAndDay).forEach(profile => {
            chartData[profile] = [];
            Object.keys(dataGroupedByProfileAndDay[profile]).forEach((day, i) => {
                let sum = dataGroupedByProfileAndDay[profile][day].reduce((acc, x) => acc + x);
                chartData[profile].push(sum);
            });
		});
		
		const sumAll = [];
		Object.keys(chartData).forEach(profile => {
			if (sumAll.length === 0) {
				sumAll.push(...chartData[profile]);
			} else {
				chartData[profile].forEach((sumHours, i) => sumAll[i] += sumHours);
			}
		});
		const indexOfMaxValue = sumAll.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
		
		// save value to Entity cache data
		connectionsDailyPeakIndicator.totalValue = indexOfMaxValue + 'h';
	}
}

export const indicatorService = new IndicatorService();