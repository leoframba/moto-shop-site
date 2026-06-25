import { describe, expect, it } from "vitest";
import {
	formatIdentifierForDisplay,
	formatPhoneForDisplay,
	normalizePhoneToE164,
	parseEmailOrPhone,
} from "@/utils/phone";

describe("normalizePhoneToE164", () => {
	it("formats 10-digit US numbers", () => {
		expect(normalizePhoneToE164("5551234567")).toBe("+15551234567");
		expect(normalizePhoneToE164("(555) 123-4567")).toBe("+15551234567");
	});

	it("formats 11-digit numbers with country code", () => {
		expect(normalizePhoneToE164("15551234567")).toBe("+15551234567");
	});

	it("rejects invalid lengths", () => {
		expect(normalizePhoneToE164("55512")).toBeNull();
		expect(normalizePhoneToE164("")).toBeNull();
	});
});

describe("formatPhoneForDisplay", () => {
	it("formats US E.164 numbers for display", () => {
		expect(formatPhoneForDisplay("+15551234567")).toBe("(555) 123-4567");
	});
});

describe("parseEmailOrPhone", () => {
	it("parses valid emails", () => {
		expect(parseEmailOrPhone("Rider@Example.com")).toEqual({
			type: "email",
			value: "rider@example.com",
		});
	});

	it("parses valid phone numbers", () => {
		expect(parseEmailOrPhone("555-123-4567")).toEqual({
			type: "phone",
			value: "+15551234567",
		});
	});
});

describe("formatIdentifierForDisplay", () => {
	it("leaves email unchanged", () => {
		expect(formatIdentifierForDisplay("rider@example.com")).toBe(
			"rider@example.com",
		);
	});

	it("formats phone identifiers", () => {
		expect(formatIdentifierForDisplay("+15551234567")).toBe("(555) 123-4567");
	});
});
