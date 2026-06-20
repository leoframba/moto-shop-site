"use client";

import { useMemo, useState } from "react";
import { AdminModal } from "@/components/admin/modals";
import type { AdminUser, InvoiceBike } from "@/types";
import { getBikeDisplayLabel, getUserDisplayName } from "./invoiceHelpers";
import {
	invoiceFieldInputClass,
	invoicePickerClearOptionClass,
} from "./invoiceUi";

const modalScrollBodyClass = "max-h-[55vh] overflow-y-auto pr-1";

const filterSearchPanelClass =
	"rounded-lg border border-neutral-800 bg-neutral-900 p-4";

const filterSearchInputClass =
	"w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-sm text-white outline-none focus:border-emerald-500";

const filterTableWrapClass = "overflow-x-auto rounded-lg border border-neutral-800";

const filterTableHeadRowClass =
	"border-b border-neutral-800 bg-neutral-900/80 text-left text-xs font-bold uppercase tracking-widest text-neutral-300";

const filterTableHeadCellClass = "px-4 py-3";

const filterTableBodyClass = "divide-y divide-neutral-800";

const filterSelectableRowClass =
	"cursor-pointer transition-colors hover:bg-neutral-800/60";

const filterEmptyStateClass =
	"rounded-lg border border-dashed border-neutral-800 bg-neutral-900/20 p-10 text-center text-sm uppercase tracking-widest text-neutral-300";

interface BikeSearchFilters {
	vin: string;
	plate: string;
	owner: string;
	year: string;
}

const getInitialBikeSearchFilters = (): BikeSearchFilters => ({
	vin: "",
	plate: "",
	owner: "",
	year: "",
});

const getBikeOwnerSearchText = (bike: InvoiceBike): string => {
	if (!bike.owner) return "";
	const ownerName =
		`${bike.owner.first_name ?? ""} ${bike.owner.last_name ?? ""}`.trim();
	return `${ownerName} ${bike.owner.email}`.toLowerCase();
};

const getBikeOwnerDisplayName = (bike: InvoiceBike): string => {
	if (!bike.owner) return "—";
	return getUserDisplayName(bike.owner);
};

interface InvoiceOwnerFilterModalProps {
	users: AdminUser[];
	onSelect: (userId: string) => void;
	onClose: () => void;
	clearOptionLabel?: string;
}

export function InvoiceOwnerFilterModal({
	users,
	onSelect,
	onClose,
	clearOptionLabel = "All owners",
}: InvoiceOwnerFilterModalProps) {
	const [searchTerm, setSearchTerm] = useState("");

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
	}, [searchTerm, users]);

	const handleSelect = (userId: string) => {
		onSelect(userId);
		onClose();
	};

	return (
		<AdminModal open title="Filter by Owner" onClose={onClose} size="lg">
			<div className={`${filterSearchPanelClass} mb-4`}>
				<input
					placeholder="Search by name, email, or phone"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className={filterSearchInputClass}
				/>
			</div>
			<div className={modalScrollBodyClass}>
				<button
					type="button"
					onClick={() => handleSelect("")}
					className={`${invoicePickerClearOptionClass} mb-3`}
				>
					{clearOptionLabel}
				</button>
				{filteredUsers.length === 0 ? (
					<div className={filterEmptyStateClass}>
						No users match your search.
					</div>
				) : (
					<div className={filterTableWrapClass}>
						<table className="w-full min-w-[48rem] border-collapse bg-neutral-900">
							<thead>
								<tr className={filterTableHeadRowClass}>
									<th className={filterTableHeadCellClass}>Name</th>
									<th className={filterTableHeadCellClass}>Email</th>
									<th className={filterTableHeadCellClass}>Phone</th>
								</tr>
							</thead>
							<tbody className={filterTableBodyClass}>
								{filteredUsers.map((user) => (
									<tr
										key={user.id}
										className={filterSelectableRowClass}
										onClick={() => handleSelect(user.id)}
									>
										<td className="px-4 py-3 font-bold text-white">
											{getUserDisplayName(user)}
										</td>
										<td className="max-w-[16rem] truncate px-4 py-3 text-sm text-neutral-300">
											{user.email}
										</td>
										<td className="px-4 py-3 text-sm text-neutral-300">
											{user.phone_number ?? "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</AdminModal>
	);
}

interface InvoiceBikeFilterModalProps {
	bikes: InvoiceBike[];
	onSelect: (bikeId: string) => void;
	onClose: () => void;
	clearOptionLabel?: string;
}

export function InvoiceBikeFilterModal({
	bikes,
	onSelect,
	onClose,
	clearOptionLabel = "All bikes",
}: InvoiceBikeFilterModalProps) {
	const [searchFilters, setSearchFilters] = useState(getInitialBikeSearchFilters);

	const filteredBikes = useMemo(() => {
		const vinQuery = searchFilters.vin.trim().toLowerCase();
		const plateQuery = searchFilters.plate.trim().toLowerCase();
		const ownerQuery = searchFilters.owner.trim().toLowerCase();
		const yearQuery = searchFilters.year.trim();

		return bikes.filter((bike) => {
			const bikeVin = (bike.vin ?? "").toLowerCase();
			const bikePlate = (bike.license_plate ?? "").toLowerCase();
			const bikeOwner = getBikeOwnerSearchText(bike);
			const bikeYear = String(bike.year);

			if (vinQuery && !bikeVin.includes(vinQuery)) return false;
			if (plateQuery && !bikePlate.includes(plateQuery)) return false;
			if (ownerQuery && !bikeOwner.includes(ownerQuery)) return false;
			if (yearQuery && !bikeYear.includes(yearQuery)) return false;

			return true;
		});
	}, [bikes, searchFilters]);

	const handleSearchChange = (
		field: keyof BikeSearchFilters,
		value: string,
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	const clearSearchFilters = () => {
		setSearchFilters(getInitialBikeSearchFilters());
	};

	const handleSelect = (bikeId: string) => {
		onSelect(bikeId);
		onClose();
	};

	return (
		<AdminModal open title="Filter by Bike" onClose={onClose} size="xl">
			<div className={`${filterSearchPanelClass} mb-4`}>
				<div className="mb-3 flex items-center justify-between">
					<p className="text-xs font-bold uppercase tracking-widest text-neutral-300">
						Search Bikes
					</p>
					<button
						type="button"
						onClick={clearSearchFilters}
						className="text-xs font-bold uppercase tracking-widest text-neutral-300 hover:text-white"
					>
						Clear
					</button>
				</div>
				<div className="grid gap-3 md:grid-cols-4">
					<input
						placeholder="Search VIN"
						value={searchFilters.vin}
						onChange={(e) => handleSearchChange("vin", e.target.value)}
						className={filterSearchInputClass}
					/>
					<input
						placeholder="Search plate"
						value={searchFilters.plate}
						onChange={(e) => handleSearchChange("plate", e.target.value)}
						className={filterSearchInputClass}
					/>
					<input
						placeholder="Search owner"
						value={searchFilters.owner}
						onChange={(e) => handleSearchChange("owner", e.target.value)}
						className={filterSearchInputClass}
					/>
					<input
						placeholder="Search year"
						value={searchFilters.year}
						onChange={(e) => handleSearchChange("year", e.target.value)}
						className={filterSearchInputClass}
					/>
				</div>
			</div>
			<div className={modalScrollBodyClass}>
				<button
					type="button"
					onClick={() => handleSelect("")}
					className={`${invoicePickerClearOptionClass} mb-3`}
				>
					{clearOptionLabel}
				</button>
				{filteredBikes.length === 0 ? (
					<div className={filterEmptyStateClass}>
						No bikes match current filters.
					</div>
				) : (
					<div className={filterTableWrapClass}>
						<table className="w-full min-w-[56rem] border-collapse bg-neutral-900">
							<thead>
								<tr className={filterTableHeadRowClass}>
									<th className={filterTableHeadCellClass}>Bike</th>
									<th className={filterTableHeadCellClass}>Owner</th>
									<th className={filterTableHeadCellClass}>VIN</th>
									<th className={filterTableHeadCellClass}>Plate</th>
								</tr>
							</thead>
							<tbody className={filterTableBodyClass}>
								{filteredBikes.map((bike) => (
									<tr
										key={bike.id}
										className={filterSelectableRowClass}
										onClick={() => handleSelect(bike.id)}
									>
										<td className="px-4 py-3 font-bold text-white">
											{getBikeDisplayLabel(bike)}
										</td>
										<td className="max-w-[14rem] px-4 py-3">
											<p className="text-sm text-neutral-300">
												{getBikeOwnerDisplayName(bike)}
											</p>
											{bike.owner?.email && (
												<p className="truncate text-xs text-neutral-300">
													{bike.owner.email}
												</p>
											)}
										</td>
										<td className="px-4 py-3 text-sm text-neutral-300">
											{bike.vin ?? "—"}
										</td>
										<td className="px-4 py-3 text-sm text-neutral-300">
											{bike.license_plate ?? "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</AdminModal>
	);
}

export function getOwnerFilterButtonLabel(
	selectedUserId: string,
	users: AdminUser[],
): string {
	if (!selectedUserId) return "All owners";
	const user = users.find((entry) => entry.id === selectedUserId);
	return user ? getUserDisplayName(user) : "All owners";
}

export function getBikeFilterButtonLabel(
	selectedBikeId: string,
	bikes: InvoiceBike[],
): string {
	if (!selectedBikeId) return "All bikes";
	const bike = bikes.find((entry) => entry.id === selectedBikeId);
	return bike ? getBikeDisplayLabel(bike) : "All bikes";
}
