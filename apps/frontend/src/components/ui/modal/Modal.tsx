"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui"
import { AdminButton } from "../AdminButton";
import { RiCloseLargeLine } from "react-icons/ri";


type ModalSize = "sm" | "md" | "lg" | "xl"

interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
}

const DEFAULT_SIZE = "md"
export function Modal({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    size = DEFAULT_SIZE
}: ModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="
                        fixed inset-0 z-50
                        bg-black/60
                    "
                >
                    <Dialog.Content
                        className={`
                            fixed left-1/2 top-1/2 z-50
                            flex flex-col
                            max-h-[calc(100vh-3rem)]
                            w-[calc(100%-2rem)]
                            -translate-x-1/2 -translate-y-1/2
                            rounded-xl 
                            bg-black/70
                            border-neutral-800
                            shadow-xl
                            ${sizeClasses[size]}
                        `}
                    >
                        <header className="flex items-start justify-between gap-4 border-transparent px-6 py-5">
                            <div>
                                <Dialog.Title className="text-xl text-white font-semibold">
                                    {title}
                                </Dialog.Title>

                                <Dialog.Description className="mt-1 text-sm text-gray-500">
                                    {description}
                                </Dialog.Description>
                            </div>

                            <Dialog.Close asChild>
                                <AdminButton
                                    aria-label="Close"
                                    variant="text"
                                    size="lg"
                                    iconLeft=<RiCloseLargeLine />
                                />
                            </Dialog.Close>
                        </header>

                        <div className="overflow-y-auto p-6">
                            {children}
                        </div>

                        {footer && (
                            <footer className="flex justify-end gap-3 border-t px-6 py-4">

                            </footer>
                        )}
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog.Root>
    )
}