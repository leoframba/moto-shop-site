import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}


export function TableHead( { className = '', children, ...props }: TableHeadProps ) {
    return (
        <th 
            className={cn(
                'px-4 py-3',
                'text-xs font-bold uppercase tracking-widest text-neutral-300',
                className
            )}
            {...props}
        >
            {children}
        </th>
    )
}

export function TableCell( { className = '', children, ...props }: TableCellProps ) {
    return (
        <td 
            className={cn(
                'px-4 py-3',
                className
            )}
            {...props}
        >
            {children}
        </td>
    )
}
