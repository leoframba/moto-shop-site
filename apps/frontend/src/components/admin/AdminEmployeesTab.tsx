"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { FiPlus } from "react-icons/fi";

import { toast } from "sonner";

import {
	type EmployeeFormData,
	EmployeeManagerForm,
	getInitialEmployeeFormData,
	toEmployeeFormData,
	toEmployeePayload,
	validateEmployeeForm,
} from "@/components/admin/employees/EmployeeManagerForm";
import { useInvoicesDataContext } from "@/components/admin/invoices/InvoicesDataProvider";
import { getEmployeeDisplayName } from "@/components/admin/invoices/invoiceHelpers";
import { AdminModal } from "@/components/admin/modals";

import type { Employee } from "@/types";

import { authApiRequest } from "@/utils/api";

export default function AdminEmployeesTab() {
	const { addEmployee, updateEmployee } = useInvoicesDataContext();

	const [employees, setEmployees] = useState<Employee[]>([]);

	const [isLoading, setIsLoading] = useState(true);

	const [isSaving, setIsSaving] = useState(false);

	const [isFormVisible, setIsFormVisible] = useState(false);

	const [isEditing, setIsEditing] = useState(false);

	const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
		null,
	);

	const [formData, setFormData] = useState<EmployeeFormData>(
		getInitialEmployeeFormData,
	);

	const fetchEmployees = useCallback(async () => {
		setIsLoading(true);

		try {
			const rows = await authApiRequest<Employee[]>("/api/admin/employees", {
				cache: "no-store",
			});

			setEmployees(rows);
		} catch (error) {
			console.error(error);

			toast.error("Failed to load employees.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchEmployees();
	}, [fetchEmployees]);

	const sortedEmployees = useMemo(
		() =>
			[...employees].sort((a, b) =>
				getEmployeeDisplayName(a).localeCompare(getEmployeeDisplayName(b)),
			),

		[employees],
	);

	const closeForm = () => {
		setFormData(getInitialEmployeeFormData());

		setIsFormVisible(false);

		setIsEditing(false);

		setEditingEmployeeId(null);
	};

	const openCreateForm = () => {
		setIsEditing(false);

		setEditingEmployeeId(null);

		setFormData(getInitialEmployeeFormData());

		setIsFormVisible(true);
	};

	const openEditForm = (employee: Employee) => {
		setIsEditing(true);

		setEditingEmployeeId(employee.id);

		setFormData(toEmployeeFormData(employee));

		setIsFormVisible(true);
	};

	const handleSave = async () => {
		const validationError = validateEmployeeForm(formData);

		if (validationError) {
			toast.warning(validationError);

			return;
		}

		setIsSaving(true);

		try {
			if (isEditing && editingEmployeeId) {
				const updated = await authApiRequest<Employee>(
					`/api/admin/employees/${editingEmployeeId}`,

					{
						method: "PATCH",

						body: JSON.stringify(toEmployeePayload(formData)),
					},
				);

				setEmployees((prev) =>
					prev.map((employee) =>
						employee.id === updated.id ? updated : employee,
					),
				);

				updateEmployee(updated);

				toast.success("Employee updated.");
			} else {
				const created = await authApiRequest<Employee>("/api/admin/employees", {
					method: "POST",

					body: JSON.stringify(toEmployeePayload(formData)),
				});

				setEmployees((prev) => [...prev, created]);

				addEmployee(created);

				toast.success("Employee created.");
			}

			closeForm();
		} catch (error) {
			console.error(error);

			toast.error(
				error instanceof Error ? error.message : "Failed to save employee.",
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="mx-auto max-w-5xl pb-20">
			<div className="mb-8 flex items-end justify-between">
				<div>
					<h2 className="mb-1 text-3xl font-bold tracking-tight text-white">
						Employees
					</h2>
					<p className="text-sm text-neutral-300">
						Track mechanics for labor assignment on invoices.
					</p>
				</div>
				<button
					type="button"
					onClick={openCreateForm}
					className="inline-flex items-center gap-2 rounded bg-emerald-600 px-6 py-2 text-sm font-bold uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-emerald-500"
				>
					<FiPlus className="h-4 w-4" /> Add Employee
				</button>
			</div>

			{isLoading ? (
				<div className="py-20 text-center text-sm font-bold uppercase tracking-widest text-neutral-300 animate-pulse">
					Loading employees...
				</div>
			) : sortedEmployees.length === 0 ? (
				<div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 p-10 text-center text-neutral-400">
					No employees yet. Add your first mechanic to assign labor on invoices.
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
					<table className="w-full border-collapse">
						<thead>
							<tr className="border-b border-neutral-800 bg-neutral-950/80 text-left text-xs font-bold uppercase tracking-widest text-neutral-400">
								<th className="px-4 py-3">Name</th>
								<th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{sortedEmployees.map((employee) => (
								<tr
									key={employee.id}
									className="border-b border-neutral-800/80 last:border-b-0"
								>
									<td className="px-4 py-3 font-semibold text-white">
										{getEmployeeDisplayName(employee)}
									</td>
									<td className="px-4 py-3 text-right">
										<button
											type="button"
											onClick={() => openEditForm(employee)}
											className="rounded border border-neutral-700 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
										>
											Edit
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{isFormVisible && (
				<AdminModal
					open={isFormVisible}
					onClose={closeForm}
					title={isEditing ? "Edit Employee" : "Create Employee"}
					size="md"
				>
					<EmployeeManagerForm
						formData={formData}
						isSaving={isSaving}
						isEditing={isEditing}
						onChange={(field, value) =>
							setFormData((prev) => ({ ...prev, [field]: value }))
						}
						onSave={handleSave}
						onCancel={closeForm}
					/>
				</AdminModal>
			)}
		</div>
	);
}
