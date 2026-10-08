import { client } from "../lib/axios/client"

export const directoryService = {
  getDepartments: async () => {
    return await client.get("/departments");
  },
  getOffices: async () => {
    // Return mock since there is no endpoint yet
    return []; 
  },
  getClasses: async () => {
    return await client.get("/classes");
  },
  getUsers: async (params) => {
    return await client.get("/directory/users", { params });
  },
  getDeans: async () => {
    return await client.get("/directory/users?role=DEAN");
  },
  importClasses: async (file, preview = true) => {
    const formData = new FormData();
    formData.append("file", file);
    return await client.post(`/classes/import?preview=${preview}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importDepartments: async (file, preview = true) => {
    const formData = new FormData();
    formData.append("file", file);
    return await client.post(`/departments/import?preview=${preview}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}
