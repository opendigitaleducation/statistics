import { ng, template, ui, _, $, idiom as lang } from 'entcore';

import { Indicator, IndicatorApi } from './indicators/indicator';
import { chartService } from './services/chart.service';
import { dateService } from './services/date.service';
import { Entity } from './services/entities.service';
import { entitiesService } from './services/entities.service';
import { cacheService } from './services/cache.service';
import { indicatorService } from './services/indicator.service';
import { connectionsIndicator, uniqueVisitorsIndicator, connectionsUniqueVisitorsIndicator, activationIndicator } from './indicators/line.indicators';
import { mostUsedToolIndicator } from './indicators/bar.indicators';
import { connectionsDailyPeakIndicator, connectionsWeeklyPeakIndicator } from './indicators/stackedbar.indicators';

declare const Chart: any;

interface StatsControllerScope {
	$root: any;
	entities: Array<Entity>;
	scopeEntity: {current: Entity};
	currentIndicator: Indicator;
	indicators: Array<Indicator>;
	chart: typeof Chart;
	ctx: any;
	template: typeof template;
	lang: typeof lang;
	allowed: Array<any>;
	definitions: Array<string>;
	getExportUrl(indicator: IndicatorApi): string;
	
	openIndicator(indicator: Indicator): void;
	indicatorDetail(indicator: Indicator): void;
	allowedProjectFunctions(): boolean; 
	openView(container: any, view: any);
	$apply: any;
	getAggregatedValue(indicator: Indicator, entity: Entity): number | string;
	updateEntityCacheData(): Promise<void>;
	updateEntityCacheDataAndOpenIndicator(indicator: Indicator): void;
}

/**
	Wrapper controller
	------------------
	Main controller.
**/
export const statsController = ng.controller('StatsController', ['$scope', '$timeout', 'model',
	async ($scope: StatsControllerScope, $timeout, model) => {

	/////////////////////////////////////////////
	/*               INIT & VIEWS              */
	$scope.template = template;
	$scope.lang = lang;
	
	$scope.definitions = [
		'uniqueVisitor',
		'connectionsByUniqueVisitor',
		'contents'
	]
	
	template.open('main', 'global');
	template.open('list', 'icons-list');
	
	// get user structures and classes
	let structures: Array<Entity> = await entitiesService.getStructures(false);
	structures.map(s => s.level = 'structure');
	let classes: Array<Entity> = await entitiesService.getClasses();
	classes.map(c => c.level = 'class');
	
	// entities array of structures and classes
	$scope.entities = [...structures, ...classes];
	
	// current inside a scopeEntity for select ng-change to work properly
	$scope.scopeEntity = {
		current: $scope.entities[0]
	};
	
	const safeScopeApply = (fn?: any) => {
		try {
			const phase = $scope.$root && $scope.$root.$$phase;
			if (phase == '$apply' || phase == '$digest') {
				if (fn && (typeof (fn) === 'function')) {
					fn();
				}
			} else {
				$scope.$apply(fn);
			}
		} catch (e) { }
	};
	
	/**** LIST OF INDICATORS ****/
	$scope.indicators = [
		connectionsIndicator,
		uniqueVisitorsIndicator,
		connectionsUniqueVisitorsIndicator,
		mostUsedToolIndicator,
		connectionsDailyPeakIndicator,
		connectionsWeeklyPeakIndicator,
		activationIndicator
	];
	
	/**** INIT Data ****/
	let initData = async () => {
		await cacheService.initEntityMonthCacheData($scope.indicators, $scope.scopeEntity.current);
		await indicatorService.initConnectionsWeeklyPeakTotalValue($scope.scopeEntity.current);
		await indicatorService.initConnectionsDailyPeakTotalValue($scope.scopeEntity.current);
		indicatorService.initMostUsedToolTotalValue($scope.scopeEntity.current);
		indicatorService.initConnectionsUniqueVisitorsTotalValue($scope.scopeEntity.current);
		safeScopeApply();
	}
	
	initData();

	/**** Export API route and query params ****/
	$scope.getExportUrl = (indicator: IndicatorApi) => {
		return encodeURI(`/stats/export?indicator=${indicator}&from=${dateService.getSinceDateISOStringWithoutMs()}&frequency=month&entityLevel=${$scope.scopeEntity.current.level}&entity=${$scope.scopeEntity.current.id}`);
	};
	
	/**** Update Data when switching Entity ****/
	$scope.updateEntityCacheData = async (): Promise<void> => {
		if (!$scope.scopeEntity.current.cacheData 
			|| cacheService.needsRefresh($scope.scopeEntity.current.cacheData.lastUpdate)) {
			await initData();
		}
	}
	
	$scope.updateEntityCacheDataAndOpenIndicator = async (indicator: Indicator) => {
		await $scope.updateEntityCacheData(); 
		$scope.openIndicator(indicator);
	}
	
	$scope.getAggregatedValue = function(indicator: Indicator, entity: Entity) {
		if (entity.cacheData) {
			let entityCacheDataIndicator = entity.cacheData.indicators.find(i => i.name === indicator.name);
			if (entityCacheDataIndicator) {
				return entityCacheDataIndicator.totalValue as number | string;
			}
		}
		return 0;
	}

	$scope.openIndicator = async function(indicator){
		if(!indicator)
			return
		$scope.currentIndicator = indicator;
		let chartContext = $('#chart').get(0).getContext('2d');
		if($scope.ctx && $scope.ctx !== chartContext){
			$scope.ctx = chartContext;
		} else {
			$scope.ctx = $scope.ctx && $scope.ctx === chartContext ? $scope.ctx : chartContext;
		}
		
		if ($scope.chart) {
			$scope.chart.destroy();
		}
		
		switch(indicator.chartType){
			case 'line':
				if (indicator.name === 'stats.connectionsByUniqueVisitors') {
					$scope.chart = await chartService.getConnectionsUniqueVisitorsLineChart($scope.ctx, indicator, $scope.scopeEntity.current);
				} else {
					$scope.chart = await chartService.getLineChart($scope.ctx, indicator, $scope.scopeEntity.current);
				}
				break;
			case 'stackedbar':
				$scope.chart = await chartService.getStackedBarChart($scope.ctx, indicator, $scope.scopeEntity.current);
				break;
			case 'bar':
				$scope.chart = await chartService.getBarChart($scope.ctx, indicator, $scope.scopeEntity.current);
				break;
		}
	}

	$scope.indicatorDetail = function(indicator){
		$scope.openView('list', 'table-list')

		var timeoutFunction = function(count){
			if(count < 10 && $('#chart').length <= 0){
				$timeout(function(){ timeoutFunction(count+1) }, 50*count)
			} else {
				$scope.openIndicator(indicator)
			}
		}

		$timeout(function(){
			timeoutFunction(1)
		}, 50)

	}
	
	// for export feature
	$scope.allowedProjectFunctions = function(){
		return !$scope.allowed ||
			!($scope.allowed instanceof Array) ? true :
			$scope.allowed.length === 0 ? true :
			_.find(model.me.functions, function(f){ return _.contains($scope.allowed, f.code) })
	}

	$scope.openView = function(container, view){
		if(container === 'lightbox') {
			ui.showLightbox();
		} else {
			ui.hideLightbox();
		}
		$scope.currentIndicator = null;
		template.open(container, view);
	}
}]);
