import { client } from "../lib/axios/client"

export const formService = {
  getTemplates: async () => {
    return await client.get("/forms/templates");
  },
  getTemplateById: async (id) => {
    return await client.get(`/forms/templates/${id}`);
  },
  getTemplateVersions: async (id) => {
    return await client.get(`/forms/templates/${id}/versions`);
  },
  checkDeactivate: async (id) => {
    return await client.get(`/forms/templates/${id}/check-deactivate`);
  },
  createTemplate: async (data) => {
    return await client.post("/forms/templates", data);
  },
  updateTemplate: async (id, data) => {
    return await client.put(`/forms/templates/${id}`, data);
  },
  activateTemplate: async (id, reason) => {
    return await client.patch(`/forms/templates/${id}/activate`, { reason });
  },
  deactivateTemplate: async (id, reason) => {
    return await client.patch(`/forms/templates/${id}/deactivate`, { reason });
  },
}

export const service = formService
