// eslint-disable-next-line no-restricted-imports -- This is the utility file itself
import { clsx, type ClassValue } from "clsx"
// eslint-disable-next-line no-restricted-imports -- This is the utility file itself
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
