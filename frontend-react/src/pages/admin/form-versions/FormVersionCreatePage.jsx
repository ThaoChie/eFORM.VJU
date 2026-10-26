import {
  ArrowLeft,
  Save,
  CheckCircle,
  Plus,
  Copy,
  FileText,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
  X,
  Palette,
  Braces,
  Sparkles,
  ClipboardCopy,
  Layers,
  Search,
  CheckSquare,
  Square
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import {
  Button,
  Card,
  IconButton,
  Input,
  Modal,
  PageTitle,
  Select,
  Textarea
} from "../../../components/ui/Primitives"
import { formService } from "../../../services/form-service"
import { client } from "../../../lib/axios/client"

export default function FormVersionCreatePage() {
  const navigate = useNavigate()

  // 1 & 2: Biểu mẫu & Mã phiên bản (Read-only)
  const [formCode] = useState("DRL-2026")
  const [versionNo, setVersionNo] = useState("v1.0")

  // 3: Tên phiên bản
  const [formName, setFormName] = useState("Phiếu Đánh giá Điểm Rèn luyện Sinh viên")

  // 4: Học kỳ áp dụng
  const [semesters, setSemesters] = useState([])
  const [semesterId, setSemesterId] = useState("")

  // 5: Mô tả (tối đa 512 ký tự)
  const [description, setDescription] = useState("")

  // 6: Áp dụng cho ("Toàn hệ thống" hoặc "Đơn vị cụ thể")
  const [scopeType, setScopeType] = useState("Toàn hệ thống")
  const [departments, setDepartments] = useState([])
  const [selectedDepts, setSelectedDepts] = useState([])

  // 7, 8: Danh sách trường thông tin biểu mẫu (Field Codes)
  const [allFieldCodes, setAllFieldCodes] = useState([])
  const [selectedFields, setSelectedFields] = useState([])
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [fieldSearch, setFieldSearch] = useState("")
  const [fieldCategoryFilter, setFieldCategoryFilter] = useState("")
  const [tempSelectedFieldIds, setTempSelectedFieldIds] = useState(new Set())

  // 9: Sao chép từ biểu mẫu khác
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState([])

  // 10: Kích hoạt (Switch)
  const [isAutoActivate, setIsAutoActivate] = useState(true)

  // 11 & 12: Có hiệu lực từ & Ngày hết hiệu lực
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0])
  const [effectiveTo, setEffectiveTo] = useState("")

  // 13 & 14: Dữ liệu mẫu & Sinh từ cấu hình
  const [sampleDataJson, setSampleDataJson] = useState("{\n  \"student_name\": \"Nguyễn Văn A\",\n  \"student_code\": \"B21DCCN001\"\n}")
  const [jsonError, setJsonError] = useState(null)
  const [customLayoutJson, setCustomLayoutJson] = useState("")

  // 16: File template đính kèm (.docx, tối đa 10MB)
  const [templateFile, setTemplateFile] = useState(null)
  const [matchAnalysis, setMatchAnalysis] = useState(null)

  // 17: Vị trí 3 ô ký trên PDF (Sinh viên, Lớp, Khoa)
  const [signatureSlots, setSignatureSlots] = useState([
    { role: "Sinh viên", roleCode: "STUDENT", page: 1, x: 100, y: 150, width: 140, height: 60, useMarker: false },
    { role: "Lớp trưởng", roleCode: "CLASS_LEADER", page: 1, x: 280, y: 150, width: 140, height: 60, useMarker: false },
    { role: "Trưởng Khoa", roleCode: "DEAN", page: 1, x: 460, y: 150, width: 140, height: 60, useMarker: false }
  ])

  // 19: Lý do yêu cầu (tối đa 1000 ký tự)
  const [requestReason, setRequestReason] = useState("")

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Fetch initial data: Semesters, Departments, Field Codes, Existing templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [semRes, deptRes, fieldsRes, tplRes] = await Promise.allSettled([
          client.get("/semesters"),
          client.get("/departments"),
          client.get("/fields?size=100"),
          formService.getTemplates()
        ]);

        if (semRes.status === "fulfilled" && semRes.value) {
          const list = Array.isArray(semRes.value) ? semRes.value : semRes.value.content || [];
          setSemesters(list);
          const activeSem = list.find((s) => s.isActive);
          if (activeSem) setSemesterId(activeSem.id);
          else if (list.length > 0) setSemesterId(list[0].id);
        }

        if (deptRes.status === "fulfilled" && deptRes.value) {
          const list = Array.isArray(deptRes.value) ? deptRes.value : deptRes.value.content || [];
          setDepartments(list);
        }

        if (fieldsRes.status === "fulfilled" && fieldsRes.value) {
          const content = fieldsRes.value.content || fieldsRes.value.data || fieldsRes.value || [];
          // Chỉ lấy các trường đang hiệu lực (isActive = true)
          const activeFields = Array.isArray(content) ? content.filter((f) => f.isActive !== false) : [];
          setAllFieldCodes(activeFields);

          // Mặc định chọn 5 trường cơ bản nếu có
          if (activeFields.length > 0) {
            const defaults = activeFields.slice(0, 5);
            setSelectedFields(defaults);
          }
        }

        if (tplRes.status === "fulfilled" && tplRes.value) {
          const tpls = Array.isArray(tplRes.value) ? tplRes.value : tplRes.value.content || [];
          setAvailableTemplates(tpls);
          // Tự sinh mã phiên bản tiếp theo
          const sameCode = tpls.filter((t) => t.formCode === formCode);
          if (sameCode.length > 0) {
            setVersionNo(`v${sameCode.length + 1}.0`);
          }
        }
      } catch (err) {
        console.error("Lỗi tải thông tin khởi tạo:", err);
      }
    };

    fetchData();
  }, [formCode]);

  // Sync customLayoutJson if user navigates back from Form Designer
  useEffect(() => {
    const handleStorageOrFocus = () => {
      const cached = sessionStorage.getItem("drl_designer_layout_new");
      if (cached) {
        setCustomLayoutJson(cached);
      }
    };
    handleStorageOrFocus();
    window.addEventListener("focus", handleStorageOrFocus);
    return () => window.removeEventListener("focus", handleStorageOrFocus);
  }, []);

  // Track dirty state
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // 13: Validate JSON syntax on change
  const handleSampleJsonChange = (val) => {
    setSampleDataJson(val);
    markDirty();
    try {
      if (val.trim()) {
        JSON.parse(val);
      }
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  // 14: Sinh từ cấu hình (Auto generate JSON from selected fields)
  const handleGenerateSampleFromConfig = () => {
    if (selectedFields.length === 0) {
      toast.error("Chưa có trường thông tin nào trong biểu mẫu");
      return;
    }
    const sample = {};
    selectedFields.forEach((field) => {
      const code = field.fieldCode || field.code;
      switch (field.dataType) {
        case "NUMBER":
          sample[code] = 10;
          break;
        case "DATE":
          sample[code] = "2026-10-15";
          break;
        case "BOOLEAN":
          sample[code] = true;
          break;
        case "FILE":
          sample[code] = "https://minio.drl.edu.vn/proofs/sample.pdf";
          break;
        case "SIGNATURE":
          sample[code] = "data:image/png;base64,iVBORw0KGgo...";
          break;
        default:
          sample[code] = `Giá trị mẫu ${field.fieldName || code}`;
      }
    });
    setSampleDataJson(JSON.stringify(sample, null, 2));
    setJsonError(null);
    markDirty();
    toast.success("Đã sinh dữ liệu mẫu từ danh sách trường!");
  };

  // 15: Cấu hình form (jsonForm / templateLayoutJson)
  const generatedLayoutJson = JSON.stringify(
    {
      formCode,
      versionNo,
      formName,
      semesterId,
      scope: scopeType === "Toàn hệ thống" ? "ALL" : selectedDepts,
      fields: selectedFields.map((f) => ({
        fieldCode: f.fieldCode || f.code,
        fieldName: f.fieldName || f.name,
        dataType: f.dataType || f.type,
        category: f.category || f.group || "COMMON",
        isRequired: !!f.isRequired
      })),
      signatureSlots
    },
    null,
    2
  );

  const activeLayoutJson = customLayoutJson || generatedLayoutJson;

  const handleCopyLayoutJson = () => {
    navigator.clipboard.writeText(activeLayoutJson);
    toast.success("Đã sao chép cấu hình form vào clipboard!");
  };

  // 8: Open Add Field modal
  const handleOpenAddField = () => {
    const curIds = new Set(selectedFields.map((f) => f.id));
    setTempSelectedFieldIds(curIds);
    setFieldModalOpen(true);
  };

  const handleToggleFieldSelection = (field) => {
    setTempSelectedFieldIds((prev) => {
      const next = new Set(prev);
      if (next.has(field.id)) next.delete(field.id);
      else next.add(field.id);
      return next;
    });
  };

  const handleConfirmAddFields = () => {
    const newSelected = allFieldCodes.filter((f) => tempSelectedFieldIds.has(f.id));
    setSelectedFields(newSelected);
    setFieldModalOpen(false);
    markDirty();
    analyzePlaceholders(templateFile, newSelected);
    toast.success(`Đã cập nhật ${newSelected.length} trường thông tin.`);
  };

  const handleRemoveField = (id) => {
    const next = selectedFields.filter((f) => f.id !== id);
    setSelectedFields(next);
    markDirty();
    analyzePlaceholders(templateFile, next);
  };

  // 9: Sao chép từ biểu mẫu khác
  const handleCopyFromOther = (template) => {
    try {
      if (template.templateLayoutJson) {
        const layout = JSON.parse(template.templateLayoutJson);
        if (layout.fields && Array.isArray(layout.fields)) {
          // Map back to active fields
          const fieldCodesInTpl = new Set(layout.fields.map((f) => f.fieldCode));
          const matched = allFieldCodes.filter((f) => fieldCodesInTpl.has(f.fieldCode));
          setSelectedFields(matched);
          analyzePlaceholders(templateFile, matched);
        }
      }
      setCopyModalOpen(false);
      markDirty();
      toast.success(`Đã sao chép cấu hình từ ${template.formCode} (${template.versionNo})!`);
    } catch (e) {
      toast.error("Không thể đọc cấu hình của biểu mẫu nguồn");
    }
  };

  // 16: Upload & Analyze Template File (.docx)
  const analyzePlaceholders = (file, fields = selectedFields) => {
    if (!file) {
      setMatchAnalysis(null);
      return;
    }
    // Giả lập đọc và đối chiếu placeholder {{ field_code }} trong phôi .docx
    const fieldCodesSet = new Set(fields.map((f) => f.fieldCode || f.code));
    // Một số placeholder mẫu tiêu chuẩn trong phôi ĐRL
    const docxPlaceholders = [
      "student_name",
      "student_code",
      "student_class",
      "study_attendance",
      "proof_volunteer",
      "student_gpa_score",
      "student_total"
    ];
    let matchedCount = 0;
    const missing = [];

    docxPlaceholders.forEach((ph) => {
      if (fieldCodesSet.has(ph)) {
        matchedCount++;
      } else {
        missing.push(ph);
      }
    });

    setMatchAnalysis({
      totalInDoc: docxPlaceholders.length,
      matchedCount,
      missing
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      toast.error("Chỉ hỗ trợ file Word định dạng .docx");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng file vượt quá giới hạn 10 MB");
      return;
    }

    setTemplateFile(file);
    markDirty();
    analyzePlaceholders(file, selectedFields);
    toast.success(`Đã tải lên phôi: ${file.name}`);
  };

  // Validation
  const validateForm = () => {
    if (!formCode.trim()) {
      toast.error("Mã biểu mẫu không được để trống");
      return false;
    }
    if (!formName.trim()) {
      toast.error("Vui lòng nhập tên phiên bản biểu mẫu");
      return false;
    }
    if (!semesterId) {
      toast.error("Vui lòng chọn học kỳ áp dụng");
      return false;
    }
    if (selectedFields.length === 0 && !customLayoutJson) {
      toast.error("Biểu mẫu bắt buộc phải có ít nhất một trường thông tin");
      return false;
    }
    if (effectiveTo && new Date(effectiveTo) <= new Date(effectiveFrom)) {
      toast.error("Ngày hết hiệu lực phải sau ngày có hiệu lực");
      return false;
    }
    if (jsonError) {
      toast.error("Dữ liệu mẫu JSON chưa đúng định dạng");
      return false;
    }
    return true;
  };

  // 21: Lưu nháp
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        formCode,
        formName,
        versionNo,
        semesterId: Number(semesterId),
        templateLayoutJson: activeLayoutJson,
        status: "DRAFT",
        description: requestReason || description
      };
      await formService.createTemplate(payload);
      toast.success("Lưu tạm phiên bản ở trạng thái Nháp thành công!");
      setIsDirty(false);
      navigate("/admin/form-versions");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Lỗi lưu bản nháp");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 22: Xác nhận (Đẩy duyệt)
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        formCode,
        formName,
        versionNo,
        semesterId: Number(semesterId),
        templateLayoutJson: activeLayoutJson,
        status: isAutoActivate ? "ACTIVE" : "INACTIVE",
        description: requestReason || description
      };
      await formService.createTemplate(payload);
      toast.success("Thêm mới phiên bản biểu mẫu thành công!");
      setConfirmModalOpen(false);
      setIsDirty(false);
      navigate("/admin/form-versions");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Lỗi thêm mới phiên bản");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 20: Hủy / Quay lại
  const handleCancel = () => {
    if (isDirty) {
      setCancelModalOpen(true);
    } else {
      navigate("/admin/form-versions");
    }
  };

  return (
    <>
      <PageTitle
        title="Thêm mới phiên bản biểu mẫu"
        description="Khởi tạo phiên bản biểu mẫu đánh giá điểm rèn luyện và cấu hình các trường thông tin."
        action={
          <div className="flex gap-2">
            <Button onClick={handleCancel}>
              <ArrowLeft className="size-4" />
              Quay lại
            </Button>
            <Button
              onClick={() => {
                sessionStorage.setItem("drl_designer_layout_new", activeLayoutJson);
                navigate("/admin/form-versions/new/design");
              }}
              className="text-brand border-brand hover:bg-brand-soft"
            >
              <Palette className="size-4" />
              Thiết kế biểu mẫu
            </Button>
            <Button onClick={handleSaveDraft} loading={isSubmitting}>
              <Save className="size-4" />
              Lưu nháp
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (validateForm()) setConfirmModalOpen(true);
              }}
            >
              <CheckCircle className="size-4" />
              Xác nhận
            </Button>
          </div>
        }
      />

      <div className="space-y-5 pb-8">
        {/* KHỐI 1: THÔNG TIN CHUNG */}
        <Card>
          <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-base font-semibold text-slate-800">
              Thông tin chung
            </h2>
            <span className="text-xs text-muted">Các mục (*) là bắt buộc</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Biểu mẫu (Read-only) */}
            <div>
              <Input
                label="Biểu mẫu (Form)"
                required
                value={formCode}
                disabled
                className="bg-slate-50 cursor-not-allowed font-medium text-slate-700"
              />
            </div>

            {/* Mã phiên bản (Read-only) */}
            <div>
              <Input
                label="Mã phiên bản"
                required
                value={versionNo}
                disabled
                className="bg-slate-50 cursor-not-allowed font-mono font-semibold text-brand"
              />
            </div>

            {/* Tên phiên bản */}
            <div className="md:col-span-2">
              <Input
                label="Tên phiên bản"
                placeholder="Nhập tên phiên bản biểu mẫu..."
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  markDirty();
                }}
              />
            </div>

            {/* 4. Học kỳ áp dụng */}
            <div>
              <Select
                label="Học kỳ áp dụng"
                value={semesterId}
                onChange={(e) => {
                  setSemesterId(e.target.value);
                  markDirty();
                }}
              >
                <option value="">Chọn học kỳ</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.semesterName} {s.isActive ? " (Hiện tại)" : ""}
                  </option>
                ))}
              </Select>
            </div>

            {/* 6. Áp dụng cho (Toggle) */}
            <div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">Phạm vi áp dụng</span>
                <div className="flex h-10 rounded-lg border border-line bg-canvas p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setScopeType("Toàn hệ thống");
                      setSelectedDepts([]);
                      markDirty();
                    }}
                    className={`flex-1 rounded-md text-xs font-medium transition ${
                      scopeType === "Toàn hệ thống"
                        ? "bg-white text-brand shadow-sm font-semibold"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Toàn hệ thống
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScopeType("Đơn vị cụ thể");
                      markDirty();
                    }}
                    className={`flex-1 rounded-md text-xs font-medium transition ${
                      scopeType === "Đơn vị cụ thể"
                        ? "bg-white text-brand shadow-sm font-semibold"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Đơn vị cụ thể
                  </button>
                </div>
              </label>
            </div>

            {/* 11. Có hiệu lực từ */}
            <div>
              <Input
                type="date"
                label="Có hiệu lực từ"
                value={effectiveFrom}
                onChange={(e) => {
                  setEffectiveFrom(e.target.value);
                  markDirty();
                }}
              />
            </div>

            {/* Ngày hết hiệu lực */}
            <div>
              <Input
                type="date"
                label="Ngày hết hiệu lực"
                value={effectiveTo}
                onChange={(e) => {
                  setEffectiveTo(e.target.value);
                  markDirty();
                }}
              />
            </div>
          </div>

          {/* Chọn Khoa nếu phạm vi là Đơn vị cụ thể */}
          {scopeType === "Đơn vị cụ thể" && (
            <div className="mt-4 rounded-lg border border-line bg-canvas p-4">
              <span className="mb-2 block text-xs font-semibold text-slate-700">
                Chọn các khoa áp dụng biểu mẫu:
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {departments.map((d) => {
                  const checked = selectedDepts.includes(d.deptName);
                  return (
                    <label
                      key={d.id}
                      className="flex cursor-pointer items-center gap-2 rounded bg-white p-2 text-xs border border-line hover:border-brand"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          markDirty();
                          if (checked) {
                            setSelectedDepts(selectedDepts.filter((name) => name !== d.deptName));
                          } else {
                            setSelectedDepts([...selectedDepts, d.deptName]);
                          }
                        }}
                        className="rounded border-line text-brand focus:ring-brand"
                      />
                      <span className="truncate">{d.deptName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mô tả phiên bản */}
          <div className="mt-4">
            <Textarea
              label="Mô tả phiên bản"
              placeholder="Diễn giải ngắn gọn về phiên bản biểu mẫu này..."
              value={description}
              maxLength={512}
              onChange={(e) => {
                setDescription(e.target.value);
                markDirty();
              }}
            />
          </div>

          {/* Kích hoạt */}
          <div className="mt-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 select-none">
              <input
                type="checkbox"
                checked={isAutoActivate}
                onChange={(e) => {
                  setIsAutoActivate(e.target.checked);
                  markDirty();
                }}
                className="size-4 rounded border-line text-brand focus:ring-brand cursor-pointer"
              />
              <span>Tự động kích hoạt khi được duyệt</span>
            </label>
          </div>
        </Card>

        {/* TRƯỜNG THÔNG TIN BIỂU MẪU */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Trường thông tin biểu mẫu *
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Sao chép từ biểu mẫu khác */}
              <Button
                variant="secondary"
                onClick={() => setCopyModalOpen(true)}
                className="text-xs h-9"
              >
                <Copy className="size-3.5" />
                Sao chép từ biểu mẫu khác
              </Button>
              {/* Thêm phần tử */}
              <Button
                variant="primary"
                onClick={handleOpenAddField}
                className="text-xs h-9"
              >
                <Plus className="size-3.5" />
                Thêm phần tử
              </Button>
            </div>
          </div>

          {selectedFields.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-line bg-canvas p-8 text-center text-muted">
              <Layers className="size-8 mx-auto mb-2 text-slate-400" />
              <p className="font-medium text-slate-700">Chưa có trường thông tin nào</p>
              <p className="text-xs text-muted mt-1">
                Bấm "Thêm phần tử" để chọn các trường đưa vào biểu mẫu.
              </p>
              <Button onClick={handleOpenAddField} className="mt-3 inline-flex">
                <Plus className="size-4" />
                Thêm phần tử ngay
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">STT</th>
                    <th className="px-4 py-3">Mã trường</th>
                    <th className="px-4 py-3">Tên hiển thị</th>
                    <th className="px-4 py-3">Nhóm</th>
                    <th className="px-4 py-3">Kiểu dữ liệu</th>
                    <th className="px-4 py-3">Bắt buộc</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {selectedFields.map((field, idx) => (
                    <tr key={field.id || idx} className="hover:bg-canvas">
                      <td className="px-4 py-3 text-xs text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-brand">
                        {field.fieldCode || field.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {field.fieldName || field.name}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {field.category || field.group || "COMMON"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {field.dataType || field.type}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {field.isRequired ? (
                          <span className="text-brand font-semibold">Bắt buộc</span>
                        ) : (
                          <span className="text-slate-400">Tùy chọn</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <IconButton
                          label="Xóa trường này"
                          onClick={() => handleRemoveField(field.id)}
                          className="hover:text-red-600 size-8"
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* KHỐI 3: DỮ LIỆU MẪU & CẤU HÌNH JSON */}
        <Card>
          <div className="mb-4 border-b border-line pb-3">
            <h2 className="text-base font-semibold text-slate-800">
              Cấu hình biểu mẫu & Dữ liệu mẫu (JSON Layout)
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Dữ liệu mẫu */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Dữ liệu mẫu (Sample JSON)
                </span>
                <Button
                  variant="secondary"
                  onClick={handleGenerateSampleFromConfig}
                  className="h-8 text-xs px-2.5"
                >
                  <Sparkles className="size-3.5 text-amber-500 mr-1" />
                  Sinh từ cấu hình
                </Button>
              </div>

              <textarea
                value={sampleDataJson}
                onChange={(e) => handleSampleJsonChange(e.target.value)}
                rows={10}
                className={`w-full rounded-lg border font-mono text-xs p-3 outline-none focus:ring-2 focus:ring-brand-soft ${
                  jsonError ? "border-red-400 bg-red-50" : "border-line bg-white"
                }`}
                placeholder="Nhập JSON mẫu dạng key = Field Code..."
              />

              {jsonError ? (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>Lỗi cú pháp JSON: {jsonError}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <Check className="size-3.5 shrink-0" />
                  <span>JSON hợp lệ</span>
                </div>
              )}
            </div>

            {/* Cấu hình form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Cấu hình form (jsonForm)
                </span>
                <Button
                  variant="secondary"
                  onClick={handleCopyLayoutJson}
                  className="h-8 text-xs px-2.5"
                >
                  <ClipboardCopy className="size-3.5 mr-1" />
                  Sao chép cấu hình
                </Button>
              </div>

              <pre className="max-h-[220px] overflow-auto rounded-lg border border-line bg-slate-900 p-3 font-mono text-xs text-slate-200">
                {activeLayoutJson}
              </pre>
            </div>
          </div>
        </Card>

        {/* KHỐI 4: FILE TEMPLATE ĐÍNH KÈM & VỊ TRÍ 3 Ô KÝ */}
        <Card>
          <div className="mb-4 border-b border-line pb-3">
            <h2 className="text-base font-semibold text-slate-800">
              File template phôi Word (.docx) & Tọa độ ô ký trên PDF
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* File template đính kèm */}
            <div className="flex flex-col space-y-3">
              <span className="text-xs font-semibold text-slate-700">
                File template phôi Word (.docx, tối đa 10 MB)
              </span>

              <label className="flex flex-1 min-h-[175px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-canvas p-6 text-center cursor-pointer hover:border-brand hover:bg-white transition">
                <Upload className="size-8 text-muted mb-2.5" />
                <span className="text-sm font-medium text-slate-800">
                  {templateFile ? templateFile.name : "Tải lên phôi Word (.docx)"}
                </span>
                <span className="text-xs text-muted mt-1">
                  Kéo thả hoặc nhấp để chọn file từ máy tính
                </span>
                <input
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {matchAnalysis && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 space-y-1">
                  <div className="font-semibold flex items-center justify-between">
                    <span>Kết quả đối chiếu placeholder phôi Word:</span>
                    <span className="rounded bg-blue-200 px-2 py-0.5 font-bold">
                      Khớp {matchAnalysis.matchedCount}/{matchAnalysis.totalInDoc}
                    </span>
                  </div>
                  {matchAnalysis.missing.length > 0 && (
                    <p className="text-red-700">
                      Thiếu trường trong biểu mẫu:{" "}
                      <span className="font-mono">{matchAnalysis.missing.join(", ")}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Vị trí 3 ô ký trên PDF */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700">
                Vị trí 3 ô ký trên PDF (Sinh viên, Lớp, Khoa) *
              </span>

              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2">Đối tượng</th>
                      <th className="px-2 py-2">Trang</th>
                      <th className="px-2 py-2">X</th>
                      <th className="px-2 py-2">Y</th>
                      <th className="px-2 py-2">Rộng</th>
                      <th className="px-2 py-2">Cao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {signatureSlots.map((slot, idx) => (
                      <tr key={slot.roleCode}>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {slot.role}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="1"
                            value={slot.page}
                            onChange={(e) => {
                              const copy = [...signatureSlots];
                              copy[idx].page = Number(e.target.value);
                              setSignatureSlots(copy);
                              markDirty();
                            }}
                            className="w-12 rounded border border-line px-1.5 py-1 text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={slot.x}
                            onChange={(e) => {
                              const copy = [...signatureSlots];
                              copy[idx].x = Number(e.target.value);
                              setSignatureSlots(copy);
                              markDirty();
                            }}
                            className="w-14 rounded border border-line px-1.5 py-1 text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={slot.y}
                            onChange={(e) => {
                              const copy = [...signatureSlots];
                              copy[idx].y = Number(e.target.value);
                              setSignatureSlots(copy);
                              markDirty();
                            }}
                            className="w-14 rounded border border-line px-1.5 py-1 text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={slot.width}
                            onChange={(e) => {
                              const copy = [...signatureSlots];
                              copy[idx].width = Number(e.target.value);
                              setSignatureSlots(copy);
                              markDirty();
                            }}
                            className="w-14 rounded border border-line px-1.5 py-1 text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={slot.height}
                            onChange={(e) => {
                              const copy = [...signatureSlots];
                              copy[idx].height = Number(e.target.value);
                              setSignatureSlots(copy);
                              markDirty();
                            }}
                            className="w-14 rounded border border-line px-1.5 py-1 text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <span className="block text-[11px] text-muted">
                Tọa độ dùng cho PdfBox chèn ảnh chữ ký 3 cấp vào phôi PDF cuối cùng.
              </span>
            </div>
          </div>
        </Card>

        {/* LÝ DO YÊU CẦU & GHI CHÚ */}
        <Card>
          <div className="mb-3 border-b border-line pb-2">
            <h2 className="text-base font-semibold text-slate-800">
              Lý do yêu cầu & Giải trình phê duyệt
            </h2>
          </div>

          <Textarea
            label="Lý do yêu cầu"
            placeholder="Nhập lý do tạo mới hoặc các ghi chú giải trình gửi tới người phê duyệt..."
            value={requestReason}
            maxLength={1000}
            onChange={(e) => {
              setRequestReason(e.target.value);
              markDirty();
            }}
          />
        </Card>
      </div>

      {/* MODAL 1: CHỌN FIELD CODES (Thêm phần tử) */}
      <Modal
        open={fieldModalOpen}
        wide
        title="Chọn trường thông tin thêm vào biểu mẫu"
        onClose={() => setFieldModalOpen(false)}
        footer={
          <>
            <Button onClick={() => setFieldModalOpen(false)}>Hủy</Button>
            <Button
              variant="primary"
              onClick={handleConfirmAddFields}
            >
              Xác nhận thêm ({tempSelectedFieldIds.size} trường)
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Tìm theo mã hoặc tên trường..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
            />
            <Select
              value={fieldCategoryFilter}
              onChange={(e) => setFieldCategoryFilter(e.target.value)}
            >
              <option value="">Tất cả nhóm trường</option>
              <option value="COMMON">COMMON</option>
              <option value="HEADER">HEADER</option>
              <option value="CRITERIA">CRITERIA</option>
              <option value="FOOTER">FOOTER</option>
            </Select>
          </div>

          <div className="max-h-[360px] overflow-y-auto rounded-lg border border-line divide-y divide-line">
            {allFieldCodes
              .filter((f) => {
                if (fieldCategoryFilter && f.category !== fieldCategoryFilter) return false;
                if (fieldSearch) {
                  const q = fieldSearch.toLowerCase();
                  return (
                    f.fieldCode?.toLowerCase().includes(q) ||
                    f.fieldName?.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((field) => {
                const isChecked = tempSelectedFieldIds.has(field.id);
                return (
                  <div
                    key={field.id}
                    onClick={() => handleToggleFieldSelection(field)}
                    className="flex cursor-pointer items-center justify-between p-3 hover:bg-canvas transition"
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckSquare className="size-4 text-brand" />
                      ) : (
                        <Square className="size-4 text-slate-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {field.fieldCode}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {field.category || "COMMON"}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{field.fieldName}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {field.dataType}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* MODAL 2: SAO CHÉP TỪ BIỂU MẪU KHÁC */}
      <Modal
        open={copyModalOpen}
        title="Sao chép cấu hình từ biểu mẫu khác"
        onClose={() => setCopyModalOpen(false)}
        footer={
          <Button onClick={() => setCopyModalOpen(false)}>Đóng</Button>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Chọn một phiên bản biểu mẫu có sẵn để sao chép toàn bộ danh sách trường dữ liệu sang biểu mẫu đang tạo:
          </p>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {availableTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-center justify-between rounded-lg border border-line p-3 hover:border-brand hover:bg-brand-soft transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{tpl.formCode}</span>
                    <span className="font-mono text-xs text-brand font-semibold">{tpl.versionNo}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{tpl.formName}</p>
                </div>
                <Button
                  variant="secondary"
                  className="text-xs h-8 px-2.5"
                  onClick={() => handleCopyFromOther(tpl)}
                >
                  Sao chép
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL 3: XÁC NHẬN HỦY / QUAY LẠI */}
      <Modal
        open={cancelModalOpen}
        title="Xác nhận hủy bỏ thao tác"
        onClose={() => setCancelModalOpen(false)}
        footer={
          <>
            <Button onClick={() => setCancelModalOpen(false)}>Tiếp tục chỉnh sửa</Button>
            <Button
              variant="danger"
              onClick={() => {
                setCancelModalOpen(false);
                navigate("/admin/form-versions");
              }}
            >
              Hủy bỏ và quay lại
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-700">
            Bạn có các thay đổi chưa được lưu. Nếu hủy bỏ, toàn bộ thông tin vừa nhập sẽ bị mất.
          </p>
          <p className="text-xs text-muted">Bạn có chắc chắn muốn quay về danh sách biểu mẫu không?</p>
        </div>
      </Modal>

      {/* MODAL 4: XÁC NHẬN THÊM MỚI PHIÊN BẢN */}
      <Modal
        open={confirmModalOpen}
        title="Xác nhận thêm mới phiên bản biểu mẫu"
        onClose={() => !isSubmitting && setConfirmModalOpen(false)}
        footer={
          <>
            <Button
              disabled={isSubmitting}
              onClick={() => setConfirmModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              loading={isSubmitting}
              onClick={handleFinalSubmit}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-green-50 p-3.5 border border-green-200 text-xs text-green-900 space-y-1.5">
            <div className="font-bold text-sm text-green-800">
              Kiểm tra thông tin trước khi lưu:
            </div>
            <p>• Mã biểu mẫu: <strong>{formCode}</strong> ({versionNo})</p>
            <p>• Tên phiên bản: <strong>{formName}</strong></p>
            <p>• Số lượng trường thông tin: <strong>{selectedFields.length} trường</strong></p>
            <p>• Trạng thái sau tạo: <strong>{isAutoActivate ? "Có hiệu lực (ACTIVE)" : "Vô hiệu hóa (INACTIVE)"}</strong></p>
          </div>

          <p className="text-xs text-slate-600">
            Hệ thống sẽ lưu phiên bản biểu mẫu mới vào cơ sở dữ liệu và chuyển sang trạng thái sẵn sàng áp dụng. Bạn có chắc chắn muốn tiến hành?
          </p>
        </div>
      </Modal>
    </>
  )
}

