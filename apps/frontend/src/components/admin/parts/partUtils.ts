import type { Part } from "@/types";

export function getPartDisplayLabel(
	part: Pick<Part, "part_number" | "description">,
): string {
	const partNumber = part.part_number?.trim();
	if (partNumber) {
		return `${partNumber} — ${part.description}`;
	}
	return part.description;
}

export function compareParts(a: Part, b: Part): number {
	return a.description.localeCompare(b.description, undefined, {
		sensitivity: "base",
	});
}

export function partMatchesQuery(
	part: Pick<Part, "part_number" | "description">,
	query: string,
): boolean {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return true;

	const description = part.description.toLowerCase();
	const partNumber = part.part_number?.toLowerCase() ?? "";
	return description.includes(normalized) || partNumber.includes(normalized);
}

export function getPartSaveErrorMessage(
	error: unknown,
	fallback: string,
): string {
	return error instanceof Error && error.message ? error.message : fallback;
}
