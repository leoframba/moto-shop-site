"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaCheck, FaMicrophone, FaPause, FaPlay } from "react-icons/fa";
import { toast } from "sonner";
import { formatTime } from "@/utils/helper";

interface VoiceRecorderPanelProps {
	onRecordingComplete: (base64Audio: string, mimeType: string) => void;
	onSaved?: () => void;
	onRecordingChange?: (isRecording: boolean) => void;
	onDiscardRef?: (discard: () => void) => void;
}

function getSupportedRecordingMimeType(): string {
	const candidates = [
		"audio/mp4",
		"audio/ogg;codecs=opus",
		"audio/webm;codecs=opus",
		"audio/webm",
	];
	return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function VoiceRecorderPanel({
	onRecordingComplete,
	onSaved,
	onRecordingChange,
	onDiscardRef,
}: VoiceRecorderPanelProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const clearTimer = () => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	};

	const setRecordingActive = (active: boolean) => {
		setIsRecording(active);
		onRecordingChange?.(active);
	};

	const cleanupStream = () => {
		streamRef.current?.getTracks().forEach((track) => {
			track.stop();
		});
		streamRef.current = null;
	};

	const startRecording = async () => {
		chunksRef.current = [];
		setAudioUrl(null);
		setRecordingTime(0);

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			const preferredMimeType = getSupportedRecordingMimeType();
			const mediaRecorder = preferredMimeType
				? new MediaRecorder(stream, { mimeType: preferredMimeType })
				: new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;

			const mimeType =
				mediaRecorder.mimeType || preferredMimeType || "audio/webm";
			const safeMimeType = mimeType || "audio/webm";

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(chunksRef.current, { type: safeMimeType });
				const url = URL.createObjectURL(audioBlob);
				setAudioUrl(url);

				const reader = new FileReader();
				reader.readAsDataURL(audioBlob);
				reader.onloadend = () => {
					const base64String = reader.result as string;
					const base64Data = base64String.split(",")[1];
					onRecordingComplete(base64Data, safeMimeType);
					onSaved?.();
				};

				cleanupStream();
			};

			mediaRecorder.start(250);
			setRecordingActive(true);
			setIsPaused(false);

			timerRef.current = setInterval(() => {
				setRecordingTime((prev) => prev + 1);
			}, 1000);
		} catch (error) {
			console.error("Error starting recording:", error);
			toast.error("Failed to start recording.");
		}
	};

	const pauseRecording = () => {
		if (mediaRecorderRef.current && isRecording && !isPaused) {
			mediaRecorderRef.current.pause();
			setIsPaused(true);
			clearTimer();
		}
	};

	const resumeRecording = () => {
		if (mediaRecorderRef.current && isPaused) {
			mediaRecorderRef.current.resume();
			setIsPaused(false);
			timerRef.current = setInterval(() => {
				setRecordingTime((prev) => prev + 1);
			}, 1000);
		}
	};

	const saveRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setRecordingActive(false);
			setIsPaused(false);
			clearTimer();
			toast.success("Voice note saved.");
		}
	};

	const discardRecording = () => {
		clearTimer();
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.onstop = null;
			if (mediaRecorderRef.current.state !== "inactive") {
				mediaRecorderRef.current.stop();
			}
		}
		mediaRecorderRef.current = null;
		chunksRef.current = [];
		cleanupStream();
		setRecordingActive(false);
		setIsPaused(false);
	};

	useEffect(() => {
		onDiscardRef?.(discardRecording);
	});

	const handlePrimaryAction = () => {
		if (!isRecording) {
			void startRecording();
			return;
		}

		if (isPaused) {
			resumeRecording();
			return;
		}

		pauseRecording();
	};

	const handleRecordAgain = () => {
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
		}
		setAudioUrl(null);
		setRecordingTime(0);
		setRecordingActive(false);
		setIsPaused(false);
	};

	const primaryLabel = !isRecording
		? "Tap to Record"
		: isPaused
			? "Tap to Resume"
			: "Tap to Pause";

	return (
		<div className="flex w-full flex-col items-center">
			<div className="mb-5 text-center">
				<div className="font-mono text-4xl font-bold text-emerald-400 sm:text-5xl">
					{formatTime(recordingTime)}
				</div>
				<p className="mt-2 text-sm text-neutral-300">
					{!isRecording && !audioUrl && "Ready to record"}
					{isRecording && !isPaused && "Recording…"}
					{isRecording && isPaused && "Paused"}
					{!isRecording && audioUrl && "Saved — review below"}
				</p>
			</div>

			<button
				type="button"
				onClick={handlePrimaryAction}
				disabled={Boolean(audioUrl) && !isRecording}
				className="mb-3 flex min-h-24 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-emerald-600/40 bg-emerald-600/10 px-6 py-5 text-emerald-400 transition-colors hover:bg-emerald-600/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{!isRecording ? (
					<FaMicrophone className="text-5xl" aria-hidden />
				) : isPaused ? (
					<FaPlay className="text-5xl" aria-hidden />
				) : (
					<FaPause className="text-5xl" aria-hidden />
				)}
				<span className="text-base font-bold uppercase tracking-widest">
					{primaryLabel}
				</span>
			</button>

			{isRecording && (
				<button
					type="button"
					onClick={saveRecording}
					className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-500 active:scale-[0.98]"
				>
					<FaCheck className="text-xl" aria-hidden />
					Save Recording
				</button>
			)}

			{audioUrl && !isRecording && (
				<div className="mt-4 w-full border-t border-neutral-800 pt-4">
					<p className="mb-2 text-xs font-medium text-neutral-300">
						Review recording:
					</p>
					{/* biome-ignore lint/a11y/useMediaCaption: user-recorded voice note, no captions source */}
					<audio
						src={audioUrl}
						controls
						aria-label="Voice note playback"
						className="mb-4 h-12 w-full accent-emerald-500"
					/>
					<button
						type="button"
						onClick={handleRecordAgain}
						className="flex min-h-14 w-full items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-bold uppercase tracking-widest text-neutral-200 transition-colors hover:bg-neutral-700"
					>
						Record Again
					</button>
				</div>
			)}
		</div>
	);
}

interface VoiceRecorderProps {
	onRecordingComplete: (base64Audio: string, mimeType: string) => void;
	buttonLabel?: string;
	className?: string;
	disabled?: boolean;
}

export default function VoiceRecorder({
	onRecordingComplete,
	buttonLabel = "Voice Note",
	className = "",
	disabled = false,
}: VoiceRecorderProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const discardRecordingRef = useRef<(() => void) | null>(null);

	const closeModal = useCallback(() => {
		if (isRecording) {
			const confirmed = window.confirm(
				"Recording in progress. Discard it and close?",
			);
			if (!confirmed) return;
			discardRecordingRef.current?.();
		}
		setIsOpen(false);
		setIsRecording(false);
	}, [isRecording]);

	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeModal();
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, closeModal]);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				disabled={disabled}
				className={
					className ||
					"inline-flex min-h-11 w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-md bg-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
				}
			>
				<FaMicrophone className="h-4 w-4 shrink-0" aria-hidden />
				{buttonLabel}
			</button>

			{isOpen && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
					<button
						type="button"
						aria-label="Close voice recorder"
						className="absolute inset-0 bg-black/70 backdrop-blur-sm"
						onClick={closeModal}
					/>
					<div
						className="relative w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg sm:p-6"
						role="dialog"
						aria-modal="true"
						aria-labelledby="voice-recorder-title"
					>
						<div className="mb-4 flex items-center justify-between">
							<h3
								id="voice-recorder-title"
								className="text-lg font-bold uppercase tracking-widest text-white"
							>
								Mechanic Voice Notes
							</h3>
							<button
								type="button"
								onClick={closeModal}
								className="text-sm font-bold uppercase tracking-widest text-neutral-300 transition-colors hover:text-white"
							>
								Close
							</button>
						</div>

						<VoiceRecorderPanel
							onRecordingComplete={onRecordingComplete}
							onSaved={() => setIsOpen(false)}
							onRecordingChange={setIsRecording}
							onDiscardRef={(discard) => {
								discardRecordingRef.current = discard;
							}}
						/>
					</div>
				</div>
			)}
		</>
	);
}
