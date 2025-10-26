import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import copy from "copy-to-clipboard";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function copyToClipboard(content: string) {
  copy(content);
}
