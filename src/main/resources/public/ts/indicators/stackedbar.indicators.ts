import { idiom as lang } from "entcore";
import { dateService } from "../services/date.service";
import { Indicator } from "./indicator";

export let connectionsDailyPeakIndicator: Indicator = {
    name: 'stats.dailyPeak',
    chartType: 'stackedbar',
    since: dateService.getSinceDateLabel(),
    api: 'accounts',
    apiType: 'authentications',
    icon: 'clock-icon',
    chartTitle: lang.translate('stats.labels.dailyPeak'),
    frequency: 'hour'
};

export let connectionsWeeklyPeakIndicator: Indicator = {
    name: 'stats.weeklyPeak',
    chartType: 'stackedbar',
    since: dateService.getSinceDateLabel(),
    icon: 'calendar-button',
    api: 'accounts',
    apiType: 'authentications',
    chartTitle: lang.translate('stats.labels.weeklyPeak'),
    frequency: 'day'
}