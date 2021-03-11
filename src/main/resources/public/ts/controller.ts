import { ng, template, ui, _, $, idiom as lang, currentLanguage } from 'entcore';

import { Indicator, IndicatorApi } from './indicators/indicator';
import { chartService } from './services/chart.service';
import { dateService } from './services/date.service';
import { Entity, StructuresResponse } from './services/entities.service';
import { entitiesService } from './services/entities.service';
import { cacheService } from './services/cache.service';
import { indicatorService } from './services/indicator.service';
import { connectionsIndicator, uniqueVisitorsIndicator, connectionsUniqueVisitorsIndicator, activationIndicator } from './indicators/line.indicators';
import { mostUsedAppsIndicator, mostUsedConnectorIndicator } from './indicators/bar.indicators';
import { connectionsDailyPeakIndicator, connectionsWeeklyPeakIndicator } from './indicators/stackedbar.indicators';
import { userService } from './services/user.service';

declare const Chart: any;

interface StatsControllerScope {
	$root: any;
	display: {loading: boolean}
	structuresTree: Array<StructuresResponse>;
	entities: Array<Entity>;
	scopeEntity: {current: Entity};
	currentIndicator: Indicator;
	indicators: Array<Indicator>;
	chart: typeof Chart;
	ctx: any;
	template: typeof template;
	lang: typeof lang;
	definitions: Array<string>;
	
	getExportUrl(indicator: IndicatorApi): string;
	openIndicator(indicator: Indicator): void;
	indicatorDetail(indicator: Indicator): void;
	openView(container: any, view: any);
	$apply: any;
	getAggregatedValue(indicator: Indicator, entity: Entity): number | string;
	selectEntity(id: string): Promise<void>;
	selectEntityAndOpenIndicator(id: string, indicator: Indicator): Promise<void>;
	isDataExportable(): boolean;
	closeStructureTree(): void;
	getSinceDateLabel(indicator: Indicator, entity: Entity): string;
	showProfileFilter(): boolean;
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
	
	// home definitions
	$scope.definitions = [
		'uniqueVisitor',
		'connectionsByUniqueVisitor',
		'contents'
	]
	
	template.open('main', 'global');
	template.open('list', 'icons-list');
	
	$scope.display = {
		loading: true
	}
	
	// get user structures and classes
	let structures: Array<StructuresResponse> = await entitiesService.getStructures();
	$scope.structuresTree = entitiesService.asTree(structures);
	$scope.entities = [];
	structures.forEach(s => {
		$scope.entities.push({
			id: s.id,
			name: s.name,
			level: 'structure'
		});
		if (s.classes && s.classes.length > 0) {
			s.classes.forEach(c => {
				$scope.entities.push({
					id: c.id,
					name: c.name,
					level: 'class'
				});
			});
		}
	});
	
	// current entity inside a scopeEntity for select ng-change to work properly
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
	
	// get user connectors
	const connectors = await userService.getConnectors();
	console.log(connectors);
	
	/**** LIST OF INDICATORS ****/	
	$scope.indicators = [
		connectionsIndicator,
		uniqueVisitorsIndicator,
		connectionsUniqueVisitorsIndicator,
		mostUsedAppsIndicator
	];
	if (connectors && connectors.length > 0) {
		$scope.indicators.push(mostUsedConnectorIndicator);
	}
	$scope.indicators = [
		...$scope.indicators,
		connectionsDailyPeakIndicator,
		connectionsWeeklyPeakIndicator,
		activationIndicator
	];
	
	/**** INIT Data ****/
	let initData = async () => {
		$scope.display.loading = true;
		
		// init accounts and access data per month for current entity (also init total values for connections and activations)
		await cacheService.initEntityMonthCacheData($scope.indicators, $scope.scopeEntity.current);
		
		// init total values for graphs that need specific calculation
		await indicatorService.initConnectionsWeeklyPeakTotalValue($scope.scopeEntity.current);
		await indicatorService.initConnectionsDailyPeakTotalValue($scope.scopeEntity.current);
		indicatorService.initMostAccessedAppTotalValue($scope.scopeEntity.current);
		indicatorService.initMostAccessedConnectorTotalValue($scope.scopeEntity.current);
		indicatorService.initUniqueVisitorsTotalValue($scope.scopeEntity.current);
		indicatorService.initConnectionsUniqueVisitorsTotalValue($scope.scopeEntity.current);
		
		// spinner
		setTimeout(() => {
			$scope.display.loading = false;
			safeScopeApply();
		}, 500);
		
		safeScopeApply();
	}
	
	initData();
	
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
				} else if (indicator.name === 'stats.activatedAccounts') {
					$scope.chart = await chartService.getActivationsAndLoadedLineChart($scope.ctx, indicator, $scope.scopeEntity.current);
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

	$scope.openView = function(container, view){
		if(container === 'lightbox') {
			ui.showLightbox();
		} else {
			ui.hideLightbox();
		}
		$scope.currentIndicator = null;
		template.open(container, view);
	}
	
	/**** Update Data when switching Entity ****/
	$scope.selectEntity = async function(id: string): Promise<void> {
		$scope.scopeEntity.current = $scope.entities.find(e => e.id === id);
		if (!$scope.scopeEntity.current.cacheData 
			|| cacheService.needsRefresh($scope.scopeEntity.current.cacheData.lastUpdate)) {
			await initData();
		}
	}
	
	$scope.selectEntityAndOpenIndicator = async function(id: string, indicator: Indicator): Promise<void> {
		await $scope.selectEntity(id); 
		$scope.openIndicator(indicator);
	}
	
	$scope.isDataExportable = function(): boolean {
		if (!$scope.currentIndicator) {
			return false;
		}
		return $scope.currentIndicator.name === 'stats.connections' || 
			   $scope.currentIndicator.name === 'stats.uniqueVisitors' || 
			   $scope.currentIndicator.name === 'stats.connectionsByUniqueVisitors' || 
			   $scope.currentIndicator.name === 'stats.activatedAccounts' || 
			   $scope.currentIndicator.name === 'stats.mostUsedApp' || 
			   $scope.currentIndicator.name === 'stats.mostUsedConnector';
	}
	
	// get export API call
	$scope.getExportUrl = () => encodeURI(`/stats/export?indicator=${$scope.currentIndicator.api}&from=${dateService.getSinceDateISOStringWithoutMs()}&frequency=day&entityLevel=${$scope.scopeEntity.current.level}&entity=${$scope.scopeEntity.current.id}&accumulate=true`);
	
	$scope.showProfileFilter = (): boolean => {
		if (!$scope.currentIndicator) {
			return false;
		}
		return $scope.currentIndicator.name === 'stats.mostUsedApp' || 
			   $scope.currentIndicator.name === 'stats.mostUsedConnector' ||
			   $scope.currentIndicator.name === 'stats.activatedAccounts';
	}
	
	// moved from dateService to controller cause of currentLanguage not ready in dateService when initializing indicators...
	$scope.getSinceDateLabel = function(indicator: Indicator, entity: Entity): string {
		if (!indicator.since && entity.cacheData && entity.cacheData.indicators) {
			const indicatorCache = entity.cacheData.indicators.find(i => i.name === indicator.name);
			
			if (indicatorCache.data && indicatorCache.data.length > 0) {
				let minDate = indicatorCache.data.reduce((a, b) => a.date < b.date ? a : b);
				return new Date(minDate.date).toLocaleString([currentLanguage], {month: "long", year: "numeric"});
			} else {
				return dateService.getSinceDate().toLocaleString([currentLanguage], {month: "long", year: "numeric"});
			}
		}
		return indicator.since;
	}
}]);
