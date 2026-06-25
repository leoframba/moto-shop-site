"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	FiCopy,
	FiLink,
	FiMail,
	FiSend,
	FiSmartphone,
	FiUserPlus,
	FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import type { AdminUser } from "@/types";
import { authApiRequest } from "@/utils/api";
import { formatPhoneForDisplay, normalizePhoneToE164 } from "@/utils/phone";
import { AdminModal } from "./modals";

interface UserFormData {
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getInitialFormData = (): UserFormData => ({
	email: "",
	first_name: "",
	last_name: "",
	phone_number: "",
});

const getUserDisplayName = (user: AdminUser): string => {
	const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
	return fullName || "Unnamed rider";
};

const isValidEmail = (value: string): boolean => {
	const trimmed = value.trim().toLowerCase();
	return trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
};

const isValidPhone = (value: string): boolean => {
	return normalizePhoneToE164(value.trim()) !== null;
};

const formatPhoneDisplay = (value: string | null | undefined): string => {
	if (!value?.trim()) return "—";
	const e164 = normalizePhoneToE164(value);
	return e164 ? formatPhoneForDisplay(e164) : value;
};

function ConfirmationStatus({
	label,
	value,
	confirmed,
	hasValue,
}: {
	label: string;
	value: string;
	confirmed?: boolean;
	hasValue: boolean;
}) {
	return (
		<div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
			<p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
				{label}
			</p>
			<p className="text-sm text-white break-all">{value}</p>
			<p
				className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${
					!hasValue
						? "text-neutral-500"
						: confirmed
							? "text-emerald-400"
							: "text-amber-400"
				}`}
			>
				{!hasValue
					? "Not on file"
					: confirmed
						? "Confirmed"
						: "Pending confirmation"}
			</p>
		</div>
	);
}

interface UserManagerFormProps {
	isEditing: boolean;
	emailReadOnly: boolean;
	formData: UserFormData;
	updateField: (field: keyof UserFormData, value: string) => void;
	handleSave: () => void;
	closeForm: () => void;
	isSaving: boolean;
}

const UserManagerForm = ({
	isEditing,
	emailReadOnly,
	formData,
	updateField,
	handleSave,
	closeForm,
	isSaving,
}: UserManagerFormProps) => {
	return (
		<>
			<div className="grid md:grid-cols-2 gap-4 mb-4">
				<div className="md:col-span-2">
					<label
						htmlFor="user-email"
						className="text-xs text-neutral-300 block mb-1"
					>
						Email{" "}
						{emailReadOnly
							? "(read-only)"
							: isEditing
								? "(optional — add for email login)"
								: "(email or phone required)"}
					</label>
					<input
						id="user-email"
						type="email"
						value={formData.email}
						readOnly={emailReadOnly}
						onChange={(e) => updateField("email", e.target.value)}
						placeholder="rider@example.com"
						className={`w-full border border-neutral-700 rounded p-3 text-white outline-none ${
							emailReadOnly
								? "bg-neutral-800 cursor-not-allowed"
								: "bg-neutral-950 focus:border-emerald-500"
						}`}
					/>
				</div>
				<div>
					<label
						htmlFor="user-first-name"
						className="text-xs text-neutral-300 block mb-1"
					>
						First Name
					</label>
					<input
						id="user-first-name"
						value={formData.first_name}
						onChange={(e) => updateField("first_name", e.target.value)}
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
				<div>
					<label
						htmlFor="user-last-name"
						className="text-xs text-neutral-300 block mb-1"
					>
						Last Name
					</label>
					<input
						id="user-last-name"
						value={formData.last_name}
						onChange={(e) => updateField("last_name", e.target.value)}
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
				<div className="md:col-span-2">
					<label
						htmlFor="user-phone"
						className="text-xs text-neutral-300 block mb-1"
					>
						Phone Number
					</label>
					<input
						id="user-phone"
						type="tel"
						value={formData.phone_number}
						onChange={(e) => updateField("phone_number", e.target.value)}
						placeholder="(555) 123-4567"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
			</div>

			{!isEditing && (
				<p className="text-xs text-neutral-400 mb-4">
					Creates the account only. Use Invite on the user row to send a setup
					link by email or SMS later.
				</p>
			)}

			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => void handleSave()}
					disabled={isSaving}
					className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 px-6 py-2 rounded font-bold text-sm transition-colors"
				>
					{isSaving
						? isEditing
							? "Saving..."
							: "Creating..."
						: isEditing
							? "Save User"
							: "Create User"}
				</button>
				<button
					type="button"
					onClick={closeForm}
					disabled={isSaving}
					className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded font-bold text-sm transition-colors"
				>
					Cancel
				</button>
			</div>
		</>
	);
};

interface InviteModalProps {
	user: AdminUser;
	open: boolean;
	onClose: () => void;
	onInviteLink: (user: AdminUser) => Promise<void>;
	onInviteEmail: (user: AdminUser) => Promise<void>;
	inviteAction: "link" | "email" | null;
}

const InviteModal = ({
	user,
	open,
	onClose,
	onInviteLink,
	onInviteEmail,
	inviteAction,
}: InviteModalProps) => {
	const emailValue = user.email?.trim() ?? "";
	const phoneValue = user.phone_number?.trim() ?? "";
	const hasValidEmail = isValidEmail(emailValue);
	const hasValidPhone = isValidPhone(phoneValue);
	const isBusy = inviteAction !== null;

	return (
		<AdminModal open={open} onClose={onClose} title="Invite Rider" size="lg">
			<p className="text-sm text-neutral-400 mb-4">
				Send a link to finish account setup and set a password for{" "}
				<span className="text-white font-semibold">
					{getUserDisplayName(user)}
				</span>
				.
			</p>

			<div className="grid sm:grid-cols-2 gap-3 mb-6">
				<ConfirmationStatus
					label="Email"
					value={emailValue || "—"}
					confirmed={user.email_confirmed}
					hasValue={hasValidEmail}
				/>
				<ConfirmationStatus
					label="Phone"
					value={formatPhoneDisplay(phoneValue)}
					confirmed={user.phone_confirmed}
					hasValue={hasValidPhone}
				/>
			</div>

			<div className="space-y-3">
				<button
					type="button"
					disabled={!(hasValidEmail || hasValidPhone) || isBusy}
					onClick={() => void onInviteLink(user)}
					className="w-full flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-left hover:border-emerald-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					<span>
						<span className="flex items-center gap-2 text-sm font-bold text-white">
							<FiLink className="h-4 w-4 text-emerald-400" />
							Generate invite link
						</span>
						<span className="mt-1 block text-xs text-neutral-400">
							{hasValidEmail
								? "Copy a one-time link to share manually."
								: "Copy a one-time link to text or share with their phone number."}
						</span>
					</span>
					<span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
						{inviteAction === "link" ? "Working..." : "Ready"}
					</span>
				</button>

				<button
					type="button"
					disabled={!hasValidEmail || isBusy}
					onClick={() => void onInviteEmail(user)}
					className="w-full flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-left hover:border-emerald-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					<span>
						<span className="flex items-center gap-2 text-sm font-bold text-white">
							<FiMail className="h-4 w-4 text-emerald-400" />
							Invite via email
						</span>
						<span className="mt-1 block text-xs text-neutral-400">
							Send the setup link to {emailValue || "their email"}.
						</span>
					</span>
					<span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
						{inviteAction === "email" ? "Sending..." : "Ready"}
					</span>
				</button>

				<button
					type="button"
					disabled
					className="w-full flex items-center justify-between gap-3 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/50 px-4 py-3 text-left opacity-70 cursor-not-allowed"
				>
					<span>
						<span className="flex items-center gap-2 text-sm font-bold text-white">
							<FiSmartphone className="h-4 w-4 text-neutral-500" />
							Invite via SMS
						</span>
						<span className="mt-1 block text-xs text-neutral-500">
							Same setup link over text message. Telnyx integration WIP.
						</span>
					</span>
					<span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
						WIP
					</span>
				</button>
			</div>

			{!hasValidEmail && !hasValidPhone && (
				<p className="mt-4 text-xs text-amber-400">
					Add a valid email or phone number before generating an invite link.
				</p>
			)}
			{!hasValidEmail && hasValidPhone && (
				<p className="mt-4 text-xs text-neutral-400">
					Phone-only account: the link is not sent automatically — copy it and
					text it to {formatPhoneDisplay(phoneValue)} yourself.
				</p>
			)}
		</AdminModal>
	);
};

export default function AdminUsersTab() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isFormVisible, setIsFormVisible] = useState(false);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [editingUserHasEmail, setEditingUserHasEmail] = useState(false);
	const [formData, setFormData] = useState<UserFormData>(getInitialFormData);
	const [searchTerm, setSearchTerm] = useState("");
	const [inviteUser, setInviteUser] = useState<AdminUser | null>(null);
	const [inviteAction, setInviteAction] = useState<"link" | "email" | null>(
		null,
	);
	const [inviteLink, setInviteLink] = useState<{
		label: string;
		url: string;
	} | null>(null);

	const isEditing = editingUserId !== null;

	const fetchUsers = useCallback(async () => {
		setIsLoading(true);
		try {
			const rows = await authApiRequest<AdminUser[]>("/api/admin/users", {
				cache: "no-store",
			});
			setUsers(rows);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load users.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchUsers();
	}, [fetchUsers]);

	const resetForm = () => {
		setFormData(getInitialFormData());
		setEditingUserId(null);
		setEditingUserHasEmail(false);
	};

	const openCreateForm = () => {
		resetForm();
		setIsFormVisible(true);
	};

	const openEditForm = (user: AdminUser) => {
		setEditingUserId(user.id);
		setEditingUserHasEmail(Boolean(user.email?.trim()));
		setFormData({
			email: user.email ?? "",
			first_name: user.first_name ?? "",
			last_name: user.last_name ?? "",
			phone_number: user.phone_number ?? "",
		});
		setIsFormVisible(true);
	};

	const closeForm = () => {
		resetForm();
		setIsFormVisible(false);
	};

	const updateField = (field: keyof UserFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		const email = formData.email.trim().toLowerCase();
		const phone = formData.phone_number.trim();
		const hasValidEmail = isValidEmail(email);
		const hasValidPhone = isValidPhone(phone);

		if (isEditing) {
			if (!hasValidEmail && !hasValidPhone) {
				toast.warning("User must have a valid email or phone number.");
				return;
			}
			if (!editingUserHasEmail && email && !hasValidEmail) {
				toast.warning("Enter a valid email address.");
				return;
			}

			setIsSaving(true);
			try {
				const body: Record<string, string | null> = {
					first_name: formData.first_name.trim() || null,
					last_name: formData.last_name.trim() || null,
					phone_number: hasValidPhone ? phone : null,
				};
				if (!editingUserHasEmail) {
					body.email = hasValidEmail ? email : null;
				}

				await authApiRequest<AdminUser>(`/api/admin/users/${editingUserId}`, {
					method: "PATCH",
					body: JSON.stringify(body),
				});
				toast.success("User updated.");
				closeForm();
				await fetchUsers();
			} catch (error) {
				console.error(error);
				toast.error(
					error instanceof Error ? error.message : "Failed to update user.",
				);
			} finally {
				setIsSaving(false);
			}
			return;
		}

		if (!hasValidEmail && !hasValidPhone) {
			toast.warning("Enter a valid email or phone number.");
			return;
		}

		setIsSaving(true);
		try {
			await authApiRequest<AdminUser>("/api/admin/users", {
				method: "POST",
				body: JSON.stringify({
					email: hasValidEmail ? email : null,
					first_name: formData.first_name.trim() || null,
					last_name: formData.last_name.trim() || null,
					phone_number: hasValidPhone ? phone : null,
				}),
			});
			toast.success("User created.");
			closeForm();
			await fetchUsers();
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "Failed to create user.",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleInviteLink = async (user: AdminUser) => {
		setInviteAction("link");
		try {
			const result = await authApiRequest<{
				email: string;
				action_link: string;
			}>(`/api/admin/users/${user.id}/invite`, {
				method: "POST",
				body: JSON.stringify({
					channel: "link",
					redirect_base_url: window.location.origin,
				}),
			});
			setInviteLink({
				label: result.email,
				url: result.action_link,
			});
			try {
				await navigator.clipboard.writeText(result.action_link);
				toast.success(`Invite link copied for ${result.email}.`);
			} catch {
				toast.success(`Invite link generated for ${result.email}.`);
			}
			setInviteUser(null);
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "Failed to generate link.",
			);
		} finally {
			setInviteAction(null);
		}
	};

	const handleInviteEmail = async (user: AdminUser) => {
		setInviteAction("email");
		try {
			const result = await authApiRequest<{ email: string; message: string }>(
				`/api/admin/users/${user.id}/invite`,
				{
					method: "POST",
					body: JSON.stringify({
						channel: "email",
						redirect_base_url: window.location.origin,
					}),
				},
			);
			toast.success(result.message || `Invitation sent to ${result.email}.`);
			setInviteUser(null);
			await fetchUsers();
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "Failed to send invite.",
			);
		} finally {
			setInviteAction(null);
		}
	};

	const filteredUsers = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return users;
		return users.filter((user) => {
			const name = getUserDisplayName(user).toLowerCase();
			const email = (user.email ?? "").toLowerCase();
			const phone = (user.phone_number ?? "").toLowerCase();
			return (
				name.includes(query) || email.includes(query) || phone.includes(query)
			);
		});
	}, [users, searchTerm]);

	return (
		<div className="max-w-5xl mx-auto pb-20">
			<div className="mb-8 flex justify-between items-end">
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-white mb-1">
						User Control
					</h2>
					<p className="text-neutral-300 text-sm">
						Create rider accounts, then invite them to finish setup.
					</p>
				</div>
				<button
					type="button"
					onClick={openCreateForm}
					className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-sm transition-all inline-flex items-center gap-2 shadow-lg"
				>
					<FiUserPlus className="h-4 w-4" /> Create User
				</button>
			</div>

			{isFormVisible && (
				<AdminModal
					open={isFormVisible}
					onClose={closeForm}
					title={isEditing ? "Edit User" : "Create User"}
					size="lg"
				>
					<UserManagerForm
						isEditing={isEditing}
						emailReadOnly={isEditing && editingUserHasEmail}
						formData={formData}
						updateField={updateField}
						handleSave={handleSave}
						closeForm={closeForm}
						isSaving={isSaving}
					/>
				</AdminModal>
			)}

			{inviteUser && (
				<InviteModal
					user={inviteUser}
					open={inviteUser !== null}
					onClose={() => setInviteUser(null)}
					onInviteLink={handleInviteLink}
					onInviteEmail={handleInviteEmail}
					inviteAction={inviteAction}
				/>
			)}

			{inviteLink && (
				<div className="bg-neutral-900 border border-emerald-600/40 p-4 rounded-lg mb-8">
					<div className="flex items-start justify-between gap-4 mb-2">
						<p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
							Invite link for {inviteLink.label}
						</p>
						<button
							type="button"
							onClick={() => setInviteLink(null)}
							className="text-neutral-300 hover:text-white"
							aria-label="Dismiss invite link"
						>
							<FiX className="h-4 w-4" />
						</button>
					</div>
					<div className="flex items-center gap-2">
						<input
							readOnly
							value={inviteLink.url}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-xs text-neutral-300 outline-none"
						/>
						<button
							type="button"
							onClick={() => {
								void navigator.clipboard
									.writeText(inviteLink.url)
									.then(() => toast.success("Link copied."))
									.catch(() => toast.error("Couldn't copy link."));
							}}
							className="bg-neutral-800 hover:bg-neutral-700 px-4 py-3 rounded font-bold text-xs uppercase tracking-widest inline-flex items-center gap-2 shrink-0"
						>
							<FiCopy className="h-3.5 w-3.5" /> Copy
						</button>
					</div>
				</div>
			)}

			{isLoading ? (
				<div className="text-center py-20 text-neutral-300 animate-pulse uppercase tracking-widest font-bold">
					Loading Users...
				</div>
			) : users.length === 0 ? (
				<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-300 uppercase tracking-widest text-sm">
					No users yet. Create your first rider.
				</div>
			) : (
				<>
					<div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-4">
						<input
							placeholder="Search by name, email, or phone"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
						/>
					</div>

					{filteredUsers.length === 0 ? (
						<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-300 uppercase tracking-widest text-sm">
							No users match your search.
						</div>
					) : (
						<div className="overflow-x-auto rounded-lg border border-neutral-800">
							<table className="w-full min-w-[52rem] border-collapse bg-neutral-900">
								<thead>
									<tr className="border-b border-neutral-800 bg-neutral-900/80 text-left text-xs font-bold uppercase tracking-widest text-neutral-300">
										<th className="px-4 py-3">Name</th>
										<th className="px-4 py-3">Email</th>
										<th className="px-4 py-3">Phone</th>
										<th className="px-4 py-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-800">
									{filteredUsers.map((user) => (
										<tr key={user.id}>
											<td className="px-4 py-3 font-bold text-white">
												{getUserDisplayName(user)}
											</td>
											<td className="max-w-[14rem] px-4 py-3 text-sm">
												<div className="truncate text-neutral-300">
													{user.email?.trim() || "—"}
												</div>
												{user.email?.trim() ? (
													<div
														className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${
															user.email_confirmed
																? "text-emerald-400"
																: "text-amber-400"
														}`}
													>
														{user.email_confirmed ? "Confirmed" : "Pending"}
													</div>
												) : null}
											</td>
											<td className="px-4 py-3 text-sm">
												<div className="text-neutral-300">
													{formatPhoneDisplay(user.phone_number)}
												</div>
												{user.phone_number?.trim() ? (
													<div
														className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${
															user.phone_confirmed
																? "text-emerald-400"
																: "text-amber-400"
														}`}
													>
														{user.phone_confirmed ? "Confirmed" : "Pending"}
													</div>
												) : null}
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => setInviteUser(user)}
														className="inline-flex items-center gap-2 rounded bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-700"
													>
														<FiSend className="h-3.5 w-3.5" />
														Invite
													</button>
													<button
														type="button"
														onClick={() => openEditForm(user)}
														className="rounded bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-700"
													>
														Edit
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}
		</div>
	);
}
