/** Shared layout and color tokens for invoice admin UI.
 *  Visual hierarchy: shell (950) → section (900) → field (800) for readable contrast. */

const invoiceFocusRing =
	"outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

const invoiceFieldSurface = `rounded-md border border-neutral-600 bg-neutral-800 text-neutral-50 shadow-sm shadow-black/20 ${invoiceFocusRing}`;

export const invoiceOverlayClass =
	"fixed inset-0 z-[60] bg-black/70 p-4 backdrop-blur-sm";

export const invoiceShellClass =
	"flex h-full flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950 text-neutral-100";

export const invoiceHeaderClass =
	"flex items-center justify-between border-b border-neutral-700 bg-neutral-900/50 px-5 py-4";

export const invoiceHeaderTitleClass =
	"text-sm font-bold uppercase tracking-widest text-neutral-100";

export const invoiceBodyClass = "flex-1 overflow-y-auto p-5";

export const invoiceStackClass = "space-y-6";

export const invoiceSectionClass =
	"rounded-lg border border-neutral-700/60 bg-neutral-900 p-5";

export const invoiceAccordionSectionClass =
	"rounded-lg border border-neutral-700/60 bg-neutral-900/80 p-4 sm:p-5";

export const invoiceCardClass =
	"rounded-lg border border-neutral-600/50 bg-neutral-800/30 p-4";

export const invoiceLineRowClass =
	"rounded-lg border border-neutral-600/40 bg-neutral-800/25 p-3";

export const invoiceSectionTitleClass =
	"mb-4 text-sm font-bold uppercase tracking-widest text-neutral-100";

export const invoiceSubheadingClass =
	"text-xs font-bold uppercase tracking-widest text-neutral-300";

export const invoiceLabelClass =
	"mb-1.5 block text-xs font-medium text-neutral-300";

export const invoiceHintClass =
	"mt-1.5 text-xs leading-relaxed text-neutral-300";

export const invoiceBodyMutedClass =
	"mb-3 text-xs leading-relaxed text-neutral-300";

export const invoiceFieldInputClass = `w-full ${invoiceFieldSurface} px-3 py-2.5 text-sm placeholder:text-neutral-300`;

export const invoiceFieldInputLgClass = `w-full ${invoiceFieldSurface} p-3 text-sm placeholder:text-neutral-300`;

export const invoiceDatetimeFieldClass = `${invoiceFieldInputLgClass} invoice-datetime-field cursor-pointer`;

export const invoiceDateFieldClass = `${invoiceFieldInputClass} invoice-datetime-field cursor-pointer`;

export const invoiceReadOnlyFieldClass =
	"w-full rounded-md border border-neutral-700 bg-neutral-900/90 px-3 py-2.5 text-sm text-neutral-200";

export const invoiceTextareaClass = `h-48 w-full ${invoiceFieldSurface} p-3 text-sm leading-relaxed placeholder:text-neutral-300`;

export const invoicePickerButtonClass = `flex-1 ${invoiceFieldSurface} p-3 text-left text-sm transition-colors hover:border-emerald-500/80`;

export const invoiceLinePickerButtonClass = `w-full ${invoiceFieldSurface} p-2.5 text-left text-sm transition-colors hover:border-emerald-500/80`;

export const invoiceSecondaryButtonClass =
	"rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-bold uppercase tracking-widest text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-700";

export const invoiceHeaderSaveButtonClass =
	"rounded-md border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-emerald-500 hover:bg-emerald-500 disabled:border-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-400";

export const invoiceActionButtonClass =
	"inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors sm:w-auto";

export const invoicePrimaryButtonClass =
	"rounded-md bg-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-500 disabled:bg-neutral-700 disabled:text-neutral-300";

export const invoiceAddActionClass =
	"inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300";

export const invoiceTotalPanelClass =
	"mb-4 ml-auto max-w-sm space-y-2 rounded-lg border border-emerald-600/30 bg-neutral-800/40 p-4";

export const invoiceTotalBoxClass =
	"rounded-lg border border-neutral-600 bg-neutral-800 p-3";

export const invoiceTotalLabelClass =
	"mb-1 text-[11px] font-medium uppercase tracking-widest text-neutral-300";

export const invoiceLineTotalClass =
	"pb-2 text-sm font-semibold text-emerald-300";

export const invoiceCheckboxClass =
	"h-4 w-4 rounded border-neutral-500 bg-neutral-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900";

export const invoiceEmptyHintClass = "text-sm text-neutral-300";

export const invoicePickerClearOptionClass = `w-full ${invoiceFieldSurface} p-3 text-left text-sm font-semibold transition-colors hover:border-emerald-500 hover:bg-neutral-700/60`;

export const invoiceCreateActionClass =
	"w-full rounded-md border border-emerald-600/50 bg-neutral-800 p-3 text-left text-sm text-neutral-50 transition-colors hover:border-emerald-500 hover:bg-neutral-700/50";

export const invoiceModalSearchInputClass = `mb-4 ${invoiceFieldInputLgClass}`;

export const invoiceTableWrapClass =
	"overflow-x-auto rounded-lg border border-neutral-700/60";

export const invoiceTableClass =
	"w-full border-collapse bg-neutral-900 text-sm";

export const invoiceTableClassWide = `${invoiceTableClass} min-w-[52rem]`;

export const invoiceTableClassParts = `${invoiceTableClass} min-w-[44rem]`;

export const invoiceTableHeadRowClass =
	"border-b border-neutral-700 bg-neutral-800/60 text-left text-xs font-bold uppercase tracking-widest text-neutral-300";

export const invoiceTableHeadCellClass = "px-3 py-3";

export const invoiceTableBodyClass = "divide-y divide-neutral-700/50";

export const invoiceTableCellClass = "px-3 py-2.5 align-middle";

export const invoiceTableCellRightClass = "px-3 py-2.5 text-right align-middle";

export const invoiceTableInputClass = `w-full min-w-[4.5rem] ${invoiceFieldSurface} px-2.5 py-2 text-sm`;

export const invoiceTablePickerButtonClass = `w-full min-w-[10rem] ${invoiceFieldSurface} px-2.5 py-2 text-left text-sm transition-colors hover:border-emerald-500/80`;

export const invoiceTableTotalClass =
	"font-semibold text-emerald-300 whitespace-nowrap";

export const invoiceTableDeleteButtonClass =
	"inline-flex items-center justify-center rounded-md p-2 text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300";
