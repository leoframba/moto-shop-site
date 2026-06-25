import {
	addDays,
	differenceInCalendarDays,
	endOfDay,
	endOfMonth,
	format,
	startOfDay,
	startOfMonth,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export type LaborViewRange = "pay_period" | "weekly" | "monthly";
export type PayPeriodLength = "weekly" | "bi-weekly" | "monthly";

export interface LaborDateRange {
	startIso: string;
	endIso: string;
	label: string;
}

const toZonedStartIso = (dateStr: string, timeZone: string): string =>
	fromZonedTime(`${dateStr}T00:00:00.000`, timeZone).toISOString();

const toZonedEndIso = (dateStr: string, timeZone: string): string =>
	fromZonedTime(`${dateStr}T23:59:59.999`, timeZone).toISOString();

const formatRangeLabel = (start: Date, end: Date): string => {
	const sameYear = format(start, "yyyy") === format(end, "yyyy");
	if (sameYear) {
		return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
	}
	return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
};

const getMonthlyRange = (
	zonedReference: Date,
	timeZone: string,
): LaborDateRange => {
	const monthStart = startOfMonth(zonedReference);
	const monthEnd = endOfMonth(zonedReference);
	const startStr = format(monthStart, "yyyy-MM-dd");
	const endStr = format(monthEnd, "yyyy-MM-dd");
	return {
		startIso: toZonedStartIso(startStr, timeZone),
		endIso: toZonedEndIso(endStr, timeZone),
		label: formatRangeLabel(monthStart, monthEnd),
	};
};

const getAnchoredPeriodRange = (
	zonedReference: Date,
	anchorDate: string,
	periodDays: number,
	timeZone: string,
): LaborDateRange => {
	const anchorInstant = fromZonedTime(`${anchorDate}T00:00:00.000`, timeZone);
	const anchorStart = startOfDay(toZonedTime(anchorInstant, timeZone));
	const referenceStart = startOfDay(zonedReference);
	const daysSinceAnchor = differenceInCalendarDays(referenceStart, anchorStart);
	const periodIndex = Math.floor(daysSinceAnchor / periodDays);
	const periodStart = addDays(anchorStart, periodIndex * periodDays);
	const periodEnd = addDays(periodStart, periodDays - 1);
	const startStr = format(periodStart, "yyyy-MM-dd");
	const endStr = format(periodEnd, "yyyy-MM-dd");
	return {
		startIso: toZonedStartIso(startStr, timeZone),
		endIso: toZonedEndIso(endStr, timeZone),
		label: formatRangeLabel(periodStart, periodEnd),
	};
};

export function getLaborDateRange(
	range: LaborViewRange,
	payPeriodLength: PayPeriodLength,
	anchorDate: string,
	timeZone: string,
	referenceUtc: Date = new Date(),
): LaborDateRange {
	const zonedReference = toZonedTime(referenceUtc, timeZone);

	if (range === "monthly") {
		return getMonthlyRange(zonedReference, timeZone);
	}

	if (range === "weekly") {
		return getAnchoredPeriodRange(zonedReference, anchorDate, 7, timeZone);
	}

	if (payPeriodLength === "monthly") {
		return getMonthlyRange(zonedReference, timeZone);
	}

	const periodDays = payPeriodLength === "bi-weekly" ? 14 : 7;
	return getAnchoredPeriodRange(
		zonedReference,
		anchorDate,
		periodDays,
		timeZone,
	);
}
