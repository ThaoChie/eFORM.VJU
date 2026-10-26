import { create } from "zustand"
import { submissionService, OFFICIAL_DRL_2026_BLOCKS } from "../services/submission-service"

export const useSubmissionStore = create((set, get) => ({
  scores: {},
  proofs: {},
  notes: {},
  details: [],
  semester: null,
  scoreFormId: null,
  status: "DRAFT",
  templateLayout: OFFICIAL_DRL_2026_BLOCKS,
  hasSignature: false,
  savedScores: {},
  loading: false,
  saving: false,
  submitting: false,
  error: null,

  setScore: (code, value) =>
    set((state) => ({
      scores: { ...state.scores, [code]: Number(value) },
    })),

  setProof: (code, url) =>
    set((state) => ({
      proofs: { ...state.proofs, [code]: url },
    })),

  fetchFormData: async (customSemesterId = null) => {
    set({ loading: true, error: null })
    try {
      let activeSemester = get().semester
      if (!activeSemester || customSemesterId) {
        if (customSemesterId) {
          const all = await submissionService.getAllSemesters()
          activeSemester = all?.find((s) => s.id === Number(customSemesterId)) || all?.[0]
        } else {
          activeSemester = await submissionService.getActiveSemester()
        }
      }

      if (!activeSemester) {
        throw new Error("Không tìm thấy học kỳ hoạt động")
      }

      const formRes = await submissionService.getMyForm(activeSemester.id)

      // Parse template layout json if present
      let layout = OFFICIAL_DRL_2026_BLOCKS
      if (formRes?.templateLayoutJson) {
        try {
          const parsed = typeof formRes.templateLayoutJson === "string"
            ? JSON.parse(formRes.templateLayoutJson)
            : formRes.templateLayoutJson
          if (Array.isArray(parsed) && parsed.length > 0) {
            layout = parsed
          }
        } catch (e) {
          console.warn("Failed to parse templateLayoutJson, using official blocks", e)
        }
      }

      // Populate scores and proofs from backend details
      const scores = {}
      const proofs = {}
      const notes = {}
      if (Array.isArray(formRes?.details)) {
        formRes.details.forEach((d) => {
          if (d.criteriaCode) {
            scores[d.criteriaCode] = d.studentScore != null ? Number(d.studentScore) : 0
            if (d.proofUrl) proofs[d.criteriaCode] = d.proofUrl
            if (d.note) notes[d.criteriaCode] = d.note
          }
        })
      }

      set({
        semester: activeSemester,
        scoreFormId: formRes?.scoreFormId || null,
        status: formRes?.status || "DRAFT",
        details: formRes?.details || [],
        templateLayout: layout,
        scores,
        proofs,
        notes,
        savedScores: { ...scores },
        loading: false,
      })
      return formRes
    } catch (err) {
      console.error("fetchFormData error:", err)
      set({ error: err.message || "Lỗi tải biểu mẫu", loading: false })
      throw err
    }
  },

  save: async () => {
    const { semester, details, scores, proofs } = get()
    if (!semester?.id) return

    set({ saving: true })
    try {
      const payloadDetails = (details || []).map((d) => ({
        criteriaId: d.criteriaId,
        studentScore: scores[d.criteriaCode] != null ? Number(scores[d.criteriaCode]) : 0,
        proofUrl: proofs[d.criteriaCode] || d.proofUrl || null,
      }))

      await submissionService.saveDraft({
        semesterId: semester.id,
        details: payloadDetails,
      })

      set({ savedScores: { ...scores }, saving: false })
      return true
    } catch (err) {
      set({ saving: false })
      throw err
    }
  },

  submit: async (signatureBase64 = "CONFIRMED_STUDENT_SIGNATURE") => {
    const { semester, save } = get()
    if (!semester?.id) return

    set({ submitting: true })
    try {
      // First save draft to persist all latest scores
      await save()

      await submissionService.submitAndSign({
        semesterId: semester.id,
        signatureBase64,
      })

      set({ status: "SUBMITTED", submitting: false })
      return true
    } catch (err) {
      set({ submitting: false })
      throw err
    }
  },

  registerSignature: () => set({ hasSignature: true }),
}))
