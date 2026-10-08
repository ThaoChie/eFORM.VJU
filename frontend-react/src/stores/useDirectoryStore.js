import { create } from "zustand"
import { directoryService } from "../services/directory-service"

export const useDirectoryStore = create((set, get) => ({
  items: [],
  loading: false,
  fetchItems: async (type) => {
    set({ loading: true, items: [] });
    try {
      let data = [];
      if (type === 'departments') {
        data = await directoryService.getDepartments();
      } else if (type === 'offices') {
        data = await directoryService.getOffices();
      } else if (type === 'classes') {
        data = await directoryService.getClasses();
      } else if (type === 'users') {
        data = await directoryService.getUsers();
      }
      set({ items: data, loading: false });
    } catch (e) {
      console.error(e);
      set({ items: [], loading: false });
    }
  }
}))
