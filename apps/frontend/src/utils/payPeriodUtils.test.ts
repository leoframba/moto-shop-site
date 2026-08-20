import { describe, expect, it } from "vitest";
import {
	getLaborDateRange,
	getPayPeriodOptions,
} from "@/utils/payPeriodUtils";

describe("getLaborDateRange", () => {
	const timeZone = "America/Los_Angeles";
	const anchorDate = "2026-06-17";
	const referenceDate = new Date("2026-06-20T12:00:00.000Z");

	it("returns bi-weekly pay period containing the reference date", () => {
		const range = getLaborDateRange(
			"pay_period",
			"bi-weekly",
			anchorDate,
			timeZone,
			referenceDate,
		);

		expect(range.startIso).toBe("2026-06-17T07:00:00.000Z");
		expect(range.endIso).toBe("2026-07-01T06:59:59.999Z");
	});

	it("returns the previous bi-weekly pay period when offset is 1", () => {
		const range = getLaborDateRange(
			"pay_period",
			"bi-weekly",
			anchorDate,
			timeZone,
			new Date("2026-07-15T12:00:00.000Z"),
			1,
		);

		expect(range.startIso).toBe("2026-07-01T07:00:00.000Z");
		expect(range.endIso).toBe("2026-07-15T06:59:59.999Z");
	});

	it("returns weekly view aligned to the anchor weekday", () => {
		const range = getLaborDateRange(
			"weekly",
			"bi-weekly",
			anchorDate,
			timeZone,
			new Date("2026-06-25T12:00:00.000Z"),
		);

		expect(range.startIso).toBe("2026-06-24T07:00:00.000Z");
		expect(range.endIso).toBe("2026-07-01T06:59:59.999Z");
	});

	it("returns calendar month for monthly view", () => {
		const range = getLaborDateRange(
			"monthly",
			"bi-weekly",
			anchorDate,
			timeZone,
			new Date("2026-06-15T12:00:00.000Z"),
		);

		expect(range.startIso).toBe("2026-06-01T07:00:00.000Z");
		expect(range.endIso).toBe("2026-07-01T06:59:59.999Z");
	});

	it("returns the previous calendar month for monthly pay period offset", () => {
		const range = getLaborDateRange(
			"pay_period",
			"monthly",
			anchorDate,
			timeZone,
			referenceDate,
			1,
		);

		expect(range.startIso).toBe("2026-05-01T07:00:00.000Z");
		expect(range.endIso).toBe("2026-06-01T06:59:59.999Z");
	});
});

describe("getPayPeriodOptions", () => {
	const timeZone = "America/Los_Angeles";
	const anchorDate = "2026-06-17";

	it("only includes pay periods on or after the anchor date", () => {
		const earlyReference = new Date("2026-06-20T12:00:00.000Z");
		const earlyOptions = getPayPeriodOptions(
			"bi-weekly",
			anchorDate,
			timeZone,
			earlyReference,
		);

		expect(earlyOptions).toHaveLength(1);
		expect(earlyOptions[0].offset).toBe(0);
		expect(earlyOptions[0].label).toContain("Current");
	});

	it("lists prior anchored pay periods after the first cycle", () => {
		const laterReference = new Date("2026-07-15T12:00:00.000Z");
		const options = getPayPeriodOptions(
			"bi-weekly",
			anchorDate,
			timeZone,
			laterReference,
		);

		expect(options).toHaveLength(3);
		expect(options[0].label).toContain("Current");
		expect(options[1].label).toBe("Jul 1 – Jul 14, 2026");
		expect(options[2].label).toBe("Jun 17 – Jun 30, 2026");
	});

	it("excludes calendar months before the anchor month", () => {
		const options = getPayPeriodOptions(
			"monthly",
			anchorDate,
			timeZone,
			new Date("2026-06-20T12:00:00.000Z"),
		);

		expect(options).toHaveLength(1);
		expect(options[0].label).toContain("Jun");
	});
});
