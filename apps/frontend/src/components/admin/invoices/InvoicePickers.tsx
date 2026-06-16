"use client";

import { useMemo, useState } from "react";
import type { AdminUser, InvoiceBike, Part, Service } from "@/types";
import type { DraftPartLine } from "./invoiceHelpers";
import {
	getBikeDisplayLabel,
	getUserDisplayName,
	toCurrency,
} from "./invoiceHelpers";

const overlayClasses =
	"fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4";
const optionClasses =
	"w-full text-left bg-neutral-900 border border-neutral-800 hover:border-emerald-600 rounded p-3";

interface ModalHeaderProps {
	title: string;
	onClose: () => void;
}

function ModalHeader({ title, onClose }: ModalHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-4">
			<h4 className="text-lg font-bold uppercase tracking-widest text-white">
				{title}
			</h4>
			<button
				type="button"
				onClick={onClose}
				className="text-neutral-400 hover:text-white text-sm font-bold uppercase tracking-widest"
			>
				Close
			</button>
		</div>
	);
}

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
		<div className={overlayClasses}>
			<div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-lg p-5">
				<ModalHeader title="Select Owner" onClose={onClose} />
				<input
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search owner name, email, phone..."
					className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none mb-4"
				/>
				<div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
					<button
						type="button"
						onClick={() => onSelect("")}
						className={optionClasses}
					>
						<p className="text-white font-semibold">No owner linked</p>
					</button>
					{filteredUsers.map((user) => (
						<button
							key={user.id}
							type="button"
							onClick={() => onSelect(user.id)}
							className={optionClasses}
						>
							<p className="text-white font-semibold">
								{getUserDisplayName(user)}
							</p>
							<p className="text-sm text-neutral-400">{user.email}</p>
							<p className="text-xs text-neutral-500">
								{user.phone_number || "No phone on file"}
							</p>
						</button>
					))}
					{filteredUsers.length === 0 && (
						<p className="text-neutral-500 text-sm text-center py-4">
							No users match your search.
						</p>
					)}
				</div>
			</div>
		</div>
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
		<div className={overlayClasses}>
			<div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-lg p-5">
				<ModalHeader title="Select Bike" onClose={onClose} />
				<input
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search bike, VIN, plate, owner..."
					className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none mb-4"
				/>
				<div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
					<button
						type="button"
						onClick={() => onSelect("")}
						className={optionClasses}
					>
						<p className="text-white font-semibold">No bike linked</p>
					</button>
					{filteredBikes.map((bike) => {
						const bikeOwner = users.find((user) => user.id === bike.owner_id);
						return (
							<button
								key={bike.id}
								type="button"
								onClick={() => onSelect(bike.id)}
								className={optionClasses}
							>
								<p className="text-white font-semibold">
									{getBikeDisplayLabel(bike)}
								</p>
								<p className="text-sm text-neutral-400">
									VIN: {bike.vin || "N/A"} | Plate:{" "}
									{bike.license_plate || "N/A"}
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
						<p className="text-neutral-500 text-sm text-center py-4">
							No bikes match your search.
						</p>
					)}
				</div>
			</div>
		</div>
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
		<div className={overlayClasses}>
			<div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-lg p-5">
				<ModalHeader title="Select Service" onClose={onClose} />
				<input
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search service name, description, category..."
					className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none mb-4"
				/>
				<div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
					<button
						type="button"
						onClick={() => setCustomExpanded((prev) => !prev)}
						className="w-full text-left bg-neutral-900 border border-emerald-700/60 hover:border-emerald-500 rounded p-3"
					>
						<p className="text-emerald-300 font-semibold">
							{customExpanded ? "- Hide Custom Service" : "+ Custom Service"}
						</p>
						<p className="text-xs text-neutral-400">
							Add a service not found in the database.
						</p>
					</button>
					{customExpanded && (
						<div className="bg-neutral-900 border border-emerald-700/40 rounded p-3 space-y-2">
							<input
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								placeholder="Custom service name"
								className="w-full bg-neutral-950 border border-neutral-700 rounded p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
							/>
							<button
								type="button"
								onClick={() => onConfirmCustom(customName)}
								className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded"
							>
								Confirm Custom Service
							</button>
						</div>
					)}
					{groupedServices.map((group) => (
						<div key={group.categoryName} className="space-y-2">
							<p className="text-xs uppercase tracking-widest text-neutral-500 font-bold px-1 pt-1">
								{group.categoryName}
							</p>
							{group.services.map((service) => (
								<button
									key={service.id}
									type="button"
									onClick={() => onSelect(service.id)}
									className={optionClasses}
								>
									<p className="text-white font-semibold">{service.name}</p>
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
										<p className="text-xs text-neutral-500 mt-1 line-clamp-2">
											{service.description}
										</p>
									)}
								</button>
							))}
						</div>
					))}
					{groupedServices.length === 0 && (
						<p className="text-neutral-500 text-sm text-center py-4">
							No services match your search.
						</p>
					)}
				</div>
			</div>
		</div>
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
		<div className={overlayClasses}>
			<div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-lg p-5">
				<ModalHeader title="Select Part" onClose={onClose} />
				<input
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search part number or description..."
					className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none mb-4"
				/>
				<div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
					<button
						type="button"
						onClick={() => setCustomExpanded((prev) => !prev)}
						className="w-full text-left bg-neutral-900 border border-emerald-700/60 hover:border-emerald-500 rounded p-3"
					>
						<p className="text-emerald-300 font-semibold">
							{customExpanded ? "- Hide Custom Part" : "+ Custom Part"}
						</p>
						<p className="text-xs text-neutral-400">
							Add a part not found in the database.
						</p>
					</button>
					{customExpanded && (
						<div className="bg-neutral-900 border border-emerald-700/40 rounded p-3 space-y-2">
							<input
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								placeholder="Custom part name"
								className="w-full bg-neutral-950 border border-neutral-700 rounded p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
							/>
							<button
								type="button"
								onClick={() => onConfirmCustom(customName)}
								className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded"
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
								className={`w-full text-left border rounded p-3 transition-colors ${
									alreadyAdded
										? "bg-neutral-900/50 border-neutral-800 text-neutral-500 cursor-not-allowed"
										: "bg-neutral-900 border-neutral-800 hover:border-emerald-600"
								}`}
							>
								<p className="font-semibold">
									{part.part_number} - {part.description}
								</p>
								<p className="text-sm text-neutral-400">
									Base price: {toCurrency(Number(part.base_price))}
								</p>
								{alreadyAdded && (
									<p className="text-xs text-amber-300 mt-1">Already added</p>
								)}
							</button>
						);
					})}
					{filteredParts.length === 0 && (
						<p className="text-neutral-500 text-sm text-center py-4">
							No parts match your search.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
