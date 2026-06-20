/** Shared modal layout tokens — keep z-index and panel sizes in one place. */
export const MODAL_Z_INDEX = 70;
export const MODAL_NESTED_Z_INDEX = MODAL_Z_INDEX + 10;

export const modalOverlayClass =
	"fixed inset-0 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm";

export const modalPanelClass =
	"w-full rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5";

export const modalHeaderClass = "mb-4 flex items-center justify-between gap-3";

export const modalTitleClass =
	"text-lg font-bold uppercase tracking-widest text-white";

export const modalCloseButtonClass =
	"shrink-0 text-sm font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-white";

export const modalOptionButtonClass =
	"w-full rounded-md border border-neutral-800 bg-neutral-900 p-3 text-left transition-colors hover:border-emerald-600";

export const MODAL_PANEL_SIZES = {
	sm: "max-w-md",
	md: "max-w-2xl",
	lg: "max-w-3xl",
	xl: "max-w-4xl",
	full: "max-w-6xl",
} as const;

export type ModalPanelSize = keyof typeof MODAL_PANEL_SIZES;
