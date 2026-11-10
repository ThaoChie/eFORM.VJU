import { client } from "../lib/axios/client"

const unwrap = (res) => {
  if (res && typeof res === "object" && "data" in res && !Array.isArray(res)) {
    return res.data
  }
  return res
}

export const semesterService = {
  async getAll() {
    const res = await client.get("/semesters")
    return unwrap(res) || []
  },

  async getById(id) {
    const res = await client.get(`/semesters/${id}`)
    return unwrap(res)
  },

  async create(payload) {
    const res = await client.post("/semesters", payload)
    return unwrap(res)
  },

  async update(id, payload) {
    const res = await client.put(`/semesters/${id}`, payload)
    return unwrap(res)
  },

  async delete(id) {
    const res = await client.delete(`/semesters/${id}`)
    return unwrap(res)
  }
}
