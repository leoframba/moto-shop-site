"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCopy, FiMail, FiRefreshCw, FiUserPlus, FiX } from "react-icons/fi";
import { toast } from "sonner";
import type { AdminUser } from "@/types";
import { authApiRequest } from "@/utils/api";
import { AdminModal } from "./modals";

interface UserFormData {
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
}

interface UserManagerFormProps {
	isEditing: boolean;
	formData: UserFormData;
	updateField: (field: keyof UserFormData, value: string) => void;
	handleSave: () => void;
	closeForm: () => void;
	isSaving: boolean;
}

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

const UserManagerForm = ({
	isEditing,
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
						Email {isEditing ? "(read-only)" : ""}
					</label>
					<input
						id="user-email"
						type="email"
						value={formData.email}
						readOnly={isEditing}
						onChange={(e) => updateField("email", e.target.value)}
						placeholder="rider@example.com"
						className={`w-full border border-neutral-700 rounded p-3 text-white outline-none ${
							isEditing
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
						value={formData.phone_number}
						onChange={(e) => updateField("phone_number", e.target.value)}
						placeholder="(555) 123-4567"
						className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
					/>
				</div>
			</div>

			{!isEditing && (
				<p className="text-xs text-neutral-300 mb-4 inline-flex items-center gap-2">
					<FiMail className="h-3.5 w-3.5" />
					An invite email will be sent with a link to finish account setup.
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
							: "Sending..."
						: isEditing
							? "Save User"
							: "Send Invite"}
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

export default function AdminUsersTab() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isFormVisible, setIsFormVisible] = useState(false);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [formData, setFormData] = useState<UserFormData>(getInitialFormData);
	const [searchTerm, setSearchTerm] = useState("");
	const [resendingUserId, setResendingUserId] = useState<string | null>(null);
	const [inviteLink, setInviteLink] = useState<{
		email: string;
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
	};

	const openInviteForm = () => {
		resetForm();
		setIsFormVisible(true);
	};

	const openEditForm = (user: AdminUser) => {
		setEditingUserId(user.id);
		setFormData({
			email: user.email,
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
		if (isEditing) {
			setIsSaving(true);
			try {
				await authApiRequest<AdminUser>(`/api/admin/users/${editingUserId}`, {
					method: "PATCH",
					body: JSON.stringify({
						first_name: formData.first_name.trim() || null,
						last_name: formData.last_name.trim() || null,
						phone_number: formData.phone_number.trim() || null,
					}),
				});
				toast.success("User updated.");
				closeForm();
				await fetchUsers();
			} catch (error) {
				console.error(error);
				toast.error("Failed to update user.");
			} finally {
				setIsSaving(false);
			}
			return;
		}

		const email = formData.email.trim();
		if (!email) {
			toast.warning("Email is required to invite a user.");
			return;
		}

		setIsSaving(true);
		try {
			await authApiRequest<{ message: string }>("/api/admin/users/invite", {
				method: "POST",
				body: JSON.stringify({
					email,
					first_name: formData.first_name.trim() || null,
					last_name: formData.last_name.trim() || null,
					phone_number: formData.phone_number.trim() || null,
					redirect_base_url: window.location.origin,
				}),
			});
			toast.success(`Invitation sent to ${email}.`);
			closeForm();
			await fetchUsers();
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "Failed to invite user.",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleResendInvite = async (user: AdminUser) => {
		setResendingUserId(user.id);
		try {
			const result = await authApiRequest<{
				email: string;
				action_link: string;
			}>(`/api/admin/users/${user.id}/resend-invite`, {
				method: "POST",
				body: JSON.stringify({ redirect_base_url: window.location.origin }),
			});
			setInviteLink({ email: result.email, url: result.action_link });
			try {
				await navigator.clipboard.writeText(result.action_link);
				toast.success(`Fresh invite link copied for ${result.email}.`);
			} catch {
				toast.success(`Fresh invite link generated for ${result.email}.`);
			}
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "Failed to generate link.",
			);
		} finally {
			setResendingUserId(null);
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
						Edit rider profiles and invite new customers to the rider portal.
					</p>
				</div>
				<button
					type="button"
					onClick={openInviteForm}
					className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-sm transition-all inline-flex items-center gap-2 shadow-lg"
				>
					<FiUserPlus className="h-4 w-4" /> Invite User
				</button>
			</div>

			{isFormVisible && (
				<AdminModal
					open={isFormVisible}
					onClose={closeForm}
					title={isEditing ? "Edit User" : "Invite User"}
					size="lg"
				>
					<UserManagerForm
						isEditing={isEditing}
						formData={formData}
						updateField={updateField}
						handleSave={handleSave}
						closeForm={closeForm}
						isSaving={isSaving}
					/>
				</AdminModal>
			)}

			{inviteLink && (
				<div className="bg-neutral-900 border border-emerald-600/40 p-4 rounded-lg mb-8">
					<div className="flex items-start justify-between gap-4 mb-2">
						<p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
							Invite link for {inviteLink.email}
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
					No users yet. Invite your first rider.
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
							<table className="w-full min-w-[48rem] border-collapse bg-neutral-900">
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
											<td className="max-w-[16rem] truncate px-4 py-3 text-sm text-neutral-300">
												{user.email}
											</td>
											<td className="px-4 py-3 text-sm text-neutral-300">
												{user.phone_number ?? "—"}
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => void handleResendInvite(user)}
														disabled={resendingUserId === user.id}
														className="inline-flex items-center gap-2 rounded bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-700 disabled:opacity-50"
													>
														<FiRefreshCw
															className={`h-3.5 w-3.5 ${
																resendingUserId === user.id
																	? "animate-spin"
																	: ""
															}`}
														/>
														{resendingUserId === user.id
															? "Generating..."
															: "Resend"}
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
