import {
	addDays,
	differenceInCalendarDays,
	endOfDay,
	endOfMonth,
	format,
	startOfDay,
	startOfMonth,
	subMonths,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export type LaborViewRange = "pay_period" | "weekly" | "monthly";
export type PayPeriodLength = "weekly" | "bi-weekly" | "monthly";

export interface LaborDateRange {
	startIso: string;
	endIso: string;
	label: string;
}

export interface PayPeriodOption {
	offset: number;
	label: string;
}

const MAX_MONTHLY_PAY_PERIODS = 36;

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
	periodOffset = 0,
): LaborDateRange => {
	const anchorInstant = fromZonedTime(`${anchorDate}T00:00:00.000`, timeZone);
	const anchorStart = startOfDay(toZonedTime(anchorInstant, timeZone));
	const referenceStart = startOfDay(zonedReference);
	const daysSinceAnchor = differenceInCalendarDays(referenceStart, anchorStart);
	const periodIndex =
		Math.floor(daysSinceAnchor / periodDays) - periodOffset;
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

const getAnchorStart = (anchorDate: string, timeZone: string): Date => {
	const anchorInstant = fromZonedTime(`${anchorDate}T00:00:00.000`, timeZone);
	return startOfDay(toZonedTime(anchorInstant, timeZone));
};

const getMaxAnchoredPeriodOffset = (
	anchorDate: string,
	periodDays: number,
	timeZone: string,
	referenceUtc: Date,
): number => {
	const anchorStart = getAnchorStart(anchorDate, timeZone);
	const referenceStart = startOfDay(toZonedTime(referenceUtc, timeZone));
	const daysSinceAnchor = differenceInCalendarDays(referenceStart, anchorStart);
	return Math.max(0, Math.floor(daysSinceAnchor / periodDays));
};

export function getPayPeriodOptions(
	payPeriodLength: PayPeriodLength,
	anchorDate: string,
	timeZone: string,
	referenceUtc: Date = new Date(),
): PayPeriodOption[] {
	const anchorStart = getAnchorStart(anchorDate, timeZone);
	const anchorMonthStart = startOfMonth(anchorStart);
	const maxOffset =
		payPeriodLength === "monthly"
			? MAX_MONTHLY_PAY_PERIODS - 1
			: getMaxAnchoredPeriodOffset(
				anchorDate,
				payPeriodLength === "bi-weekly" ? 14 : 7,
				timeZone,
				referenceUtc,
			);

	const options: PayPeriodOption[] = [];
	for (let offset = 0; offset <= maxOffset; offset++) {
		const range = getLaborDateRange(
			"pay_period",
			payPeriodLength,
			anchorDate,
			timeZone,
			referenceUtc,
			offset,
		);

		if (payPeriodLength === "monthly") {
			const periodMonthStart = startOfMonth(
				toZonedTime(new Date(range.startIso), timeZone),
			);
			if (periodMonthStart < anchorMonthStart) {
				break;
			}
		} else {
			const periodStart = startOfDay(
				toZonedTime(new Date(range.startIso), timeZone),
			);
			if (periodStart < anchorStart) {
				break;
			}
		}

		options.push({
			offset,
			label: offset === 0 ? `Current (${range.label})` : range.label,
		});
	}
	return options;
}

export function getLaborDateRange(
	range: LaborViewRange,
	payPeriodLength: PayPeriodLength,
	anchorDate: string,
	timeZone: string,
	referenceUtc: Date = new Date(),
	periodOffset = 0,
): LaborDateRange {
	const zonedReference = toZonedTime(referenceUtc, timeZone);

	if (range === "monthly") {
		return getMonthlyRange(zonedReference, timeZone);
	}

	if (range === "weekly") {
		return getAnchoredPeriodRange(zonedReference, anchorDate, 7, timeZone);
	}

	if (payPeriodLength === "monthly") {
		const monthReference = subMonths(zonedReference, periodOffset);
		return getMonthlyRange(monthReference, timeZone);
	}

	const periodDays = payPeriodLength === "bi-weekly" ? 14 : 7;
	return getAnchoredPeriodRange(
		zonedReference,
		anchorDate,
		periodDays,
		timeZone,
		periodOffset,
	);
}
