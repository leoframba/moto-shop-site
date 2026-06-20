"use client";

import { type InputHTMLAttributes, useCallback, useRef } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

type NumberStepperSize = "default" | "compact";

export interface NumberStepperInputProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
	inputClassName?: string;
	size?: NumberStepperSize;
}

function parseStep(step: InputHTMLAttributes<HTMLInputElement>["step"]) {
	const stepNum =
		typeof step === "number" ? step : parseFloat(String(step ?? 1));
	return Number.isFinite(stepNum) && stepNum > 0 ? stepNum : 1;
}

function decimalPlaces(value: number) {
	const fraction = String(value).split(".")[1];
	return fraction?.length ?? 0;
}

function clampValue(
	value: number,
	min: InputHTMLAttributes<HTMLInputElement>["min"],
	max: InputHTMLAttributes<HTMLInputElement>["max"],
) {
	let next = value;
	if (min !== undefined && min !== "") {
		next = Math.max(Number(min), next);
	}
	if (max !== undefined && max !== "") {
		next = Math.min(Number(max), next);
	}
	return next;
}

function formatSteppedValue(value: number, step: number) {
	const precision = decimalPlaces(step);
	return precision > 0 ? value.toFixed(precision) : String(value);
}

export function NumberStepperInput({
	className = "",
	inputClassName = "",
	size = "default",
	readOnly,
	disabled,
	min,
	max,
	step,
	onChange,
	...props
}: NumberStepperInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const showStepper = !readOnly && !disabled;
	const buttonWidthClass = size === "compact" ? "w-6" : "w-8";
	const iconClass = size === "compact" ? "h-3 w-3" : "h-3.5 w-3.5";
	const fieldPaddingClass = showStepper
		? size === "compact"
			? "pr-7"
			: "pr-9"
		: "";

	const stepValue = useCallback(
		(direction: 1 | -1) => {
			const input = inputRef.current;
			if (!input || readOnly || disabled) return;

			const stepNum = parseStep(step);
			const current = parseFloat(input.value);
			const base = Number.isFinite(current) ? current : 0;
			const next = clampValue(base + direction * stepNum, min, max);
			const nextValue = formatSteppedValue(next, stepNum);

			const valueSetter = Object.getOwnPropertyDescriptor(
				HTMLInputElement.prototype,
				"value",
			)?.set;
			valueSetter?.call(input, nextValue);
			input.dispatchEvent(new Event("input", { bubbles: true }));
			input.dispatchEvent(new Event("change", { bubbles: true }));
		},
		[disabled, max, min, readOnly, step],
	);

	const stepperButtonClass = [
		"flex flex-1 items-center justify-center",
		buttonWidthClass,
		"text-neutral-300 transition-colors",
		"hover:bg-neutral-700 hover:text-emerald-300",
		"active:bg-neutral-600 active:text-emerald-200",
		"disabled:pointer-events-none disabled:opacity-40",
	].join(" ");

	return (
		<div
			className={`relative w-full overflow-hidden rounded-md ${className}`.trim()}
		>
			<input
				ref={inputRef}
				type="number"
				readOnly={readOnly}
				disabled={disabled}
				min={min}
				max={max}
				step={step}
				onChange={onChange}
				className={`number-stepper-field ${fieldPaddingClass} ${inputClassName}`.trim()}
				{...props}
			/>
			{showStepper ? (
				<div
					className={`absolute inset-y-0 right-0 flex flex-col border-l border-neutral-600 bg-neutral-900/80 ${buttonWidthClass}`}
				>
					<button
						type="button"
						tabIndex={-1}
						aria-label="Increase value"
						onClick={() => stepValue(1)}
						className={`${stepperButtonClass} border-b border-neutral-600/80`}
					>
						<FiChevronUp className={iconClass} aria-hidden />
					</button>
					<button
						type="button"
						tabIndex={-1}
						aria-label="Decrease value"
						onClick={() => stepValue(-1)}
						className={stepperButtonClass}
					>
						<FiChevronDown className={iconClass} aria-hidden />
					</button>
				</div>
			) : null}
		</div>
	);
}
