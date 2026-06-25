const PRINT_PREVIEW_FEATURES = "width=960,height=720";

/** Open invoice HTML in a sized preview window and trigger its onload print hook. */
export function printHtmlDocument(html: string): void {
	const blob = new Blob([html], { type: "text/html;charset=utf-8" });
	const objectUrl = URL.createObjectURL(blob);

	const printWindow = window.open(objectUrl, "_blank", PRINT_PREVIEW_FEATURES);

	if (!printWindow) {
		URL.revokeObjectURL(objectUrl);
		throw new Error("Could not open print preview window.");
	}

	const revokeObjectUrl = () => {
		URL.revokeObjectURL(objectUrl);
	};

	printWindow.addEventListener("load", revokeObjectUrl, { once: true });
	window.setTimeout(revokeObjectUrl, 120_000);

	printWindow.focus();
}
