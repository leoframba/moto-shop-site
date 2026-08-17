import clsx from "clsx"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant =
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "text"

type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    size?: ButtonSize
    iconLeft?: ReactNode
    iconRight?: ReactNode
    isLoading?: boolean
    fullWidth?: boolean
};

export function AdminButton({
    children,
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    isLoading = false,
    fullWidth = false,
    disabled,
    className,
    type = "button",
    ...props

}: ButtonProps) {
    const base = "inline-flex items-center justify-center gap-2 rounded font-bold transition-colors focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"

    const variants: Record<ButtonVariant, string> = {
        primary: "bg-emerald-700 text-white hover:bg-emerald-600 focus:ring-emerald-500",
        secondary: "bg-neutral-800 text-white hover:bg-neutral-700 focus:ring-gray-400",
        danger: "bg-red-900/60 text-white hover:bg-red-800/70 focus:ring-red-700",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
        text: "bg-transparent"
    }

    const sizes: Record<ButtonSize, string> = {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
    };

    const iconSizes: Record<ButtonSize, string> = {
        sm: "size-3",
        md: "size-4",
        lg: "size-6",
    };

    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            className={clsx(
                base,
                variants[variant],
                sizes[size],
                fullWidth && "w-full",
                className
            )}
            {...props}
        >
            {isLoading ? (
                "Loading..."
            ) : (
                <>
                    {iconLeft && (
                        <span className={clsx("shrink-0 [&_svg]:size-full", iconSizes[size])}>
                            {iconLeft}
                        </span>
                    )}
                    {children}
                    {iconRight && (
                        <span className={clsx("shrink-0 &_svg]:size-full", iconSizes[size])}>
                            {iconRight}
                        </span>
                    )}
                </>
            )}
        </button>
    );
}
