import { create } from "zustand"
export const useReportStore = create(() => ({ items: [], loading: false }))
