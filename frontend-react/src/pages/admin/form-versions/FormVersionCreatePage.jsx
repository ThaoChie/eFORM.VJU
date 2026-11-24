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
import { useEffect, useState, useMemo } from "react"
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
import {
  extractFieldsAndSlotsFromTemplate,
  extractTreeFromTemplate,
  flattenTree,
  countTreeStats
} from "./formVersionUtils"
import CopyFromOtherWizardModal from "./components/CopyFromOtherWizardModal"
import ClassConfigModal from "./components/ClassConfigModal"
import AddNodeModal from "./components/AddNodeModal"
import FieldTreeTable from "./components/FieldTreeTable"

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

  // 7, 8: Danh sách trường thông tin biểu mẫu & Cấu hình lớp (Tree structure)
  const [allFieldCodes, setAllFieldCodes] = useState([])
  const [selectedFields, setSelectedFields] = useState([])
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false)
  const [targetParentCode, setTargetParentCode] = useState(null)
  const [classConfigModalOpen, setClassConfigModalOpen] = useState(false)
  const [editingClassNode, setEditingClassNode] = useState(null)

  // 9: Sao chép từ biểu mẫu khác (3-Step Wizard)
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

  // 14: Sinh từ cấu hình (Auto generate JSON from selected fields/classes)
  const handleGenerateSampleFromConfig = () => {
    if (selectedFields.length === 0) {
      toast.error("Chưa có trường thông tin nào trong biểu mẫu");
      return;
    }
    const sample = {};
    const flat = flattenTree(selectedFields);
    flat.forEach((field) => {
      const code = field.fieldCode || field.code;
      if (!code) return;
      if (field.isClass || field.dataType === "OBJECT") {
        sample[code] = {};
      } else if (field.dataType === "ARRAY") {
        sample[code] = [];
      } else if (field.dataType === "NUMBER") {
        sample[code] = 10;
      } else if (field.dataType === "DATE") {
        sample[code] = "2026-10-15";
      } else if (field.dataType === "BOOLEAN") {
        sample[code] = true;
      } else if (field.dataType === "FILE") {
        sample[code] = "https://minio.drl.edu.vn/proofs/sample.pdf";
      } else if (field.dataType === "SIGNATURE") {
        sample[code] = "data:image/png;base64,iVBORw0KGgo...";
      } else {
        sample[code] = `Giá trị mẫu ${field.fieldName || code}`;
      }
    });
    setSampleDataJson(JSON.stringify(sample, null, 2));
    setJsonError(null);
    markDirty();
    toast.success("Đã sinh dữ liệu mẫu từ danh sách trường!");
  };

  // Helper serialize recursive field tree to JSON
  const serializeFieldForLayout = (f) => ({
    fieldCode: f.fieldCode || f.code,
    fieldName: f.fieldName || f.name,
    dataType: f.dataType || f.type || "STRING",
    category: f.category || f.group || (f.isClass ? "CLASS" : "COMMON"),
    isRequired: !!f.isRequired,
    ...(f.isClass
      ? {
          isClass: true,
          classType: f.classType || (f.dataType === "ARRAY" ? "ARRAY" : "OBJECT"),
          effectiveFrom: f.effectiveFrom || null,
          effectiveTo: f.effectiveTo || null,
          isActive: f.isActive !== false,
          ...(f.classType === "ARRAY" || f.dataType === "ARRAY"
            ? {
                itemType: f.itemType || "OBJECT",
                min: f.min !== undefined ? f.min : 0,
                max: f.max !== undefined ? f.max : null
              }
            : {}),
          renderCondition: f.renderCondition || "",
          validationRules: f.validationRules || [],
          changeReason: f.changeReason || "",
          children: Array.isArray(f.children) ? f.children.map(serializeFieldForLayout) : []
        }
      : Array.isArray(f.children) && f.children.length > 0
      ? { children: f.children.map(serializeFieldForLayout) }
      : {})
  });

  // 15: Cấu hình form (jsonForm / templateLayoutJson)
  const generatedLayoutJson = JSON.stringify(
    {
      formCode,
      versionNo,
      formName,
      semesterId,
      scope: scopeType === "Toàn hệ thống" ? "ALL" : selectedDepts,
      fields: selectedFields.map(serializeFieldForLayout),
      signatureSlots
    },
    null,
    2
  );

  const activeLayoutJson = customLayoutJson || generatedLayoutJson;

  const formattedLayoutJson = useMemo(() => {
    if (!activeLayoutJson) return "";
    try {
      const parsed = typeof activeLayoutJson === "string" ? JSON.parse(activeLayoutJson) : activeLayoutJson;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return activeLayoutJson;
    }
  }, [activeLayoutJson]);

  const handleCopyLayoutJson = () => {
    navigator.clipboard.writeText(formattedLayoutJson || activeLayoutJson);
    toast.success("Đã sao chép cấu hình form vào clipboard!");
  };

  // 8: Thêm node vào cây (Atomic, Object, Array)
  const handleAddNodes = (newNodes, parentCode) => {
    if (!parentCode) {
      setSelectedFields((prev) => [...prev, ...newNodes]);
    } else {
      const addToChildren = (nodes) => {
        return nodes.map((node) => {
          if (node.fieldCode === parentCode) {
            const currentChildren = Array.isArray(node.children) ? node.children : [];
            return {
              ...node,
              children: [...currentChildren, ...newNodes]
            };
          }
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: addToChildren(node.children)
            };
          }
          return node;
        });
      };
      setSelectedFields((prev) => addToChildren(prev));
    }
    markDirty();
    analyzePlaceholders(templateFile, [...selectedFields, ...newNodes]);
    toast.success(
      `Đã thêm ${newNodes.length} node vào ${
        parentCode ? `lớp "${parentCode}"` : "gốc biểu mẫu"
      }.`
    );
  };

  // Cấu hình lớp
  const handleOpenClassConfig = (classNode) => {
    setEditingClassNode(classNode);
    setClassConfigModalOpen(true);
  };

  const handleSaveClassConfig = (updatedNode) => {
    const updateTree = (nodes) => {
      return nodes.map((node) => {
        if (node.fieldCode === updatedNode.fieldCode) {
          return {
            ...node,
            ...updatedNode,
            children: node.children || updatedNode.children || []
          };
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateTree(node.children)
          };
        }
        return node;
      });
    };
    setSelectedFields((prev) => updateTree(prev));
    markDirty();
    toast.success(`Đã cập nhật cấu hình lớp ${updatedNode.fieldCode}!`);
  };

  // Xóa node
  const handleDeleteNode = (nodeToDelete) => {
    const deleteFromTree = (nodes) => {
      return nodes
        .filter(
          (n) =>
            n.fieldCode !== nodeToDelete.fieldCode && n.id !== nodeToDelete.id
        )
        .map((n) => {
          if (n.children && n.children.length > 0) {
            return {
              ...n,
              children: deleteFromTree(n.children)
            };
          }
          return n;
        });
    };
    const next = deleteFromTree(selectedFields);
    setSelectedFields(next);
    markDirty();
    analyzePlaceholders(templateFile, next);
    toast.success(`Đã xóa "${nodeToDelete.fieldCode}".`);
  };

  // Di chuyển lên
  const handleMoveUp = (node) => {
    const moveInTree = (nodes) => {
      const idx = nodes.findIndex(
        (n) => n.fieldCode === node.fieldCode || n.id === node.id
      );
      if (idx > 0) {
        const copy = [...nodes];
        const temp = copy[idx];
        copy[idx] = copy[idx - 1];
        copy[idx - 1] = temp;
        return copy;
      }
      return nodes.map((n) => {
        if (n.children && n.children.length > 0) {
          return { ...n, children: moveInTree(n.children) };
        }
        return n;
      });
    };
    setSelectedFields((prev) => moveInTree(prev));
    markDirty();
  };

  // Di chuyển xuống
  const handleMoveDown = (node) => {
    const moveInTree = (nodes) => {
      const idx = nodes.findIndex(
        (n) => n.fieldCode === node.fieldCode || n.id === node.id
      );
      if (idx !== -1 && idx < nodes.length - 1) {
        const copy = [...nodes];
        const temp = copy[idx];
        copy[idx] = copy[idx + 1];
        copy[idx + 1] = temp;
        return copy;
      }
      return nodes.map((n) => {
        if (n.children && n.children.length > 0) {
          return { ...n, children: moveInTree(n.children) };
        }
        return n;
      });
    };
    setSelectedFields((prev) => moveInTree(prev));
    markDirty();
  };

  // Mở thêm phần tử con vào lớp
  const handleOpenAddChildNode = (parentNode) => {
    setTargetParentCode(parentNode.fieldCode);
    setAddNodeModalOpen(true);
  };

  // Dán node vào lớp hoặc gốc
  const handlePasteNode = (nodeToPaste, targetParent) => {
    const cloned = JSON.parse(JSON.stringify(nodeToPaste));
    cloned.id = `clone_${Date.now()}`;
    if (!targetParent) {
      setSelectedFields((prev) => [...prev, cloned]);
      toast.success(`Đã dán node "${cloned.fieldCode}" vào gốc biểu mẫu.`);
    } else {
      const addToChildren = (nodes) => {
        return nodes.map((n) => {
          if (n.fieldCode === targetParent) {
            return {
              ...n,
              children: [...(n.children || []), cloned]
            };
          }
          if (n.children && n.children.length > 0) {
            return { ...n, children: addToChildren(n.children) };
          }
          return n;
        });
      };
      setSelectedFields((prev) => addToChildren(prev));
      toast.success(
        `Đã dán node "${cloned.fieldCode}" vào lớp "${targetParent}".`
      );
    }
    markDirty();
  };

  // 9: Áp dụng sao chép từ Wizard 3 bước
  const handleApplyCopyFromWizard = ({
    fields,
    sourceVersion,
    signatureSlots: slots,
    rawLayout,
    scope
  }) => {
    if (fields && fields.length > 0) {
      setSelectedFields(fields);
      analyzePlaceholders(templateFile, fields);
    }
    if (slots && slots.length > 0) {
      setSignatureSlots(slots);
    }
    if (rawLayout) {
      setCustomLayoutJson(rawLayout);
    }
    if (scope) {
      if (scope === "ALL" || scope === "Toàn hệ thống") {
        setScopeType("Toàn hệ thống");
      } else if (Array.isArray(scope)) {
        setScopeType("Đơn vị cụ thể");
        setSelectedDepts(scope);
      }
    }
    if (sourceVersion?.description && !description) {
      setDescription(sourceVersion.description);
    }
    markDirty();
    toast.success(
      `Đã áp dụng thành công ${fields.length} trường từ ${
        sourceVersion?.formCode || "nguồn"
      } (${sourceVersion?.versionNo || ""})!`
    );
  };

  // 16: Upload & Analyze Template File (.docx)
  const analyzePlaceholders = (file, fields = selectedFields, rawJson = customLayoutJson) => {
    if (!file) {
      setMatchAnalysis(null);
      return;
    }

    // Làm phẳng toàn bộ cây trường thông tin (bao gồm cả các node con trong Lớp / Group)
    const flatFields = flattenTree(fields);
    const fieldCodesSet = new Set(flatFields.map((f) => f.fieldCode || f.code));

    // Bổ sung các key từ customLayoutJson nếu có
    if (rawJson) {
      try {
        const parsed = JSON.parse(rawJson);
        const extractKeys = (obj) => {
          if (!obj) return;
          if (Array.isArray(obj)) {
            obj.forEach((item) => extractKeys(item));
          } else if (typeof obj === "object") {
            if (obj.fieldCode) fieldCodesSet.add(obj.fieldCode);
            if (obj.code) fieldCodesSet.add(obj.code);
            if (obj.id) fieldCodesSet.add(obj.id);
            Object.keys(obj).forEach((k) => {
              if (typeof obj[k] === "number" || typeof obj[k] === "string") {
                fieldCodesSet.add(k);
              } else if (typeof obj[k] === "object") {
                extractKeys(obj[k]);
              }
            });
          }
        };
        extractKeys(parsed);
      } catch (e) {
        // ignore json parse error
      }
    }

    // Các trường thông tin sinh viên hệ thống tự động điền từ tài khoản sinh viên
    const SYSTEM_PROFILE_FIELDS = [
      "student_name",
      "student_code",
      "student_class"
    ];

    // Các trường tiêu chí đánh giá trong phôi ĐRL (kèm alias mapping các mã tiêu chí)
    const REQUIRED_EVAL_FIELDS = [
      { key: "study_attendance", aliases: ["score_1_1", "study_attendance", "total_section_1", "group_1"] },
      { key: "proof_volunteer", aliases: ["score_3_2", "proof_volunteer", "total_section_3", "group_3"] },
      { key: "student_gpa_score", aliases: ["score_1_5", "student_gpa_score", "score_1_5_gpa_sv"] },
      {
        key: "student_total",
        aliases: [
          "total_drl_score",
          "grand_total_sv",
          "grand_total_lop",
          "student_total",
          "total_section_5",
          "total_section_1",
          "score_5_4",
          "score_5_1",
          "group_5"
        ]
      }
    ];

    let matchedCount = 0;
    const totalInDoc = SYSTEM_PROFILE_FIELDS.length + REQUIRED_EVAL_FIELDS.length; // 7
    const missing = [];
    const systemProvided = [];

    // 1. Kiểm tra trường hệ thống (họ tên, MSSV, lớp)
    SYSTEM_PROFILE_FIELDS.forEach((sf) => {
      matchedCount++;
      systemProvided.push(sf);
    });

    // 2. Kiểm tra trường tiêu chí
    REQUIRED_EVAL_FIELDS.forEach(({ key, aliases }) => {
      const isMatched =
        aliases.some((a) => fieldCodesSet.has(a)) ||
        (key === "student_total" && (fieldCodesSet.size >= 5 || fieldCodesSet.has("total_section_5") || fieldCodesSet.has("group_5")));

      if (isMatched) {
        matchedCount++;
      } else {
        missing.push(key);
      }
    });

    setMatchAnalysis({
      totalInDoc,
      matchedCount,
      missing,
      systemProvided
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

        {/* KHỐI 2: TRƯỜNG THÔNG TIN BIỂU MẪU & CẤU HÌNH LỚP (CÂY DỮ LIỆU) */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Trường thông tin biểu mẫu & Cấu hình lớp *
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Cấu trúc cây dữ liệu gồm các trường nguyên tử (STRING, NUMBER, DATE, ...) và các Lớp (OBJECT, ARRAY).
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Sao chép từ biểu mẫu khác (3-step wizard) */}
              <Button
                variant="secondary"
                onClick={() => setCopyModalOpen(true)}
                className="text-xs h-9"
              >
                <Copy className="size-3.5" />
                Sao chép từ biểu mẫu khác
              </Button>
              {/* Thêm node vào cây */}
              <Button
                variant="primary"
                onClick={() => {
                  setTargetParentCode(null);
                  setAddNodeModalOpen(true);
                }}
                className="text-xs h-9"
              >
                <Plus className="size-3.5" />
                Thêm node vào cây
              </Button>
            </div>
          </div>

          <FieldTreeTable
            nodes={selectedFields}
            onOpenClassConfig={handleOpenClassConfig}
            onOpenAddChildNode={handleOpenAddChildNode}
            onDeleteNode={handleDeleteNode}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onPasteNode={handlePasteNode}
          />
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
            <div className="space-y-2 flex flex-col">
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
                className={`h-[300px] w-full resize-none rounded-lg border font-mono text-xs p-3 outline-none focus:ring-2 focus:ring-brand-soft overflow-auto ${
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
            <div className="space-y-2 flex flex-col">
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

              <pre className="h-[300px] w-full overflow-auto rounded-lg border border-line bg-slate-900 p-3 font-mono text-xs text-slate-200">
                {formattedLayoutJson || activeLayoutJson}
              </pre>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Check className="size-3.5 shrink-0 text-brand" />
                <span>Cấu trúc JSON layout đồng bộ theo cây tiêu chí</span>
              </div>
            </div>
          </div>
        </Card>

        {/* KHỐI 4: FILE TEMPLATE ĐÍNH KÈM & CƠ CHẾ ĐỊNH VỊ CHỮ KÝ */}
        <Card>
          <div className="mb-4 border-b border-line pb-3">
            <h2 className="text-base font-semibold text-slate-800">
              File template phôi Word (.docx) & Cơ chế định vị chữ ký tự động
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
                <div
                  className={`rounded-lg border p-3 text-xs space-y-1.5 ${
                    matchAnalysis.missing.length === 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-blue-200 bg-blue-50 text-blue-900"
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle
                        className={`size-4 ${
                          matchAnalysis.missing.length === 0
                            ? "text-emerald-600"
                            : "text-blue-600"
                        }`}
                      />
                      Kết quả đối chiếu placeholder phôi Word:
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 font-bold ${
                        matchAnalysis.missing.length === 0
                          ? "bg-emerald-200 text-emerald-800"
                          : "bg-blue-200 text-blue-800"
                      }`}
                    >
                      Khớp {matchAnalysis.matchedCount}/{matchAnalysis.totalInDoc}
                    </span>
                  </div>
                  {matchAnalysis.missing.length > 0 && (
                    <p className="text-amber-700">
                      Thiếu tiêu chí rèn luyện trong biểu mẫu:{" "}
                      <span className="font-mono">{matchAnalysis.missing.join(", ")}</span>
                    </p>
                  )}
                  {matchAnalysis.systemProvided && matchAnalysis.systemProvided.length > 0 && (
                    <p className="text-slate-600 text-[11px]">
                      <span className="font-medium text-emerald-700">✓ Tự động điền từ hồ sơ SV:</span>{" "}
                      <span className="font-mono">{matchAnalysis.systemProvided.join(", ")}</span>
                    </p>
                  )}
                  {matchAnalysis.missing.length === 0 && (
                    <p className="text-emerald-700 font-medium">
                      ✓ Phôi Word hoàn toàn tương thích và khớp 100% với cấu trúc biểu mẫu!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cơ chế định vị chữ ký động qua Marker Tag */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Vị trí chữ ký trên PDF (Sinh viên, Lớp, Khoa)
                </span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  100% Tự động qua Marker Tag
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hệ thống không sử dụng tọa độ cố định. Backend <strong>PdfSignatureEngine</strong> sẽ tự động dò tìm vị trí từ khóa đánh dấu trong file PDF xuất ra để chèn chữ ký:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 shadow-xs">
                    <div>
                      <span className="font-semibold text-slate-800">1. Chữ ký Sinh viên</span>
                      <p className="text-[11px] text-muted">Tự động chèn khi sinh viên nộp phiếu</p>
                    </div>
                    <span className="font-mono font-bold text-brand bg-brand-soft/60 px-2.5 py-1 rounded text-xs border border-brand/20">
                      [[SIG_STUDENT]]
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 shadow-xs">
                    <div>
                      <span className="font-semibold text-slate-800">2. Chữ ký Cán bộ lớp</span>
                      <p className="text-[11px] text-muted">Tự động chèn khi lớp trưởng duyệt</p>
                    </div>
                    <span className="font-mono font-bold text-brand bg-brand-soft/60 px-2.5 py-1 rounded text-xs border border-brand/20">
                      [[SIG_CLASS]]
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 shadow-xs">
                    <div>
                      <span className="font-semibold text-slate-800">3. Chữ ký Trưởng Khoa / BCN</span>
                      <p className="text-[11px] text-muted">Tự động chèn và cấp chứng thư PAdES</p>
                    </div>
                    <span className="font-mono font-bold text-brand bg-brand-soft/60 px-2.5 py-1 rounded text-xs border border-brand/20">
                      [[SIG_DEAN]]
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 bg-emerald-50/60 border border-emerald-200/60 rounded-md p-2">
                  <CheckCircle className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Bảng điểm dù dãn dài bao nhiêu trang hoặc vùng ký bị nhảy sang trang tiếp theo, chữ ký luôn được định vị và đóng đúng 100% vào ô ký tương ứng.
                  </span>
                </div>
              </div>
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

      {/* MODAL 1: THÊM NODE VÀO CÂY */}
      <AddNodeModal
        open={addNodeModalOpen}
        onClose={() => setAddNodeModalOpen(false)}
        allFieldCodes={allFieldCodes}
        existingNodes={selectedFields}
        targetParentCode={targetParentCode}
        onAddNodes={handleAddNodes}
      />

      {/* MODAL 2: CẤU HÌNH LỚP */}
      <ClassConfigModal
        open={classConfigModalOpen}
        onClose={() => setClassConfigModalOpen(false)}
        classNode={editingClassNode}
        onSaveClassConfig={handleSaveClassConfig}
      />

      {/* MODAL 3: SAO CHÉP TỪ BIỂU MẪU KHÁC (3-STEP WIZARD) */}
      <CopyFromOtherWizardModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        availableTemplates={availableTemplates}
        allFieldCodes={allFieldCodes}
        currentFields={selectedFields}
        onApplyCopy={handleApplyCopyFromWizard}
      />

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

