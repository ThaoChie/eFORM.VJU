import { create } from "zustand"
import { submissionService, OFFICIAL_DRL_2026_BLOCKS } from "../services/submission-service"

export const useSubmissionStore = create((set, get) => ({
  scores: {},
  classScores: {},
  proofs: {}, // { [fieldCode]: Array<{ url, name, type, size }> }
  notes: {},
  details: [],
  semester: null,
  scoreFormId: null,
  status: "DRAFT",
  rejectReason: null,
  rejectedBy: null,
  rejectedAt: null,
  noActiveSemester: false,
  isReadOnly: false,
  isDirty: false,
  lastSavedText: "",
  templateLayout: OFFICIAL_DRL_2026_BLOCKS,
  rankingScale: [
    { rank: "Xuất sắc", minScore: 90, maxScore: 100, color: "text-purple-700 bg-purple-50 border-purple-200" },
    { rank: "Tốt", minScore: 80, maxScore: 89, color: "text-green-700 bg-green-50 border-green-200" },
    { rank: "Khá", minScore: 65, maxScore: 79, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { rank: "Trung bình", minScore: 50, maxScore: 64, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { rank: "Yếu", minScore: 35, maxScore: 49, color: "text-orange-700 bg-orange-50 border-orange-200" },
    { rank: "Kém", minScore: 0, maxScore: 34, color: "text-red-700 bg-red-50 border-red-200" }
  ],
  hasSignature: false,
  studentSignature: null,
  classSignature: null,
  deanSignature: null,
  classLeaderName: null,
  deanName: null,
  loading: false,
  saving: false,
  submitting: false,
  error: null,

  setScore: (code, value) => {
    const num = value === "" ? "" : Number(value)
    set((state) => ({
      scores: { ...state.scores, [code]: num },
      isDirty: true,
    }))
  },

  addProof: (code, proofItem) => {
    set((state) => {
      const current = Array.isArray(state.proofs[code]) ? [...state.proofs[code]] : []
      if (current.length >= 5) return state // max 5 files per criterion
      return {
        proofs: { ...state.proofs, [code]: [...current, proofItem] },
        isDirty: true,
      }
    })
  },

  removeProof: (code, targetIndex) => {
    set((state) => {
      const current = Array.isArray(state.proofs[code]) ? [...state.proofs[code]] : []
      const updated = current.filter((_, idx) => idx !== targetIndex)
      return {
        proofs: { ...state.proofs, [code]: updated },
        isDirty: true,
      }
    })
  },

  setIsDirty: (val) => set({ isDirty: !!val }),

  fetchFormData: async (routeId = null) => {
    set({ loading: true, error: null, noActiveSemester: false })
    try {
      let formRes = null
      let activeSemester = null

      if (routeId) {
        // Try getting by form ID first
        try {
          formRes = await submissionService.getMyFormById(routeId)
        } catch (e) {
          // If not found by form ID, try as semester ID
          formRes = await submissionService.getMyForm(routeId)
        }
      } else {
        // No ID in URL -> Find the currently active evaluation semester
        activeSemester = await submissionService.getActiveSemester()
        if (!activeSemester) {
          set({
            loading: false,
            noActiveSemester: true,
            semester: null,
            scoreFormId: null,
          })
          return null
        }
        formRes = await submissionService.getMyForm(activeSemester.id)
      }

      if (!formRes) {
        throw new Error("Không tìm thấy phiếu rèn luyện")
      }

      // If activeSemester was not retrieved yet, synthesize from formRes
      if (!activeSemester) {
        activeSemester = {
          id: formRes.semesterId,
          semesterName: formRes.semesterName || "Học kỳ đánh giá",
          isActive: true,
        }
      }

      // Parse template layout json if present
      let layout = OFFICIAL_DRL_2026_BLOCKS
      let scale = get().rankingScale
      if (formRes?.templateLayoutJson) {
        try {
          const parsed = typeof formRes.templateLayoutJson === "string"
            ? JSON.parse(formRes.templateLayoutJson)
            : formRes.templateLayoutJson

          if (Array.isArray(parsed) && parsed.length > 0) {
            layout = parsed
          } else if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
              layout = parsed.blocks
            }
            if (Array.isArray(parsed.rankingScale) && parsed.rankingScale.length > 0) {
              scale = parsed.rankingScale
            }
          }
        } catch (e) {
          console.warn("Failed to parse templateLayoutJson, using official blocks", e)
        }
      }

      // Populate scores, classScores, and proofs from backend details
      const scores = {}
      const classScores = {}
      const proofs = {}
      const notes = {}

      if (Array.isArray(formRes?.details)) {
        formRes.details.forEach((d) => {
          if (d.criteriaCode) {
            scores[d.criteriaCode] = d.studentScore != null ? Number(d.studentScore) : ""
            if (d.classScore != null) {
              classScores[d.criteriaCode] = Number(d.classScore)
            }
            if (d.note) notes[d.criteriaCode] = d.note

            // Normalize proof files (supports JSON array or URL string)
            if (d.proofUrl) {
              try {
                const parsed = JSON.parse(d.proofUrl)
                proofs[d.criteriaCode] = Array.isArray(parsed)
                  ? parsed.map((item) => typeof item === "string" ? { url: item, name: item.split("/").pop() || "Minh chứng" } : item)
                  : [{ url: parsed, name: "Minh chứng" }]
              } catch {
                proofs[d.criteriaCode] = d.proofUrl.split(",").map((urlStr) => {
                  const cleanUrl = urlStr.trim()
                  return {
                    url: cleanUrl,
                    name: cleanUrl.split("/").pop() || "Minh chứng",
                  }
                })
              }
            } else {
              proofs[d.criteriaCode] = []
            }
          }
        })
      }

      const formStatus = formRes?.status || "DRAFT"
      const isReadOnly = formStatus !== "DRAFT" && formStatus !== "REJECTED"

      set({
        semester: activeSemester,
        scoreFormId: formRes?.scoreFormId || null,
        status: formStatus,
        rejectReason: formRes?.rejectReason || null,
        rejectedBy: formRes?.rejectedBy || null,
        rejectedAt: formRes?.rejectedAt || null,
        isReadOnly,
        isDirty: false,
        noActiveSemester: false,
        details: formRes?.details || [],
        templateLayout: layout,
        rankingScale: scale,
        scores,
        classScores,
        proofs,
        notes,
        studentSignature: formRes?.studentSignature || null,
        classSignature: formRes?.classSignature || null,
        deanSignature: formRes?.deanSignature || null,
        classLeaderName: formRes?.classLeaderName || null,
        deanName: formRes?.deanName || null,
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
      const { templateLayout } = get()
      const layoutCritCodes = []
      if (Array.isArray(templateLayout)) {
        templateLayout.forEach((g) => {
          if (Array.isArray(g.children)) {
            g.children.forEach((c) => {
              if (c.fieldCode) layoutCritCodes.push(c.fieldCode)
            })
          }
        })
      }

      const detailMap = new Map()
      ;(details || []).forEach((d) => {
        if (d.criteriaCode) detailMap.set(d.criteriaCode, d)
      })

      const codesToSave = new Set([
        ...Object.keys(scores),
        ...layoutCritCodes,
        ...(details || []).map((d) => d.criteriaCode).filter(Boolean),
      ])

      const payloadDetails = []
      codesToSave.forEach((code) => {
        const d = detailMap.get(code)
        const val = scores[code]
        const critProofList = proofs[code] || []
        let proofUrlVal = null
        if (Array.isArray(critProofList) && critProofList.length > 0) {
          proofUrlVal = JSON.stringify(critProofList)
        } else if (typeof critProofList === "string" && critProofList) {
          proofUrlVal = critProofList
        }

        payloadDetails.push({
          criteriaId: d?.criteriaId || null,
          criteriaCode: code,
          studentScore: val !== "" && val != null ? Number(val) : 0,
          proofUrl: proofUrlVal,
        })
      })

      await submissionService.saveDraft({
        semesterId: semester.id,
        details: payloadDetails,
      })

      const now = new Date()
      const timeStr = now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })

      set({
        saving: false,
        isDirty: false,
        lastSavedText: `Đã lưu nháp lúc ${timeStr}`,
      })
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

      set({ status: "SUBMITTED", isReadOnly: true, isDirty: false, submitting: false })
      return true
    } catch (err) {
      set({ submitting: false })
      throw err
    }
  },

  registerSignature: () => set({ hasSignature: true }),
}))
