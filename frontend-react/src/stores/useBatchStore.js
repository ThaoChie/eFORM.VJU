import { create } from "zustand"
export const useBatchStore = create(() => ({ items: [], loading: false }))
