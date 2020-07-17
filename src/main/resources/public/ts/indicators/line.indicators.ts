import { dateService } from "../services/date.service";
import { Indicator } from "./indicator";

export let connectionsIndicator: Indicator = {
    name: 'stats.connections',
    chartType: 'line',
    since: dateService.getSinceDateLabel(),
    icon: 'connection-icon',
    api: 'accounts',
    apiType: 'authentications',
    chartTitle: 'stats.labels.connections',
    chartFrequencies: ['day', 'week', 'month'],
    frequency: 'month'
};

export let uniqueVisitorsIndicator: Indicator = {
    name: 'stats.uniqueVisitors',
    chartType: 'line',
    since: 'stats.firstDayOfMonth',
    icon: 'unique-visitors-icon',
    api: 'accounts',
    apiType: 'unique_visitors',
    chartTitle: 'stats.labels.uniqueVisitors',
    chartFrequencies: ['day', 'week', 'month'],
    frequency: 'month'
};

export let connectionsUniqueVisitorsIndicator: Indicator = {
    name: 'stats.connectionsByUniqueVisitors',
    chartType: 'line',
    since: 'stats.firstDayOfMonth',
    icon: 'connection-by-visitors-icon',
    api: 'accounts',
    apiType: 'mixed',
    chartTitle: 'stats.labels.connectionsByUniqueVisitors',
    chartFrequencies: ['day', 'week', 'month'],
    frequency: 'month'
};

export let activationIndicator: Indicator = {
    name: 'stats.activatedAccounts',
    chartType: 'line',
    since: dateService.getSinceDateLabel(),
    icon: 'people-icon',
    api: 'accounts',
    apiType: 'activations',
    chartTitle: "stats.labels.activatedAccounts",
    chartFrequencies: ['day', 'week', 'month'],
    frequency: 'month'
};