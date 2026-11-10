import { create } from "zustand"
import { directoryService } from "../services/directory-service"

export const useDirectoryStore = create((set, get) => ({
  items: [],
  currentType: null,
  loading: false,
  fetchItems: async (type) => {
    const isSameType = get().currentType === type && get().items.length > 0;
    set(isSameType ? { loading: true } : { loading: true, items: [], currentType: type });
    try {
      let data = [];
      if (type === 'departments') {
        data = await directoryService.getDepartments();
      } else if (type === 'majors') {
        data = await directoryService.getMajors();
      } else if (type === 'offices') {
        data = await directoryService.getOffices();
      } else if (type === 'classes') {
        data = await directoryService.getClasses();
      } else if (type === 'users') {
        data = await directoryService.getUsers();
      }
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0))
        : [];
      set({ items: sorted, currentType: type, loading: false });
    } catch (e) {
      console.error(e);
      set({ items: [], loading: false });
    }
  }
}))
