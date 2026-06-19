import { describe, expect, it } from "vitest";
import {
	appendVoiceNoteToMechanicNotes,
	normalizeAudioMimeType,
} from "./voice-note-summary";

describe("normalizeAudioMimeType", () => {
	it("strips codec parameters", () => {
		expect(normalizeAudioMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
		expect(normalizeAudioMimeType("audio/ogg;codecs=opus")).toBe("audio/ogg");
	});

	it("maps common aliases", () => {
		expect(normalizeAudioMimeType("audio/mp3")).toBe("audio/mpeg");
		expect(normalizeAudioMimeType("audio/x-wav")).toBe("audio/wav");
	});
});

describe("appendVoiceNoteToMechanicNotes", () => {
	it("appends a voice note block to existing notes", () => {
		const result = appendVoiceNoteToMechanicNotes("Existing note.", {
			transcript: "Changed the oil filter.",
			summaryBullets: ["Replaced oil filter", "Checked chain tension"],
		});

		expect(result).toContain("Existing note.");
		expect(result).toContain("- Replaced oil filter");
		expect(result).toContain("- Checked chain tension");
	});
});
