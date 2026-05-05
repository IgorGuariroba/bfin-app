import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmt = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

export const fmtK = (val: number) => {
  if (Math.abs(val) >= 1000) {
    return (val / 1000).toFixed(1).replace(".", ",") + "k";
  }
  return val.toString();
};

export const fmtH = (val: number) => {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
