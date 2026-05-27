import { type ClassNameValue, twJoin, twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassNameValue[]) => twMerge(twJoin(...inputs));
