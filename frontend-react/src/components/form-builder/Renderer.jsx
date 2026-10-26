import React, { useState, useMemo } from "react"
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Award,
  Signature,
  Users,
  UserCheck,
  Eye,
  Sparkles,
  Code2,
  Copy,
  Check,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  ExternalLink
} from "lucide-react"

export default function Renderer({
  layout = {},
  rankingScale = [
    { rank: "Xuất sắc", minScore: 90, maxScore: 100, color: "text-purple-700 bg-purple-50 border-purple-200" },
    { rank: "Tốt", minScore: 80, maxScore: 89, color: "text-green-700 bg-green-50 border-green-200" },
    { rank: "Khá", minScore: 65, maxScore: 79, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { rank: "Trung bình", minScore: 50, maxScore: 64, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { rank: "Yếu", minScore: 35, maxScore: 49, color: "text-orange-700 bg-orange-50 border-orange-200" },
    { rank: "Kém", minScore: 0, maxScore: 34, color: "text-red-700 bg-red-50 border-red-200" }
  ],
  isInteractive = true,
  defaultRole = "ALL" // "ALL" | "STUDENT" | "CLASS_LEADER"
}) {
  const blocks = layout.blocks || []
  const formName = layout.formName || "Phiếu Đánh giá Điểm Rèn luyện Sinh viên"
  const formCode = layout.formCode || "DRL-2026"
  const semesterName = layout.semesterName || "Học kỳ 1 Năm 2026-2027"

  // Perspective / Workflow: "STUDENT" (SV chấm) | "CLASS_LEADER" (Lớp thẩm định) | "ALL" (Bảng đối chiếu 2 cột / Phôi in)
  const [activeRole, setActiveRole] = useState(defaultRole)

  // JSON DỮ LIỆU 1: Sinh viên tự đánh giá
  const [studentScores, setStudentScores] = useState({})
  const [proofs, setProofs] = useState({})
  const [studentSignature, setStudentSignature] = useState("Nguyễn Văn An")

  // JSON DỮ LIỆU 2: Ban cán sự lớp đánh giá
  const [classScores, setClassScores] = useState({})
  const [classNotes, setClassNotes] = useState({})
  const [classSignature, setClassSignature] = useState("Trần Thị Mai (Lớp trưởng)")

  // Chữ ký cấp 3: GVCN / Lãnh đạo Khoa
  const [deanSignature, setDeanSignature] = useState("TS. Hoàng Đình Phúc (Phó Hiệu trưởng)")

  // Modal xem 2 JSON độc lập (Data Inspector)
  const [showJsonModal, setShowJsonModal] = useState(false)
  const [activeJsonTab, setActiveJsonTab] = useState("STUDENT") // "STUDENT" | "CLASS" | "MAPPING"
  const [copiedTab, setCopiedTab] = useState(null)

  const handleStudentScoreChange = (blockId, maxScore, val) => {
    let num = Number(val);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxScore) num = maxScore;
    setStudentScores((prev) => ({ ...prev, [blockId]: num }));
  };

  const handleClassScoreChange = (blockId, maxScore, val) => {
    let num = Number(val);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxScore) num = maxScore;
    setClassScores((prev) => ({ ...prev, [blockId]: num }));
  };

  const handleClassNoteChange = (blockId, text) => {
    setClassNotes((prev) => ({ ...prev, [blockId]: text }));
  };

  const handleMockUpload = (blockId) => {
    setProofs((prev) => ({
      ...prev,
      [blockId]: `minh_chung_${blockId.substring(0, 8)}.pdf`
    }));
  };

  // Điền nhanh dữ liệu mẫu thực tế vào cả 2 JSON
  const handleQuickFillSample = () => {
    const sScores = {};
    const cScores = {};
    const mockProofs = {};
    const mockNotes = {};

    blocks.forEach((b) => {
      if (b.type === "CRITERIA_GROUP" && b.children) {
        b.children.forEach((c, idx) => {
          const max = Number(c.maxScore) || 0;
          // Điểm SV tự chấm
          const sVal = Math.max(0, max - (idx % 2));
          // Điểm Lớp thẩm định (thỉnh thoảng trừ 1đ nếu thiếu minh chứng)
          const cVal = idx === 1 ? Math.max(0, sVal - 1) : sVal;
          sScores[c.id] = sVal;
          cScores[c.id] = cVal;
          if (c.requiresProof || idx % 2 === 0) {
            mockProofs[c.id] = `minh_chung_${c.fieldCode || idx}.pdf`;
          }
          if (idx === 1) {
            mockNotes[c.id] = "Chưa nộp minh chứng bản cứng, trừ 1đ";
          }
        });
      } else {
        const max = Number(b.maxScore) || 0;
        sScores[b.id] = max;
        cScores[b.id] = max;
        if (b.requiresProof) {
          mockProofs[b.id] = `chung_chi_${b.fieldCode}.pdf`;
        }
      }
    });

    setStudentScores(sScores);
    setClassScores(cScores);
    setProofs(mockProofs);
    setClassNotes(mockNotes);
  };

  // Tính điểm nhóm và tổng điểm theo quy chế độc lập cho cả 2 bên
  const { studentCalc, classCalc } = useMemo(() => {
    const sGroupScores = {};
    const cGroupScores = {};
    let sTotal = 0;
    let cTotal = 0;

    blocks.forEach((block) => {
      if (block.type === "CRITERIA_GROUP") {
        const children = block.children || [];
        const groupMax = Number(block.maxScore) || 0;

        // Tính cho SV
        const sRaw = children.reduce((acc, c) => acc + (Number(studentScores[c.id]) || 0), 0);
        const sEffective = Math.min(sRaw, groupMax);
        sGroupScores[block.id] = { raw: sRaw, effective: sEffective, max: groupMax, isExceeded: sRaw > groupMax };
        sTotal += sEffective;

        // Tính cho Lớp
        const cRaw = children.reduce((acc, c) => acc + (Number(classScores[c.id]) || 0), 0);
        const cEffective = Math.min(cRaw, groupMax);
        cGroupScores[block.id] = { raw: cRaw, effective: cEffective, max: groupMax, isExceeded: cRaw > groupMax };
        cTotal += cEffective;
      } else {
        const sScore = Number(studentScores[block.id]) || 0;
        const cScore = Number(classScores[block.id]) || 0;
        sTotal += sScore;
        cTotal += cScore;
      }
    });

    return {
      studentCalc: { groupScores: sGroupScores, total: sTotal },
      classCalc: { groupScores: cGroupScores, total: cTotal }
    };
  }, [blocks, studentScores, classScores]);

  // Xếp loại rèn luyện
  const getRank = (score) => {
    const matched = rankingScale.find((r) => score >= r.minScore && score <= r.maxScore);
    return matched || { rank: "Chưa xếp loại", color: "text-slate-600 bg-slate-100 border-slate-200" };
  };

  const studentRank = useMemo(() => getRank(studentCalc.total), [studentCalc.total, rankingScale]);
  const classRank = useMemo(() => getRank(classCalc.total), [classCalc.total, rankingScale]);

  // Tổng trần tối đa của form
  const maxTotalScore = useMemo(() => {
    return blocks.reduce((acc, b) => acc + (Number(b.maxScore) || 0), 0);
  }, [blocks]);

  // CẤU TRÚC JSON 1: Dữ liệu nộp của Sinh viên
  const studentSubmissionJson = useMemo(() => {
    return {
      schemaVersion: formCode,
      evaluationRole: "STUDENT",
      studentInfo: {
        fullName: "Nguyễn Văn An",
        studentCode: "23110101",
        classCode: "BCSE2023",
        department: "Công nghệ Thông tin"
      },
      submittedAt: "2026-10-27T03:00:00Z",
      scores: studentScores,
      proofs: proofs,
      groupTotals: Object.fromEntries(
        Object.entries(studentCalc.groupScores).map(([k, v]) => [k, v.effective])
      ),
      grandTotal: studentCalc.total,
      ranking: studentRank.rank,
      signature: studentSignature
    };
  }, [formCode, studentScores, proofs, studentCalc, studentRank, studentSignature]);

  // CẤU TRÚC JSON 2: Dữ liệu thẩm định của Ban cán sự lớp
  const classSubmissionJson = useMemo(() => {
    return {
      schemaVersion: formCode,
      evaluationRole: "CLASS_COMMITTEE",
      evaluator: {
        fullName: "Trần Thị Mai",
        position: "Lớp trưởng",
        classCode: "BCSE2023"
      },
      evaluatedAt: "2026-10-27T03:30:00Z",
      scores: classScores,
      notes: classNotes,
      groupTotals: Object.fromEntries(
        Object.entries(classCalc.groupScores).map(([k, v]) => [k, v.effective])
      ),
      grandTotal: classCalc.total,
      ranking: classRank.rank,
      signature: classSignature
    };
  }, [formCode, classScores, classNotes, classCalc, classRank, classSignature]);

  // MAPPING JSON: Mô tả cách Backend hợp nhất 2 JSON để nạp vào Word
  const phoiWordMapping = useMemo(() => {
    return {
      phoiFileName: "Phoi_Mau_Phieu_DRL_2026.docx",
      mergeStrategy: "DUAL_JSON_PROJECTION",
      placeholders: {
        studentRole: {
          scoresPrefix: "score_{code}_sv",
          groupTotalPrefix: "total_section_{index}_sv",
          grandTotal: "grand_total_sv",
          signatureImg: "sig_student_image"
        },
        classRole: {
          scoresPrefix: "score_{code}_lop",
          groupTotalPrefix: "total_section_{index}_lop",
          grandTotal: "grand_total_lop",
          signatureImg: "sig_leader_image"
        },
        deanRole: {
          signatureImg: "sig_dean_image"
        }
      }
    };
  }, []);

  const handleCopyJson = (text, tabKey) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    setCopiedTab(tabKey);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 rounded-xl border border-line bg-white p-5 shadow-sm md:p-8">
      {/* THANH CHUYỂN ĐỔI GÓC NHÌN & TIỆN ÍCH */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-slate-50/90 p-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700">Quy trình đánh giá:</span>
          <div className="inline-flex rounded-lg border border-line bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveRole("STUDENT")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeRole === "STUDENT"
                  ? "bg-brand text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="size-3.5" />
              1. Sinh viên tự chấm (JSON 1)
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("CLASS_LEADER")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeRole === "CLASS_LEADER"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="size-3.5" />
              2. Lớp thẩm định (JSON 2)
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("ALL")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeRole === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="size-3.5" />
              3. Đối chiếu 2 cột & In Phôi Word
            </button>
          </div>
        </div>

        {/* Nút Xem 2 JSON độc lập & Điền mẫu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
          >
            <Code2 className="size-3.5 text-indigo-600" />
            <span>Xem 2 JSON độc lập</span>
          </button>

          <button
            type="button"
            onClick={handleQuickFillSample}
            className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand-soft px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition shadow-xs"
          >
            <Sparkles className="size-3.5" />
            <span>Điền thử điểm mẫu</span>
          </button>
        </div>
      </div>

      {/* BANNER GIẢI THÍCH GÓC NHÌN THEO PHƯƠNG ÁN 1 */}
      {activeRole === "STUDENT" && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 shrink-0 text-blue-700" />
            <span>
              <strong>Góc nhìn Sinh viên:</strong> Bạn tự nhập điểm, tải minh chứng và ký xác nhận. Dữ liệu nộp được lưu thành <strong>student_submission.json</strong> độc lập. Cột của Lớp sẽ do Ban cán sự chấm sau.
            </span>
          </div>
          <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded shrink-0">
            Tổng SV: {studentCalc.total}đ
          </span>
        </div>
      )}

      {activeRole === "CLASS_LEADER" && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50/80 px-4 py-2.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-emerald-700" />
            <span>
              <strong>Góc nhìn Ban cán sự lớp:</strong> Cột điểm của Sinh viên là <em>Chỉ đọc (Read-only)</em> để đối chứng minh chứng. Lớp chấm thẩm định và lưu thành <strong>class_submission.json</strong> riêng biệt.
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
            Tổng Lớp: {classCalc.total}đ
          </span>
        </div>
      )}

      {activeRole === "ALL" && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/80 px-4 py-2.5 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Eye className="size-4 shrink-0 text-indigo-700" />
            <span>
              <strong>Bảng tổng hợp đối chiếu (Theo Phôi DRL 2026):</strong> Hệ thống hợp nhất 2 file JSON độc lập từ Sinh viên và Lớp vào 5 cột chuẩn để so sánh và xuất phôi Word.
            </span>
          </div>
          <span className="font-mono text-[11px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded shrink-0">
            SV: {studentCalc.total}đ vs Lớp: {classCalc.total}đ
          </span>
        </div>
      )}

      {/* HEADER BIỂU MẪU CHUẨN ĐHQGHN */}
      <div className="border-b border-line pb-6 text-center">
        <div className="flex justify-between items-start text-xs font-semibold text-slate-700 pb-3 border-b border-line/60 mb-4">
          <div>
            <p className="uppercase text-[11px] font-bold">Đại học Quốc gia Hà Nội</p>
            <p className="uppercase text-xs font-bold text-brand">Trường Đại học Việt Nhật</p>
          </div>
          <div className="text-right">
            <p className="uppercase text-xs font-bold">Cộng hòa Xã hội Chủ nghĩa Việt Nam</p>
            <p className="italic font-medium text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>

        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <FileText className="size-3.5" />
          <span>Mã biểu mẫu: {formCode}</span>
        </div>
        <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 md:text-2xl">
          {formName}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-600">{semesterName}</p>

        {/* THÔNG TIN SINH VIÊN DEMO */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg border border-line bg-canvas p-4 text-left text-xs sm:grid-cols-4">
          <div>
            <span className="text-muted block">Họ và tên:</span>
            <span className="font-semibold text-slate-800">Nguyễn Văn An</span>
          </div>
          <div>
            <span className="text-muted block">Mã sinh viên:</span>
            <span className="font-semibold font-mono text-slate-800">23110101</span>
          </div>
          <div>
            <span className="text-muted block">Lớp sinh hoạt:</span>
            <span className="font-semibold text-slate-800">BCSE2023</span>
          </div>
          <div>
            <span className="text-muted block">Khoa quản lý:</span>
            <span className="font-semibold text-slate-800">Công nghệ Thông tin</span>
          </div>
        </div>
      </div>

      {/* BẢNG TIÊU CHÍ ĐÁNH GIÁ (LƯU ĐỘC LẬP TÙY THEO VAI TRÒ) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Nội dung đánh giá điểm rèn luyện
          </h2>
          <span className="text-xs text-muted">
            Tổng trần quy chế: <strong className="text-brand font-bold">{maxTotalScore} điểm</strong>
          </span>
        </div>

        {/* HEADER BẢNG THAY ĐỔI THEO GÓC NHÌN */}
        {activeRole === "STUDENT" && (
          <div className="hidden sm:grid grid-cols-[45px_1fr_90px_110px_150px] gap-2 rounded-t-xl border border-blue-300 bg-blue-100/70 p-3 text-xs font-bold text-slate-800 text-center uppercase tracking-wider">
            <span>TT</span>
            <span className="text-left pl-2">Nội dung đánh giá / Hướng dẫn chấm</span>
            <span>Điểm tối đa</span>
            <span className="text-brand bg-white/80 py-0.5 rounded shadow-xs">SV tự đánh giá</span>
            <span className="text-blue-900">Minh chứng đính kèm</span>
          </div>
        )}

        {activeRole === "CLASS_LEADER" && (
          <div className="hidden sm:grid grid-cols-[45px_1fr_80px_100px_110px_160px] gap-2 rounded-t-xl border border-emerald-300 bg-emerald-100/70 p-3 text-xs font-bold text-slate-800 text-center uppercase tracking-wider">
            <span>TT</span>
            <span className="text-left pl-2">Nội dung đánh giá</span>
            <span>Trần</span>
            <span className="text-slate-600 bg-white/60 py-0.5 rounded">SV chấm (Đọc)</span>
            <span className="text-emerald-900 bg-white/80 py-0.5 rounded shadow-xs">Lớp đánh giá</span>
            <span className="text-emerald-950">Ghi chú thẩm định</span>
          </div>
        )}

        {activeRole === "ALL" && (
          <div className="hidden sm:grid grid-cols-[45px_1fr_90px_115px_115px] gap-2 rounded-t-xl border border-slate-300 bg-slate-100 p-3 text-xs font-bold text-slate-800 text-center uppercase tracking-wider">
            <span>TT</span>
            <span className="text-left pl-2">Nội dung đánh giá / Hướng dẫn chấm</span>
            <span>Điểm tối đa</span>
            <span className="text-brand bg-brand-soft/80 py-0.5 rounded">SV tự đánh giá</span>
            <span className="text-emerald-800 bg-emerald-50 py-0.5 rounded">Lớp đánh giá</span>
          </div>
        )}

        {blocks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-muted">
            Chưa có tiêu chí nào được thêm vào biểu mẫu.
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, idx) => {
              // TRƯỜNG HỢP 1: NHÓM TIÊU CHÍ CHA (CRITERIA_GROUP)
              if (block.type === "CRITERIA_GROUP") {
                const sGrp = studentCalc.groupScores[block.id] || { raw: 0, effective: 0, max: block.maxScore || 0, isExceeded: false };
                const cGrp = classCalc.groupScores[block.id] || { raw: 0, effective: 0, max: block.maxScore || 0, isExceeded: false };
                const children = block.children || [];

                return (
                  <div
                    key={block.id || idx}
                    className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xs transition hover:border-slate-400"
                  >
                    {/* HÀNG HEADER NHÓM TIÊU CHÍ */}
                    <div
                      className={`grid gap-2 items-center border-b p-3 text-xs ${
                        activeRole === "STUDENT"
                          ? "sm:grid-cols-[45px_1fr_90px_110px_150px] bg-blue-50/40 border-blue-200"
                          : activeRole === "CLASS_LEADER"
                          ? "sm:grid-cols-[45px_1fr_80px_100px_110px_160px] bg-emerald-50/40 border-emerald-200"
                          : "sm:grid-cols-[45px_1fr_90px_115px_115px] bg-slate-50/90 border-slate-200"
                      }`}
                    >
                      {/* TT */}
                      <div className="flex sm:justify-center">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded bg-brand font-mono text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Tên nhóm & mô tả */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {block.title}
                          </span>
                          <span className="rounded bg-brand-soft px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand">
                            Nhóm tiêu chí
                          </span>
                        </div>
                        {block.description && (
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                            {block.description}
                          </p>
                        )}
                      </div>

                      {/* Điểm tối đa nhóm */}
                      <div className="text-center font-bold text-slate-800 text-sm">
                        {block.maxScore}đ
                      </div>

                      {/* Các cột điểm tùy theo góc nhìn */}
                      {activeRole === "STUDENT" && (
                        <>
                          <div className="text-center">
                            <span className="inline-block rounded-md bg-brand-soft px-2 py-1 font-mono font-bold text-brand text-xs">
                              {sGrp.effective} / {block.maxScore}đ
                            </span>
                            {sGrp.isExceeded && (
                              <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                                (Chặn trần {block.maxScore}đ)
                              </span>
                            )}
                          </div>
                          <div className="text-center text-[10px] text-muted italic">
                            Chặn trần {block.maxScore}đ
                          </div>
                        </>
                      )}

                      {activeRole === "CLASS_LEADER" && (
                        <>
                          <div className="text-center">
                            <span className="font-mono text-xs font-bold text-slate-600">
                              {sGrp.effective}đ
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="inline-block rounded-md bg-emerald-100 px-2 py-1 font-mono font-bold text-emerald-900 text-xs border border-emerald-300">
                              {cGrp.effective} / {block.maxScore}đ
                            </span>
                            {cGrp.isExceeded && (
                              <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                                (Chặn trần {block.maxScore}đ)
                              </span>
                            )}
                          </div>
                          <div className="text-center text-[10px] text-muted italic">
                            Tổng thẩm định nhóm
                          </div>
                        </>
                      )}

                      {activeRole === "ALL" && (
                        <>
                          <div className="text-center">
                            <span className="inline-block rounded-md bg-brand-soft px-2 py-1 font-mono font-bold text-brand text-xs">
                              {sGrp.effective} / {block.maxScore}đ
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 font-mono font-bold text-emerald-800 text-xs">
                              {cGrp.effective} / {block.maxScore}đ
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* DANH SÁCH CÁC MỤC CON 1.1, 1.2, 1.3... */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {children.map((child, cIdx) => {
                        const sVal = studentScores[child.id] ?? "";
                        const cVal = classScores[child.id] ?? "";
                        const noteVal = classNotes[child.id] ?? "";
                        const hasProof = !!proofs[child.id];
                        const isProofMissing = child.requiresProof && Number(sVal) > 0 && !hasProof;

                        return (
                          <div
                            key={child.id || cIdx}
                            className={`grid gap-2 items-start p-3 text-xs hover:bg-slate-50/50 transition ${
                              activeRole === "STUDENT"
                                ? "sm:grid-cols-[45px_1fr_90px_110px_150px]"
                                : activeRole === "CLASS_LEADER"
                                ? "sm:grid-cols-[45px_1fr_80px_100px_110px_160px]"
                                : "sm:grid-cols-[45px_1fr_90px_115px_115px]"
                            }`}
                          >
                            {/* TT con */}
                            <div className="text-center font-mono font-semibold text-slate-500 pt-1">
                              {idx + 1}.{cIdx + 1}
                            </div>

                            {/* Nội dung tiêu chí con */}
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-slate-800">
                                  {child.title || child.fieldName}
                                </span>
                                {child.isRequired && (
                                  <span className="text-red-500 font-bold" title="Bắt buộc">*</span>
                                )}
                              </div>
                              {child.description && (
                                <p className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                                  {child.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-muted">
                                <span className="font-mono rounded bg-slate-100 px-1.5 py-0.2">
                                  {child.fieldCode}
                                </span>
                                {child.requiresProof && (
                                  <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                    Cần minh chứng
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Điểm tối đa */}
                            <div className="text-center font-semibold text-slate-700 pt-1">
                              {child.maxScore}đ
                            </div>

                            {/* HIỂN THỊ CÁC Ô TÙY THEO GÓC NHÌN */}
                            {activeRole === "STUDENT" && (
                              <>
                                {/* SV tự nhập điểm */}
                                <div className="flex justify-center items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={child.maxScore}
                                    placeholder="0"
                                    value={sVal}
                                    disabled={!isInteractive}
                                    onChange={(e) =>
                                      handleStudentScoreChange(child.id, child.maxScore, e.target.value)
                                    }
                                    className="w-16 rounded-md border border-line bg-white px-2 py-1 text-center font-bold font-mono text-xs text-brand outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
                                  />
                                </div>

                                {/* Đính kèm minh chứng SV */}
                                <div className="flex flex-col items-center justify-center">
                                  {hasProof ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[11px] text-green-700 border border-green-200 max-w-full">
                                      <FileCheck className="size-3 shrink-0" />
                                      <span className="truncate">{proofs[child.id]}</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={!isInteractive}
                                      onClick={() => handleMockUpload(child.id)}
                                      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition ${
                                        isProofMissing
                                          ? "border-red-400 bg-red-50 text-red-700 hover:bg-red-100"
                                          : "border-line bg-white text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      <Upload className="size-3" />
                                      <span>Tải file</span>
                                    </button>
                                  )}
                                  {isProofMissing && (
                                    <span className="text-[10px] text-red-600 font-medium mt-0.5 text-center">
                                      Bắt buộc đính kèm
                                    </span>
                                  )}
                                </div>
                              </>
                            )}

                            {activeRole === "CLASS_LEADER" && (
                              <>
                                {/* SV chấm (Read-only + Minh chứng) */}
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {sVal !== "" ? `${sVal}đ` : "0đ"}
                                  </span>
                                  {hasProof && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-green-700">
                                      <FileCheck className="size-2.5" />
                                      <span className="truncate max-w-16">{proofs[child.id]}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Lớp nhập điểm */}
                                <div className="flex justify-center items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={child.maxScore}
                                    placeholder="0"
                                    value={cVal}
                                    disabled={!isInteractive}
                                    onChange={(e) =>
                                      handleClassScoreChange(child.id, child.maxScore, e.target.value)
                                    }
                                    className="w-16 rounded-md border border-emerald-300 bg-emerald-50/40 px-2 py-1 text-center font-bold font-mono text-xs text-emerald-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                                  />
                                </div>

                                {/* Ghi chú của Ban cán sự lớp */}
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Ghi chú thẩm định..."
                                    value={noteVal}
                                    onChange={(e) => handleClassNoteChange(child.id, e.target.value)}
                                    className="w-full rounded border border-line bg-white px-2 py-1 text-[11px] text-slate-700 outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </>
                            )}

                            {activeRole === "ALL" && (
                              <>
                                {/* SV tự đánh giá */}
                                <div className="flex justify-center items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={child.maxScore}
                                    placeholder="0"
                                    value={sVal}
                                    disabled={!isInteractive}
                                    onChange={(e) =>
                                      handleStudentScoreChange(child.id, child.maxScore, e.target.value)
                                    }
                                    className="w-16 rounded-md border border-line bg-white px-2 py-1 text-center font-bold font-mono text-xs text-brand outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
                                  />
                                </div>

                                {/* Lớp đánh giá */}
                                <div className="flex justify-center items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={child.maxScore}
                                    placeholder="0"
                                    value={cVal}
                                    disabled={!isInteractive}
                                    onChange={(e) =>
                                      handleClassScoreChange(child.id, child.maxScore, e.target.value)
                                    }
                                    className="w-16 rounded-md border border-emerald-300 bg-emerald-50/40 px-2 py-1 text-center font-bold font-mono text-xs text-emerald-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // TRƯỜNG HỢP 2: TIÊU CHÍ ĐỘC LẬP
              const sVal = studentScores[block.id] ?? "";
              const cVal = classScores[block.id] ?? "";
              const noteVal = classNotes[block.id] ?? "";
              const hasProof = !!proofs[block.id];
              const isProofMissing = block.requiresProof && Number(sVal) > 0 && !hasProof;

              return (
                <div
                  key={block.id || idx}
                  className={`grid gap-2 items-start rounded-xl border border-slate-300 bg-white p-3 text-xs shadow-xs hover:border-slate-400 transition ${
                    activeRole === "STUDENT"
                      ? "sm:grid-cols-[45px_1fr_90px_110px_150px]"
                      : activeRole === "CLASS_LEADER"
                      ? "sm:grid-cols-[45px_1fr_80px_100px_110px_160px]"
                      : "sm:grid-cols-[45px_1fr_90px_115px_115px]"
                  }`}
                >
                  <div className="text-center font-mono font-bold text-slate-600 pt-1">
                    {idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-800">
                        {block.title || block.fieldName}
                      </span>
                      {block.isRequired && <span className="text-red-500 font-bold">*</span>}
                    </div>
                    {block.description && (
                      <p className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                        {block.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-muted">
                      <span className="font-mono rounded bg-slate-100 px-1.5 py-0.2">
                        {block.fieldCode}
                      </span>
                      {block.requiresProof && (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                          Cần minh chứng
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center font-bold text-slate-700 pt-1">
                    {block.maxScore}đ
                  </div>

                  {/* HIỂN THỊ CỘT TÙY THEO GÓC NHÌN */}
                  {activeRole === "STUDENT" && (
                    <>
                      <div className="flex justify-center items-center">
                        <input
                          type="number"
                          min="0"
                          max={block.maxScore}
                          placeholder="0"
                          value={sVal}
                          disabled={!isInteractive}
                          onChange={(e) =>
                            handleStudentScoreChange(block.id, block.maxScore, e.target.value)
                          }
                          className="w-16 rounded-md border border-line bg-white px-2 py-1 text-center font-bold font-mono text-xs text-brand outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        {hasProof ? (
                          <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[11px] text-green-700 border border-green-200">
                            <FileCheck className="size-3" />
                            <span className="truncate max-w-28">{proofs[block.id]}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!isInteractive}
                            onClick={() => handleMockUpload(block.id)}
                            className="inline-flex items-center gap-1 rounded border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Upload className="size-3" />
                            <span>Tải file</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {activeRole === "CLASS_LEADER" && (
                    <>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {sVal !== "" ? `${sVal}đ` : "0đ"}
                        </span>
                      </div>
                      <div className="flex justify-center items-center">
                        <input
                          type="number"
                          min="0"
                          max={block.maxScore}
                          placeholder="0"
                          value={cVal}
                          disabled={!isInteractive}
                          onChange={(e) =>
                            handleClassScoreChange(block.id, block.maxScore, e.target.value)
                          }
                          className="w-16 rounded-md border border-emerald-300 bg-emerald-50/40 px-2 py-1 text-center font-bold font-mono text-xs text-emerald-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Ghi chú thẩm định..."
                          value={noteVal}
                          onChange={(e) => handleClassNoteChange(block.id, e.target.value)}
                          className="w-full rounded border border-line bg-white px-2 py-1 text-[11px] text-slate-700 outline-none focus:border-emerald-500"
                        />
                      </div>
                    </>
                  )}

                  {activeRole === "ALL" && (
                    <>
                      <div className="flex justify-center items-center">
                        <input
                          type="number"
                          min="0"
                          max={block.maxScore}
                          placeholder="0"
                          value={sVal}
                          disabled={!isInteractive}
                          onChange={(e) =>
                            handleStudentScoreChange(block.id, block.maxScore, e.target.value)
                          }
                          className="w-16 rounded-md border border-line bg-white px-2 py-1 text-center font-bold font-mono text-xs text-brand outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs"
                        />
                      </div>
                      <div className="flex justify-center items-center">
                        <input
                          type="number"
                          min="0"
                          max={block.maxScore}
                          placeholder="0"
                          value={cVal}
                          disabled={!isInteractive}
                          onChange={(e) =>
                            handleClassScoreChange(block.id, block.maxScore, e.target.value)
                          }
                          className="w-16 rounded-md border border-emerald-300 bg-emerald-50/40 px-2 py-1 text-center font-bold font-mono text-xs text-emerald-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* HÀNG TỔNG ĐIỂM (TÙY THEO GÓC NHÌN) */}
        <div
          className={`grid gap-2 items-center rounded-b-xl border border-slate-300 bg-slate-900 text-white p-4 font-bold text-xs shadow-md ${
            activeRole === "STUDENT"
              ? "sm:grid-cols-[45px_1fr_90px_110px_150px]"
              : activeRole === "CLASS_LEADER"
              ? "sm:grid-cols-[45px_1fr_80px_100px_110px_160px]"
              : "sm:grid-cols-[45px_1fr_90px_115px_115px]"
          }`}
        >
          <div className="text-center font-mono">∑</div>
          <div className="uppercase tracking-wider text-sm font-black pl-1">
            TỔNG ĐIỂM ĐÁNH GIÁ (Tối đa 100 điểm)
          </div>
          <div className="text-center text-sm font-black text-amber-400">
            {maxTotalScore}đ
          </div>

          {activeRole === "STUDENT" && (
            <>
              <div className="text-center">
                <span className="block text-base font-black text-brand-soft font-mono">
                  {studentCalc.total} / 100đ
                </span>
                <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold bg-brand text-white">
                  {studentRank.rank}
                </span>
              </div>
              <div className="text-center text-[11px] text-slate-300 font-mono">
                student_submission.json
              </div>
            </>
          )}

          {activeRole === "CLASS_LEADER" && (
            <>
              <div className="text-center font-mono text-slate-400">
                {studentCalc.total}đ
              </div>
              <div className="text-center">
                <span className="block text-base font-black text-emerald-300 font-mono">
                  {classCalc.total} / 100đ
                </span>
                <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold bg-emerald-600 text-white">
                  {classRank.rank}
                </span>
              </div>
              <div className="text-center text-[11px] text-slate-300 font-mono">
                class_submission.json
              </div>
            </>
          )}

          {activeRole === "ALL" && (
            <>
              <div className="text-center">
                <span className="block text-base font-black text-brand-soft font-mono">
                  {studentCalc.total} / 100đ
                </span>
                <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold bg-brand text-white">
                  {studentRank.rank}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-base font-black text-emerald-300 font-mono">
                  {classCalc.total} / 100đ
                </span>
                <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold bg-emerald-600 text-white">
                  {classRank.rank}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CHỮ KÝ 3 CẤP (XÁC THỰC SINH VIÊN - CÁN BỘ LỚP - KHOA / GVCN) */}
      <div className="border-t border-line pt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Chữ ký xác thực điện tử 3 bên (Theo quy chế ĐRL)
          </h3>
          <span className="text-xs text-muted italic">
            Hà Nội, ngày 27 tháng 10 năm 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {/* Cấp 1: Sinh viên */}
          <div className={`rounded-xl border p-4 transition ${
            activeRole === "STUDENT" || activeRole === "ALL"
              ? "border-brand bg-brand-soft/20 shadow-xs ring-1 ring-brand-soft"
              : "border-dashed border-slate-300 bg-slate-50/60"
          }`}>
            <span className="block text-xs font-bold uppercase text-slate-800">
              1. SINH VIÊN
            </span>
            <span className="block text-[11px] text-muted italic">(Ký và ghi rõ họ tên)</span>
            <div className="my-3 flex h-16 items-center justify-center rounded-lg border border-line bg-white p-2">
              <span className="font-serif italic text-sm font-semibold text-brand">
                {studentSignature}
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted">
              Lưu trong: student_submission.json
            </span>
          </div>

          {/* Cấp 2: Cán bộ lớp */}
          <div className={`rounded-xl border p-4 transition ${
            activeRole === "CLASS_LEADER" || activeRole === "ALL"
              ? "border-emerald-500 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-200"
              : "border-dashed border-slate-300 bg-slate-50/60"
          }`}>
            <span className="block text-xs font-bold uppercase text-slate-800">
              2. CÁN BỘ LỚP
            </span>
            <span className="block text-[11px] text-muted italic">(Ký và ghi rõ họ tên)</span>
            <div className="my-3 flex h-16 items-center justify-center rounded-lg border border-line bg-white p-2">
              <span className="font-serif italic text-sm font-semibold text-emerald-800">
                {classSignature}
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted">
              Lưu trong: class_submission.json
            </span>
          </div>

          {/* Cấp 3: Giáo viên chủ nhiệm / Khoa */}
          <div className="rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50/60">
            <span className="block text-xs font-bold uppercase text-slate-800">
              3. GVCN / BAN CHỦ NHIỆM KHOA
            </span>
            <span className="block text-[11px] text-muted italic">(Ký và ghi rõ họ tên)</span>
            <div className="my-3 flex h-16 items-center justify-center rounded-lg border border-line bg-white p-2">
              <span className="font-serif italic text-sm font-semibold text-slate-600">
                {deanSignature}
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted">
              Chữ ký phê duyệt lô cấp Khoa
            </span>
          </div>
        </div>
      </div>

      {/* MODAL DATA INSPECTOR: XEM 2 JSON ĐỘC LẬP (PHƯƠNG ÁN 1) */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl rounded-2xl border border-line bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Code2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Data Inspector (Phương án 1)</h3>
                  <p className="text-[11px] text-slate-300">
                    Minh chứng 2 JSON độc lập giữa Sinh viên và Lớp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Tabs Switcher in Modal */}
            <div className="flex items-center justify-between border-b border-line bg-slate-100 px-5 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveJsonTab("STUDENT")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeJsonTab === "STUDENT"
                      ? "bg-white text-brand shadow-xs border border-brand/20"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserCheck className="size-3.5 text-brand" />
                  student_submission.json
                </button>
                <button
                  type="button"
                  onClick={() => setActiveJsonTab("CLASS")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeJsonTab === "CLASS"
                      ? "bg-white text-emerald-800 shadow-xs border border-emerald-300"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="size-3.5 text-emerald-800" />
                  class_submission.json
                </button>
                <button
                  type="button"
                  onClick={() => setActiveJsonTab("MAPPING")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeJsonTab === "MAPPING"
                      ? "bg-white text-indigo-700 shadow-xs border border-indigo-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="size-3.5 text-indigo-700" />
                  Mapping Phôi Word DRL
                </button>
              </div>

              {/* Copy button */}
              <button
                type="button"
                onClick={() => {
                  const target =
                    activeJsonTab === "STUDENT"
                      ? studentSubmissionJson
                      : activeJsonTab === "CLASS"
                      ? classSubmissionJson
                      : phoiWordMapping;
                  handleCopyJson(target, activeJsonTab);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-white border border-line px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                {copiedTab === activeJsonTab ? (
                  <>
                    <Check className="size-3.5 text-green-600" />
                    <span className="text-green-600 font-semibold">Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Sao chép JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-100">
              {activeJsonTab === "STUDENT" && (
                <pre className="leading-relaxed">
                  {JSON.stringify(studentSubmissionJson, null, 2)}
                </pre>
              )}
              {activeJsonTab === "CLASS" && (
                <pre className="leading-relaxed">
                  {JSON.stringify(classSubmissionJson, null, 2)}
                </pre>
              )}
              {activeJsonTab === "MAPPING" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-300">
                    <p className="text-xs font-semibold text-emerald-400 mb-1">
                      Chiến lược ráp dữ liệu (Dual JSON Projection):
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Khi xuất file Word hoặc PDF theo <strong>Phoi_Mau_Phieu_DRL_2026.docx</strong>, Backend sẽ lấy Schema form kết hợp đồng thời 2 file JSON:
                      lấy <code className="text-brand-soft">studentSubmission.scores</code> điền vào cột Sinh viên và <code className="text-emerald-300">classSubmission.scores</code> điền vào cột Lớp.
                    </p>
                  </div>
                  <pre className="leading-relaxed">
                    {JSON.stringify(phoiWordMapping, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-line px-5 py-3 bg-slate-50 text-xs">
              <span className="text-muted">
                Dữ liệu được bảo toàn tính toàn vẹn chữ ký cho từng vai trò.
              </span>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 font-semibold text-white hover:bg-slate-800 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
