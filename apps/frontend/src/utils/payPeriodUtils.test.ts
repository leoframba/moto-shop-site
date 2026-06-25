import { describe, expect, it } from "vitest";
import { getLaborDateRange } from "@/utils/payPeriodUtils";

describe("getLaborDateRange", () => {
	const timeZone = "America/Los_Angeles";
	const anchorDate = "2026-06-17";

	it("returns bi-weekly pay period containing the reference date", () => {
		const range = getLaborDateRange(
			"pay_period",
			"bi-weekly",
			anchorDate,
			timeZone,
			new Date("2026-06-20T12:00:00.000Z"),
		);

		expect(range.startIso).toBe("2026-06-17T07:00:00.000Z");
		expect(range.endIso).toBe("2026-07-01T06:59:59.999Z");
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
});
