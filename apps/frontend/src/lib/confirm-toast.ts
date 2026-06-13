import { toast } from "sonner";

const CONFIRM_DELETE_DURATION_MS = 10_000;

type ConfirmDeleteToastOptions = {
	title: string;
	description: string;
	confirmLabel?: string;
	onConfirm: () => void | Promise<void>;
};

export function confirmDeleteToast({
	title,
	description,
	confirmLabel = "Delete",
	onConfirm,
}: ConfirmDeleteToastOptions) {
	toast.warning(title, {
		description: `${description} This prompt closes in 10 seconds.`,
		duration: CONFIRM_DELETE_DURATION_MS,
		action: {
			label: confirmLabel,
			onClick: () => {
				void onConfirm();
			},
		},
		cancel: {
			label: "Cancel",
			onClick: () => {},
		},
	});
}
