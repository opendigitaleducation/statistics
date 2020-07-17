import { idiom as lang } from "entcore";
import { Entity } from "./entities.service";
import { statsApiService, StatsResponse } from "./stats-api.service";
import { ChartDataGroupedByProfile } from "./chart.service";
import { dateService } from "./date.service";

export class IndicatorService {
    
    public initConnectionsUniqueVisitorsTotalValue(entity: Entity) {
		let authenticationsTotalValue = 0;
		const authenticationsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.connections');
		if (authenticationsCacheIndicator) {
			authenticationsTotalValue = authenticationsCacheIndicator.totalValue as number;
		}
		let uniqueVisitorsTotalValue = 0;
		const uniqueVisitorsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.uniqueVisitors');
		if (uniqueVisitorsCacheIndicator) {
			uniqueVisitorsTotalValue = uniqueVisitorsCacheIndicator.totalValue as number;
		}
		
		if (uniqueVisitorsTotalValue > 0) {
			const connectionsDividedUniqueVisitorsTotalValue = Math.round((authenticationsTotalValue / uniqueVisitorsTotalValue) * 100) / 100;
			const connectionsDividedUniqueVisitorsCacheIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.connectionsByUniqueVisitors');
			connectionsDividedUniqueVisitorsCacheIndicator.totalValue = connectionsDividedUniqueVisitorsTotalValue;
		}
    }
    
    public initMostUsedToolTotalValue(entity: Entity) {
		const mostUsedToolIndicator = entity.cacheData.indicators.find(indicator => indicator.name === 'stats.mostUsedTool');
		
		const dataGroupedByModuleAndProfile = statsApiService.groupByKeys(mostUsedToolIndicator.data, 'module', 'profile', 'access');
		
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
		mostUsedToolIndicator.totalValue = app;
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