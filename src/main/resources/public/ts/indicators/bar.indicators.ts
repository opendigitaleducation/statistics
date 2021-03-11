import { Indicator } from "./indicator";

export let mostUsedAppsIndicator: Indicator = {
    name: 'stats.mostUsedApp',
    chartType: 'bar',
    since: "",
    icon: 'stats-service-icon',
    api: 'access',
    apiType: 'access',
    chartTitle: 'stats.labels.mostUsedApps',
    chartProfile: 'total',
    chartProfiles: ['total', 'Teacher', 'Personnel', 'Relative', 'Student'],
    frequency: 'month'
};

export let mostUsedConnectorIndicator: Indicator = {
    name: 'stats.mostUsedConnector',
    chartType: 'bar',
    since: "",
    icon: 'stats-service-icon',
    api: 'access',
    apiType: 'access',
    chartTitle: 'stats.labels.mostUsedConnectors',
    chartProfile: 'total',
    chartProfiles: ['total', 'Teacher', 'Personnel', 'Relative', 'Student'],
    frequency: 'month'
}