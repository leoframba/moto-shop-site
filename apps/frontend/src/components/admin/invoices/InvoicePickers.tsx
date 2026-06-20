"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	BikeManagerForm,
	getInitialBikeFormData,
	toBikePayload,
} from "@/components/admin/bikes/BikeManagerForm";
import {
	AdminModal,
	MODAL_NESTED_Z_INDEX,
	modalOptionButtonClass,
} from "@/components/admin/modals";
import {
	getInitialPartFormData,
	PartManagerForm,
	toPartPayload,
} from "@/components/admin/parts/PartManagerForm";
import {
	getPartDisplayLabel,
	getPartSaveErrorMessage,
	partMatchesQuery,
} from "@/components/admin/parts/partUtils";
import type {
	AdminUser,
	InvoiceBike,
	InvoiceBikeFormData,
	Part,
	PartFormData,
	Service,
} from "@/types";
import { authApiRequest } from "@/utils/api";
import type { DraftPartLine } from "./invoiceHelpers";
import {
	getBikeDisplayLabel,
	getUserDisplayName,
	toCurrency,
} from "./invoiceHelpers";
import {
	invoiceCreateActionClass,
	invoiceFieldInputClass,
	invoiceFieldInputLgClass,
	invoiceLabelClass,
	invoiceModalSearchInputClass,
	invoicePickerClearOptionClass,
	invoiceSecondaryButtonClass,
} from "./invoiceUi";

const modalScrollBodyClass = "max-h-[55vh] space-y-3 overflow-y-auto pr-1";

const pickerEmptyStateClass =
	"rounded-lg border border-dashed border-neutral-800 bg-neutral-900/20 p-10 text-center text-sm uppercase tracking-widest text-neutral-500";

const pickerTableWrapClass =
	"overflow-x-auto rounded-lg border border-neutral-800";

const pickerTableHeadRowClass =
	"border-b border-neutral-700 bg-neutral-800/60 text-left text-xs font-bold uppercase tracking-widest text-neutral-300";

const pickerTableHeadCellClass = "px-4 py-3";

const pickerTableBodyClass = "divide-y divide-neutral-800";

const pickerSelectableRowClass =
	"cursor-pointer transition-colors hover:bg-neutral-800/60";

const pickerClearOptionClass = invoicePickerClearOptionClass;

interface OwnerPickerModalProps {
	users: AdminUser[];
	onSelect: (ownerId: string) => void;
	onClose: () => void;
}

export function OwnerPickerModal({
	users,
	onSelect,
	onClose,
}: OwnerPickerModalProps) {
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
	}, [users, searchTerm]);

	return (
		<AdminModal open title="Select Owner" onClose={onClose} size="md">
			<input
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				placeholder="Search owner name, email, phone..."
				className={invoiceModalSearchInputClass}
			/>
			<div className={modalScrollBodyClass}>
				<button
					type="button"
					onClick={() => onSelect("")}
					className={pickerClearOptionClass}
				>
					No owner linked
				</button>
				{filteredUsers.length === 0 ? (
					<div className={pickerEmptyStateClass}>
						No users match your search.
					</div>
				) : (
					<div className={pickerTableWrapClass}>
						<table className="w-full border-collapse bg-neutral-900">
							<thead>
								<tr className={pickerTableHeadRowClass}>
									<th className={pickerTableHeadCellClass}>Name</th>
									<th className={pickerTableHeadCellClass}>Phone</th>
								</tr>
							</thead>
							<tbody className={pickerTableBodyClass}>
								{filteredUsers.map((user) => (
									<tr
										key={user.id}
										className={pickerSelectableRowClass}
										onClick={() => onSelect(user.id)}
									>
										<td className="px-4 py-3">
											<p className="font-bold text-white">
												{getUserDisplayName(user)}
											</p>
											<p className="truncate text-xs text-neutral-500">
												{user.email}
											</p>
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

interface BikePickerModalProps {
	bikes: InvoiceBike[];
	users: AdminUser[];
	ownerId: string;
	mechanicNotes: string;
	onSelect: (bikeId: string) => void;
	onBikeCreated: (bike: InvoiceBike) => void;
	onClose: () => void;
}

export function BikePickerModal({
	bikes,
	users,
	ownerId,
	mechanicNotes,
	onSelect,
	onBikeCreated,
	onClose,
}: BikePickerModalProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [isCreateBikeOpen, setIsCreateBikeOpen] = useState(false);
	const [createBikeFormData, setCreateBikeFormData] =
		useState<InvoiceBikeFormData>(getInitialBikeFormData);
	const [isSaving, setIsSaving] = useState(false);

	const openCreateBike = () => {
		setCreateBikeFormData(getInitialBikeFormData(ownerId));
		setIsCreateBikeOpen(true);
	};

	const resetCreateForm = () => {
		setCreateBikeFormData(getInitialBikeFormData(ownerId));
		setIsCreateBikeOpen(false);
	};

	const handleCreateFormChange = (
		field: keyof InvoiceBikeFormData,
		value: string | number,
	) => {
		setCreateBikeFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleCreateSave = async () => {
		if (!createBikeFormData.make.trim() || !createBikeFormData.model.trim()) {
			toast.warning("Make and model are required.");
			return;
		}

		setIsSaving(true);
		try {
			const createdBike = await authApiRequest<InvoiceBike>(
				"/api/admin/bikes",
				{
					method: "POST",
					body: JSON.stringify(toBikePayload(createBikeFormData)),
				},
			);
			onBikeCreated(createdBike);
			toast.success("Bike created.");
			resetCreateForm();
			onSelect(createdBike.id);
		} catch (error) {
			console.error(error);
			toast.error("Failed to create bike.");
		} finally {
			setIsSaving(false);
		}
	};

	const filteredBikes = useMemo(() => {
		const availableBikes = ownerId
			? bikes.filter((bike) => bike.owner_id === ownerId)
			: bikes;
		const query = searchTerm.trim().toLowerCase();
		if (!query) return availableBikes;
		return availableBikes.filter((bike) => {
			const owner = users.find((user) => user.id === bike.owner_id);
			const ownerText = owner
				? `${getUserDisplayName(owner)} ${owner.email}`.toLowerCase()
				: "";
			const bikeText = `${bike.year} ${bike.make} ${bike.model}`.toLowerCase();
			const vin = (bike.vin ?? "").toLowerCase();
			const plate = (bike.license_plate ?? "").toLowerCase();
			return (
				bikeText.includes(query) ||
				vin.includes(query) ||
				plate.includes(query) ||
				ownerText.includes(query)
			);
		});
	}, [bikes, ownerId, searchTerm, users]);

	return (
		<>
			<AdminModal
				open
				title="Select Bike"
				onClose={onClose}
				size="lg"
				closeOnEscape={!isCreateBikeOpen}
				closeOnBackdrop={!isCreateBikeOpen}
			>
				<input
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search bike, VIN, plate, owner..."
					className={invoiceModalSearchInputClass}
				/>
				<div className={modalScrollBodyClass}>
					<button
						type="button"
						onClick={openCreateBike}
						className={invoiceCreateActionClass}
					>
						<p className="font-semibold text-emerald-300">+ Create Bike</p>
						<p className="text-xs text-neutral-400">
							Add a new bike to the catalog — saves to the database.
						</p>
					</button>
					<button
						type="button"
						onClick={() => onSelect("")}
						className={pickerClearOptionClass}
					>
						No bike linked
					</button>
					{filteredBikes.length === 0 ? (
						<div className={pickerEmptyStateClass}>
							No bikes match your search.
						</div>
					) : (
						<div className={pickerTableWrapClass}>
							<table className="w-full border-collapse bg-neutral-900">
								<thead>
									<tr className={pickerTableHeadRowClass}>
										<th className={pickerTableHeadCellClass}>Bike - Vin</th>
										<th className={pickerTableHeadCellClass}>Owner</th>
										<th className={pickerTableHeadCellClass}>Plate</th>
									</tr>
								</thead>
								<tbody className={pickerTableBodyClass}>
									{filteredBikes.map((bike) => {
										const bikeOwner = users.find(
											(user) => user.id === bike.owner_id,
										);
										return (
											<tr
												key={bike.id}
												className={pickerSelectableRowClass}
												onClick={() => onSelect(bike.id)}
											>
												<td className="px-4 py-3">
													<p className="font-bold text-white">
														{getBikeDisplayLabel(bike)}
													</p>
													<p className="truncate text-xs text-neutral-500">
														{bike.vin ? `${bike.vin}` : "No VIN on file"}
													</p>
												</td>
												<td className="px-4 py-3">
													<p className="text-sm text-neutral-300">
														{bikeOwner ? getUserDisplayName(bikeOwner) : "—"}
													</p>
													{bikeOwner?.email && (
														<p className="truncate text-xs text-neutral-500">
															{bikeOwner.email}
														</p>
													)}
												</td>
												<td className="px-4 py-3 text-sm text-neutral-300">
													{bike.license_plate ?? "—"}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</AdminModal>

			{isCreateBikeOpen && (
				<AdminModal
					open
					title="Create Bike"
					onClose={resetCreateForm}
					size="lg"
					zIndex={MODAL_NESTED_Z_INDEX}
					lockBackgroundScroll={false}
				>
					<BikeManagerForm
						formData={createBikeFormData}
						users={users}
						isSaving={isSaving}
						isEditing={false}
						mechanicNotesReference={mechanicNotes}
						onChange={handleCreateFormChange}
						onSave={handleCreateSave}
						onCancel={resetCreateForm}
					/>
				</AdminModal>
			)}
		</>
	);
}

interface ServicePickerModalProps {
	services: Service[];
	onSelect: (serviceId: string) => void;
	onConfirmCustom: (name: string) => boolean;
	onClose: () => void;
}

export function ServicePickerModal({
	services,
	onSelect,
	onConfirmCustom,
	onClose,
}: ServicePickerModalProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [customExpanded, setCustomExpanded] = useState(false);
	const [customName, setCustomName] = useState("");

	const groupedServices = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		const filtered = query
			? services.filter((service) => {
					const name = service.name.toLowerCase();
					const description = (service.description ?? "").toLowerCase();
					const category = (service.categories?.name ?? "").toLowerCase();
					return (
						name.includes(query) ||
						description.includes(query) ||
						category.includes(query)
					);
				})
			: services;

		const groups: Record<string, Service[]> = {};
		for (const service of filtered) {
			const categoryName = service.categories?.name?.trim() || "Uncategorized";
			if (!groups[categoryName]) groups[categoryName] = [];
			groups[categoryName].push(service);
		}

		return Object.keys(groups)
			.sort((a, b) => a.localeCompare(b))
			.map((categoryName) => ({
				categoryName,
				services: groups[categoryName].sort((a, b) =>
					a.name.localeCompare(b.name),
				),
			}));
	}, [services, searchTerm]);

	return (
		<AdminModal open title="Select Service" onClose={onClose} size="lg">
			<input
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				placeholder="Search service name, description, category..."
				className={invoiceModalSearchInputClass}
			/>
			<div className={modalScrollBodyClass}>
				<button
					type="button"
					onClick={() => setCustomExpanded((prev) => !prev)}
					className={invoiceCreateActionClass}
				>
					<p className="font-semibold text-emerald-300">
						{customExpanded ? "- Hide Custom Service" : "+ Custom Service"}
					</p>
					<p className="text-xs text-neutral-400">
						Add a service not found in the database.
					</p>
				</button>
				{customExpanded && (
					<div className="space-y-2 rounded-md border border-emerald-600/30 bg-neutral-800/40 p-3">
						<input
							value={customName}
							onChange={(e) => setCustomName(e.target.value)}
							placeholder="Custom service name"
							className={invoiceFieldInputClass}
						/>
						<button
							type="button"
							onClick={() => onConfirmCustom(customName)}
							className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-emerald-500"
						>
							Confirm Custom Service
						</button>
					</div>
				)}
				{groupedServices.map((group) => (
					<div key={group.categoryName} className="space-y-2">
						<p className="px-1 pt-1 text-xs font-bold uppercase tracking-widest text-neutral-500">
							{group.categoryName}
						</p>
						{group.services.map((service) => (
							<button
								key={service.id}
								type="button"
								onClick={() => onSelect(service.id)}
								className={modalOptionButtonClass}
							>
								<p className="font-semibold text-white">{service.name}</p>
								<p className="text-sm text-neutral-400">
									{service.pricing_type === "hourly"
										? `Hourly (${(service.estimated_hours ?? 1).toFixed(1)} hrs est.)`
										: service.pricing_type === "fixed"
											? `Fixed ${toCurrency(
													Number(
														service.fixed_price ??
															service.calculated_price ??
															0,
													),
												)}`
											: "Contact pricing"}
								</p>
								{service.description && (
									<p className="mt-1 line-clamp-2 text-xs text-neutral-500">
										{service.description}
									</p>
								)}
							</button>
						))}
					</div>
				))}
				{groupedServices.length === 0 && (
					<p className="py-4 text-center text-sm text-neutral-500">
						No services match your search.
					</p>
				)}
			</div>
		</AdminModal>
	);
}

interface PartPickerModalProps {
	parts: Part[];
	partLines: DraftPartLine[];
	activeLineId: string;
	onSelect: (partId: string, partOverride?: Part) => void;
	onConfirmCustom: (name: string) => boolean;
	onPartCreated: (part: Part) => void;
	onClose: () => void;
}

export function PartPickerModal({
	parts,
	partLines,
	activeLineId,
	onSelect,
	onConfirmCustom,
	onPartCreated,
	onClose,
}: PartPickerModalProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [customName, setCustomName] = useState("");
	const [isCreatePartOpen, setIsCreatePartOpen] = useState(false);
	const [isCustomPartOpen, setIsCustomPartOpen] = useState(false);
	const [createPartFormData, setCreatePartFormData] = useState<PartFormData>(
		getInitialPartFormData,
	);
	const [isSaving, setIsSaving] = useState(false);

	const resetCreateForm = () => {
		setCreatePartFormData(getInitialPartFormData());
		setIsCreatePartOpen(false);
	};

	const closeCustomModal = () => {
		setCustomName("");
		setIsCustomPartOpen(false);
	};

	const handleConfirmCustom = () => {
		if (onConfirmCustom(customName)) {
			closeCustomModal();
		}
	};

	const handleFormChange = (
		field: keyof PartFormData,
		value: string | number,
	) => {
		setCreatePartFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		if (!createPartFormData.description.trim()) {
			toast.warning("Description is required.");
			return;
		}

		setIsSaving(true);
		try {
			const createdPart = await authApiRequest<Part>("/api/admin/parts", {
				method: "POST",
				body: JSON.stringify(toPartPayload(createPartFormData)),
			});
			onPartCreated(createdPart);
			toast.success("Part created.");
			resetCreateForm();
			onSelect(createdPart.id, createdPart);
		} catch (error) {
			console.error(error);
			toast.error(getPartSaveErrorMessage(error, "Failed to create part."));
		} finally {
			setIsSaving(false);
		}
	};

	const filteredParts = useMemo(() => {
		const query = searchTerm.trim();
		if (!query) return parts;
		return parts.filter((part) => partMatchesQuery(part, query));
	}, [parts, searchTerm]);

	return (
		<>
			<AdminModal
				open
				title="Select Part"
				onClose={onClose}
				size="lg"
				closeOnEscape={!isCreatePartOpen && !isCustomPartOpen}
				closeOnBackdrop={!isCreatePartOpen && !isCustomPartOpen}
			>
				<input
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search part number or description..."
					className={invoiceModalSearchInputClass}
				/>
				<div className={modalScrollBodyClass}>
					<button
						type="button"
						onClick={() => setIsCreatePartOpen(true)}
						className={invoiceCreateActionClass}
					>
						<p className="font-semibold text-emerald-300">+ Create Part</p>
						<p className="text-xs text-neutral-400">
							Add a new part to the catalog — saves to the database.
						</p>
					</button>
					<button
						type="button"
						onClick={() => setIsCustomPartOpen(true)}
						className={invoiceCreateActionClass}
					>
						<p className="font-semibold text-emerald-300">+ Custom Part</p>
						<p className="text-xs text-neutral-400">
							Add a part not found in the database — doesn't save to the
							database.
						</p>
					</button>
					{filteredParts.map((part) => {
						const alreadyAdded = partLines.some(
							(line) => line.id !== activeLineId && line.part_id === part.id,
						);
						return (
							<button
								key={part.id}
								type="button"
								onClick={() => onSelect(part.id)}
								disabled={alreadyAdded}
								className={`w-full rounded-md border p-3 text-left transition-colors ${
									alreadyAdded
										? "cursor-not-allowed border-neutral-800 bg-neutral-900/50 text-neutral-500"
										: "border-neutral-800 bg-neutral-900 hover:border-emerald-600"
								}`}
							>
								<p className="font-semibold">{getPartDisplayLabel(part)}</p>
								<p className="text-sm text-neutral-400">
									Base price: {toCurrency(Number(part.base_price))}
								</p>
								{alreadyAdded && (
									<p className="mt-1 text-xs text-amber-300">Already added</p>
								)}
							</button>
						);
					})}
					{filteredParts.length === 0 && (
						<p className="py-4 text-center text-sm text-neutral-500">
							No parts match your search.
						</p>
					)}
				</div>
			</AdminModal>

			{isCreatePartOpen && (
				<AdminModal
					open
					title="Create Part"
					onClose={resetCreateForm}
					size="lg"
					zIndex={MODAL_NESTED_Z_INDEX}
					lockBackgroundScroll={false}
				>
					<PartManagerForm
						formData={createPartFormData}
						isSaving={isSaving}
						isEditing={false}
						onChange={handleFormChange}
						onSave={handleSave}
						onCancel={resetCreateForm}
					/>
				</AdminModal>
			)}

			{isCustomPartOpen && (
				<AdminModal
					open
					title="Custom Part"
					onClose={closeCustomModal}
					size="sm"
					zIndex={MODAL_NESTED_Z_INDEX}
					lockBackgroundScroll={false}
				>
					<p className="mb-4 text-sm text-neutral-300">
						Add a one-off part to this invoice only. It will not be saved to the
						parts catalog.
					</p>
					<label htmlFor="custom-part-name" className={invoiceLabelClass}>
						Part name
					</label>
					<input
						id="custom-part-name"
						value={customName}
						onChange={(e) => setCustomName(e.target.value)}
						placeholder="Custom part name"
						className={`mb-4 ${invoiceFieldInputLgClass}`}
					/>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={handleConfirmCustom}
							className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
						>
							Confirm Custom Part
						</button>
						<button
							type="button"
							onClick={closeCustomModal}
							className={invoiceSecondaryButtonClass}
						>
							Cancel
						</button>
					</div>
				</AdminModal>
			)}
		</>
	);
}
