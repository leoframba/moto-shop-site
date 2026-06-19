"use client";

import { type ReactNode, useEffect, useId } from "react";
import {
	MODAL_PANEL_SIZES,
	MODAL_Z_INDEX,
	type ModalPanelSize,
	modalCloseButtonClass,
	modalHeaderClass,
	modalOverlayClass,
	modalPanelClass,
	modalTitleClass,
} from "./modal-ui";

export interface AdminModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	/** Panel width preset. Defaults to `md`. */
	size?: ModalPanelSize;
	/** Extra classes on the panel (e.g. max height). */
	panelClassName?: string;
	/** When false, backdrop clicks do not close. Defaults to true. */
	closeOnBackdrop?: boolean;
	/** Lock page scroll while open. Defaults to true. */
	lockBackgroundScroll?: boolean;
	/** Close when Escape is pressed. Defaults to true. */
	closeOnEscape?: boolean;
	/** Stacking order. Defaults to `MODAL_Z_INDEX`. */
	zIndex?: number;
}

function lockPageScroll() {
	const scrollY = window.scrollY;
	const {
		overflow: bodyOverflow,
		position: bodyPosition,
		top: bodyTop,
		width: bodyWidth,
	} = document.body.style;
	const htmlOverflow = document.documentElement.style.overflow;

	document.documentElement.style.overflow = "hidden";
	document.body.style.overflow = "hidden";
	document.body.style.position = "fixed";
	document.body.style.top = `-${scrollY}px`;
	document.body.style.width = "100%";

	return () => {
		document.documentElement.style.overflow = htmlOverflow;
		document.body.style.overflow = bodyOverflow;
		document.body.style.position = bodyPosition;
		document.body.style.top = bodyTop;
		document.body.style.width = bodyWidth;
		window.scrollTo(0, scrollY);
	};
}

export function AdminModal({
	open,
	onClose,
	title,
	children,
	size = "md",
	panelClassName = "",
	closeOnBackdrop = true,
	lockBackgroundScroll = true,
	closeOnEscape = true,
	zIndex = MODAL_Z_INDEX,
}: AdminModalProps) {
	const titleId = useId();

	useEffect(() => {
		if (!open) return;

		const unlockScroll = lockBackgroundScroll ? lockPageScroll() : undefined;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && closeOnEscape) onClose();
		};
		window.addEventListener("keydown", onKeyDown);

		return () => {
			unlockScroll?.();
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [open, onClose, lockBackgroundScroll, closeOnEscape]);

	if (!open) return null;

	return (
		<div
			className={`${modalOverlayClass} overscroll-contain`}
			style={{ zIndex }}
			role="presentation"
		>
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				aria-label="Close dialog"
				onClick={closeOnBackdrop ? onClose : undefined}
				tabIndex={-1}
			/>
			<div
				className={`relative ${modalPanelClass} ${MODAL_PANEL_SIZES[size]} ${panelClassName}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
			>
				<div className={modalHeaderClass}>
					<h4 id={titleId} className={modalTitleClass}>
						{title}
					</h4>
					<button
						type="button"
						onClick={onClose}
						className={modalCloseButtonClass}
					>
						Close
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
