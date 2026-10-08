import { create } from "zustand"
import { submissionService } from "../services/submission-service"

export const useSubmissionStore = create((set) => ({
  scores: {},
  status: "Soạn thảo",
  hasSignature: false,
  savedScores: {},
  setScore: (code, value) =>
    set((state) => ({ scores: { ...state.scores, [code]: value } })),
  save: async () => {
    const scores = useSubmissionStore.getState().scores
    await submissionService.save(scores)
    set({ savedScores: scores })
  },
  submit: () => set({ status: "Chờ lớp duyệt" }),
  registerSignature: () => set({ hasSignature: true }),
}))
