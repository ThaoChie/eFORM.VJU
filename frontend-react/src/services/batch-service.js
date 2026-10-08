import { client } from "../lib/axios/client"
export const service = {
  list: async () => (await client.get("/batch", { mockData: [] })).data,
}
