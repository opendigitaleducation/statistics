import { dateService } from "../services/date.service";
import { Indicator } from "./indicator";

export let mostUsedToolIndicator: Indicator = {
    name: 'stats.mostUsedTool',
    chartType: 'bar',
    since: dateService.getSinceDateLabel(),
    icon: 'stats-service-icon',
    api: 'access',
    apiType: 'access',
    chartTitle: 'stats.labels.mostUsedTool',
    chartProfile: 'total',
    chartProfiles: ['total', 'Teacher', 'Personnel', 'Relative', 'Student'],
    frequency: 'month'
};