import { idiom as lang, currentLanguage } from "entcore";
import { StatsResponse } from "./stats-api.service";

export class DateService {

	public getDatesFromData(data: Array<StatsResponse>): Array<Date> {
		let dateArray: Array<Date> = [];
		data.forEach(d => {
			const date = new Date(d.date);
			if (!dateArray.find(x => x.getTime() === date.getTime())) {
				dateArray.push(date);
			}
		});
		return dateArray;
	}
	
	public getMinDateFromData(data: Array<StatsResponse>): Date {
		return new Date(data.reduce((a, b) => new Date(a.date) < new Date(b.date) ? a : b).date);
	}
	
	public getMaxDateFromData(data: Array<StatsResponse>): Date {
		return new Date(data.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b).date);
	}
	
	public getDates(minDate: Date, maxDate: Date): Array<Date> {
		let datesArray: Array<Date> = [];
		let resDate = minDate;
		datesArray.push(new Date(resDate));
		
		while (resDate < maxDate) {
			resDate.setMonth(resDate.getMonth() + 1);
			datesArray.push(new Date(resDate));
		}
		return datesArray;
	}
	
	public getMonthLabelsFromData(data: Array<StatsResponse>): Array<string> {
		let dateLabelsArray: Array<string> = [];
		data.forEach(d => {
			const date = new Date(d.date);
			const dateToLocalString: string = date.toLocaleString([currentLanguage], { month: 'long', year: '2-digit' });
			if (!dateLabelsArray.find(chartLabel => chartLabel === dateToLocalString)) {
				dateLabelsArray.push(dateToLocalString);
			}
		});
		return dateLabelsArray;
	}
	
	public getMonthLabels(dates: Array<Date>): Array<string> {
		return dates.map(d => d.toLocaleString([currentLanguage], { month: 'long', year: '2-digit' }));
	}

	public getWeekLabelsFromData(data: Array<StatsResponse>) {	
		const labels: Array<string> = [];
		
		data.forEach(d => {
			const date = new Date(d.date);
			const firstDayOfTheWeek = date.getDate() - date.getDay();
			const weekLabel = lang.translate("stats.weekOf") 
				+ firstDayOfTheWeek 
				+ '/' 
				+ date.toLocaleString([currentLanguage], { month: '2-digit' })
			if (!labels.includes(weekLabel)) {
				labels.push(weekLabel);
			}
		});

		return labels;
	}

	public getDayLabelsFromData(data: Array<StatsResponse>) {
		const labels: Array<string> = [];
		
		data.forEach(d => {
			const date = new Date(d.date);
			const dateToLocalString: string = date.toLocaleString([currentLanguage], { day: '2-digit', month: '2-digit', year: 'numeric' });
			if (!labels.includes(dateToLocalString)) {
				labels.push(dateToLocalString);
			}
		});
		
		return labels;
	}
	
    public getSinceDate(): Date {
		const today = new Date();
        return new Date(today.getFullYear() - 1, today.getMonth(), 1, 0, 0, 0, 0);
    }
	
	public getSinceDateISOStringWithoutMs(): string {
		return this.getSinceDate().toISOString().split('.')[0];
	}
	
    public getSinceDateLabel(): string {
	    return this.getSinceDate().toLocaleString('default', {month: "long", year: "numeric"});
    }
	
	public moreThanOneHourAgo(date: Date): boolean {
		if (!date) {
			return true;
		}
		const HOUR = 1000 * 60 * 60;
		const anHourAgo = Date.now() - HOUR;
	
		return date.getTime() < anHourAgo;
	}
}

export const dateService = new DateService();