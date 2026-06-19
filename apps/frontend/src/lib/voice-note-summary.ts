export interface VoiceNoteSummary {
	transcript: string;
	summaryBullets: string[];
}

export function normalizeAudioMimeType(mimeType: string): string {
	const baseType = (mimeType || "").split(";")[0]?.trim().toLowerCase();

	if (!baseType) return "audio/webm";

	const supported = new Set([
		"audio/wav",
		"audio/x-wav",
		"audio/mpeg",
		"audio/mp3",
		"audio/aiff",
		"audio/aac",
		"audio/mp4",
		"audio/ogg",
		"audio/flac",
		"audio/webm",
	]);

	if (supported.has(baseType)) {
		if (baseType === "audio/x-wav") return "audio/wav";
		if (baseType === "audio/mp3") return "audio/mpeg";
		return baseType;
	}

	if (baseType.includes("ogg")) return "audio/ogg";
	if (baseType.includes("mp4") || baseType.includes("m4a")) return "audio/mp4";
	if (baseType.includes("webm")) return "audio/webm";

	return baseType;
}

export function appendVoiceNoteToMechanicNotes(
	existingNotes: string,
	summary: VoiceNoteSummary,
): string {
	const timestamp = new Date().toLocaleString();
	const bullets = summary.summaryBullets.map((item) => `- ${item}`).join("\n");
	const block = `--- Voice note (${timestamp}) ---\n${bullets}`;
	const trimmed = existingNotes.trim();

	return trimmed ? `${trimmed}\n\n${block}` : block;
}
