"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiMail, FiUserPlus } from "react-icons/fi";
import { toast } from "sonner";
import type { AdminUser } from "@/types";
import { authApiRequest } from "@/utils/api";

interface UserFormData {
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
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

export default function AdminUsersTab() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isFormVisible, setIsFormVisible] = useState(false);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [formData, setFormData] = useState<UserFormData>(getInitialFormData);
	const [searchTerm, setSearchTerm] = useState("");

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
					<p className="text-neutral-400 text-sm">
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
				<div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg mb-8">
					<h3 className="text-lg font-bold text-white mb-5 uppercase tracking-widest">
						{isEditing ? "Edit User" : "Invite User"}
					</h3>

					<div className="grid md:grid-cols-2 gap-4 mb-4">
						<div className="md:col-span-2">
							<label
								htmlFor="user-email"
								className="text-xs text-neutral-400 block mb-1"
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
								className="text-xs text-neutral-400 block mb-1"
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
								className="text-xs text-neutral-400 block mb-1"
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
								className="text-xs text-neutral-400 block mb-1"
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
						<p className="text-xs text-neutral-500 mb-4 inline-flex items-center gap-2">
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
				</div>
			)}

			{isLoading ? (
				<div className="text-center py-20 text-neutral-500 animate-pulse uppercase tracking-widest font-bold">
					Loading Users...
				</div>
			) : users.length === 0 ? (
				<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-500 uppercase tracking-widest text-sm">
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
						<div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center bg-neutral-900/20 text-neutral-500 uppercase tracking-widest text-sm">
							No users match your search.
						</div>
					) : (
						<div className="space-y-3">
							{filteredUsers.map((user) => (
								<div
									key={user.id}
									className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
								>
									<div className="min-w-0">
										<p className="text-white font-bold">
											{getUserDisplayName(user)}
										</p>
										<p className="text-sm text-neutral-400 truncate">
											{user.email}
										</p>
										<p className="text-xs text-neutral-500 mt-1">
											{user.phone_number || "No phone on file"}
										</p>
									</div>
									<div className="self-start md:self-auto flex items-center gap-2">
										<button
											type="button"
											onClick={() => openEditForm(user)}
											className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded font-bold text-xs uppercase tracking-widest"
										>
											Edit User
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
