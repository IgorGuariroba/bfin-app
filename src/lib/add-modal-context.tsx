"use client";

import { createContext, useContext, useState } from "react";

type AddModalCtx = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AddModalContext = createContext<AddModalCtx>({ open: false, setOpen: () => {} });

export function AddModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <AddModalContext.Provider value={{ open, setOpen }}>{children}</AddModalContext.Provider>;
}

export const useAddModal = () => useContext(AddModalContext);
