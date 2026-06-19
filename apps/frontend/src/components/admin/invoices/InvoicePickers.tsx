"use client";

import { useMemo, useState } from "react";
import { AdminModal, modalOptionButtonClass } from "@/components/admin/modals";
import type { AdminUser, InvoiceBike, Part, Service } from "@/types";
import type { DraftPartLine } from "./invoiceHelpers";
import {
	getBikeDisplayLabel,
	getUserDisplayName,
	toCurrency,
} from "./invoiceHelpers";

const modalSearchInputClass =
	"mb-4 w-full rounded-md border border-neutral-700 bg-neutral-900 p-3 text-white outline-none focus:border-emerald-500";

const modalScrollBodyClass = "max-h-[55vh] space-y-2 overflow-y-auto pr-1";

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
				className={modalSearchInputClass}
			/>
			<div className={modalScrollBodyClass}>
				<button
					type="button"
					onClick={() => onSelect("")}
					className={modalOptionButtonClass}
				>
					<p className="font-semibold text-white">No owner linked</p>
				</button>
				{filteredUsers.map((user) => (
					<button
						key={user.id}
						type="button"
						onClick={() => onSelect(user.id)}
						className={modalOptionButtonClass}
					>
						<p className="font-semibold text-white">
							{getUserDisplayName(user)}
						</p>
						<p className="text-sm text-neutral-400">{user.email}</p>
						<p className="text-xs text-neutral-500">
							{user.phone_number || "No phone on file"}
						</p>
					</button>
				))}
				{filteredUsers.length === 0 && (
					<p className="py-4 text-center text-sm text-neutral-500">
						No users match your search.
					</p>
				)}
			</div>
		</AdminModal>
	);
}

interface BikePickerModalProps {
	bikes: InvoiceBike[];
	users: AdminUser[];
	ownerId: string;
	onSelect: (bikeId: string) => void;
	onClose: () => void;
}

export function BikePickerModal({
	bikes,
	users,
	ownerId,
	onSelect,
	onClose,
}: BikePickerModalProps) {
	const [searchTerm, setSearchTerm] = useState("");

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
		<AdminModal open title="Select Bike" onClose={onClose} size="lg">
			<input
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				placeholder="Search bike, VIN, plate, owner..."
				className={modalSearchInputClass}
			/>
			<div className={modalScrollBodyClass}>
				<button
					type="button"
					onClick={() => onSelect("")}
					className={modalOptionButtonClass}
				>
					<p className="font-semibold text-white">No bike linked</p>
				</button>
				{filteredBikes.map((bike) => {
					const bikeOwner = users.find((user) => user.id === bike.owner_id);
					return (
						<button
							key={bike.id}
							type="button"
							onClick={() => onSelect(bike.id)}
							className={modalOptionButtonClass}
						>
							<p className="font-semibold text-white">
								{getBikeDisplayLabel(bike)}
							</p>
							<p className="text-sm text-neutral-400">
								VIN: {bike.vin || "N/A"} | Plate: {bike.license_plate || "N/A"}
							</p>
							<p className="text-xs text-neutral-500">
								Owner:{" "}
								{bikeOwner
									? `${getUserDisplayName(bikeOwner)} (${bikeOwner.email})`
									: "Unlinked"}
							</p>
						</button>
					);
				})}
				{filteredBikes.length === 0 && (
					<p className="py-4 text-center text-sm text-neutral-500">
						No bikes match your search.
					</p>
				)}
			</div>
		</AdminModal>
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
				className={modalSearchInputClass}
			/>
			<div className={modalScrollBodyClass}>
				<button
					type="button"
					onClick={() => setCustomExpanded((prev) => !prev)}
					className="w-full rounded-md border border-emerald-700/60 bg-neutral-900 p-3 text-left transition-colors hover:border-emerald-500"
				>
					<p className="font-semibold text-emerald-300">
						{customExpanded ? "- Hide Custom Service" : "+ Custom Service"}
					</p>
					<p className="text-xs text-neutral-400">
						Add a service not found in the database.
					</p>
				</button>
				{customExpanded && (
					<div className="space-y-2 rounded-md border border-emerald-700/40 bg-neutral-900 p-3">
						<input
							value={customName}
							onChange={(e) => setCustomName(e.target.value)}
							placeholder="Custom service name"
							className="w-full rounded-md border border-neutral-700 bg-neutral-950 p-2.5 text-sm text-white outline-none focus:border-emerald-500"
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
	onSelect: (partId: string) => void;
	onConfirmCustom: (name: string) => boolean;
	onClose: () => void;
}

export function PartPickerModal({
	parts,
	partLines,
	activeLineId,
	onSelect,
	onConfirmCustom,
	onClose,
}: PartPickerModalProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [customExpanded, setCustomExpanded] = useState(false);
	const [customName, setCustomName] = useState("");

	const filteredParts = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return parts;
		return parts.filter((part) => {
			const number = part.part_number.toLowerCase();
			const description = part.description.toLowerCase();
			return number.includes(query) || description.includes(query);
		});
	}, [parts, searchTerm]);

	return (
		<AdminModal open title="Select Part" onClose={onClose} size="lg">
			<input
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				placeholder="Search part number or description..."
				className={modalSearchInputClass}
			/>
			<div className={modalScrollBodyClass}>
				<button
					type="button"
					onClick={() => setCustomExpanded((prev) => !prev)}
					className="w-full rounded-md border border-emerald-700/60 bg-neutral-900 p-3 text-left transition-colors hover:border-emerald-500"
				>
					<p className="font-semibold text-emerald-300">
						{customExpanded ? "- Hide Custom Part" : "+ Custom Part"}
					</p>
					<p className="text-xs text-neutral-400">
						Add a part not found in the database.
					</p>
				</button>
				{customExpanded && (
					<div className="space-y-2 rounded-md border border-emerald-700/40 bg-neutral-900 p-3">
						<input
							value={customName}
							onChange={(e) => setCustomName(e.target.value)}
							placeholder="Custom part name"
							className="w-full rounded-md border border-neutral-700 bg-neutral-950 p-2.5 text-sm text-white outline-none focus:border-emerald-500"
						/>
						<button
							type="button"
							onClick={() => onConfirmCustom(customName)}
							className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-emerald-500"
						>
							Confirm Custom Part
						</button>
					</div>
				)}
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
							<p className="font-semibold">
								{part.part_number} - {part.description}
							</p>
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
	);
}
