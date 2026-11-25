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
  Square,
  GitCompare,
  Info,
  Calendar,
  Clock
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
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

export default function FormVersionEditPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  // Original template data fetched from server
  const [originalTemplate, setOriginalTemplate] = useState(null)
  const [loading, setLoading] = useState(true)

  // Form State
  const [formCode, setFormCode] = useState("")
  const [versionNo, setVersionNo] = useState("")
  const [formName, setFormName] = useState("")
  const [semesterId, setSemesterId] = useState("")
  const [description, setDescription] = useState("")
  const [scopeType, setScopeType] = useState("Toàn hệ thống")
  const [selectedDepts, setSelectedDepts] = useState([])
  const [effectiveFrom, setEffectiveFrom] = useState("")
  const [effectiveTo, setEffectiveTo] = useState("")
  const [isAutoActivate, setIsAutoActivate] = useState(false)
  const [requestReason, setRequestReason] = useState("") // Bắt buộc khi sửa

  // Field Codes & Tree Structure
  const [allFieldCodes, setAllFieldCodes] = useState([])
  const [selectedFields, setSelectedFields] = useState([])
  const [originalFields, setOriginalFields] = useState([])
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false)
  const [targetParentCode, setTargetParentCode] = useState(null)
  const [classConfigModalOpen, setClassConfigModalOpen] = useState(false)
  const [editingClassNode, setEditingClassNode] = useState(null)

  // Sample data & Layout JSON
  const [sampleDataJson, setSampleDataJson] = useState("{}")
  const [jsonError, setJsonError] = useState(null)
  const [customLayoutJson, setCustomLayoutJson] = useState("")

  // Template file (.docx)
  const [templateFile, setTemplateFile] = useState(null)
  const [matchAnalysis, setMatchAnalysis] = useState(null)

  // 3 Signature slots
  const [signatureSlots, setSignatureSlots] = useState([
    { role: "Sinh viên", roleCode: "STUDENT", page: 1, x: 100, y: 150, width: 140, height: 60 },
    { role: "Lớp trưởng", roleCode: "CLASS_LEADER", page: 1, x: 280, y: 150, width: 140, height: 60 },
    { role: "Trưởng Khoa", roleCode: "DEAN", page: 1, x: 460, y: 150, width: 140, height: 60 }
  ])

  // Modals & helpers
  const [semesters, setSemesters] = useState([])
  const [departments, setDepartments] = useState([])
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Check if original was active
  const isActiveVersion = originalTemplate?.status === "ACTIVE"
  // Có hiệu lực từ: Read-only nếu đã duyệt (ACTIVE) hoặc đã qua ngày hiệu lực
  const isEffectiveFromReadOnly = isActiveVersion || (originalTemplate?.effectiveFrom && new Date(originalTemplate.effectiveFrom) <= new Date())

  // Load existing data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [semRes, deptRes, fieldsRes, tplRes, allTplsRes] = await Promise.allSettled([
          client.get("/semesters"),
          client.get("/departments"),
          client.get("/fields?size=100"),
          formService.getTemplateById(id),
          formService.getTemplates()
        ]);

        if (semRes.status === "fulfilled" && semRes.value) {
          const list = Array.isArray(semRes.value) ? semRes.value : semRes.value.content || [];
          setSemesters(list);
        }

        if (deptRes.status === "fulfilled" && deptRes.value) {
          const list = Array.isArray(deptRes.value) ? deptRes.value : deptRes.value.content || [];
          setDepartments(list);
        }

        if (allTplsRes.status === "fulfilled" && allTplsRes.value) {
          const tpls = Array.isArray(allTplsRes.value) ? allTplsRes.value : allTplsRes.value.content || [];
          setAvailableTemplates(tpls);
        }

        let loadedFields = [];
        if (fieldsRes.status === "fulfilled" && fieldsRes.value) {
          const content = fieldsRes.value.content || fieldsRes.value.data || fieldsRes.value || [];
          loadedFields = Array.isArray(content) ? content.filter((f) => f.isActive !== false) : [];
          setAllFieldCodes(loadedFields);
        }

        if (tplRes.status === "fulfilled" && tplRes.value) {
          const tpl = tplRes.value.data || tplRes.value;
          setOriginalTemplate(tpl);

          setFormCode(tpl.formCode || "");
          setVersionNo(tpl.versionNo || "v1.0");
          setFormName(tpl.formName || "");
          setSemesterId(tpl.semesterId || "");
          setEffectiveFrom(tpl.effectiveFrom || "");
          setEffectiveTo(tpl.effectiveTo || "");
          setIsAutoActivate(tpl.status === "ACTIVE");

          // Extract fields, slots, and layout reliably
          if (tpl.templateLayoutJson) {
            const { fields, tree, signatureSlots: extractedSlots, rawLayout, scope } = extractFieldsAndSlotsFromTemplate(tpl, loadedFields);
            if (rawLayout) {
              setCustomLayoutJson(rawLayout);
            }
            const treeToUse = tree && tree.length > 0 ? tree : fields;
            if (treeToUse.length > 0) {
              setSelectedFields(treeToUse);
              setOriginalFields(treeToUse);
            }
            if (extractedSlots && extractedSlots.length > 0) {
              setSignatureSlots(extractedSlots);
            }
            if (scope) {
              if (scope === "ALL" || scope === "Toàn hệ thống") {
                setScopeType("Toàn hệ thống");
              } else if (Array.isArray(scope)) {
                setScopeType("Đơn vị cụ thể");
                setSelectedDepts(scope);
              }
            }
          }

          // Check if sessionStorage has a more recent designer layout
          const cachedLayout = sessionStorage.getItem(`drl_designer_layout_${id}`);
          if (cachedLayout) {
            setCustomLayoutJson(cachedLayout);
          }
        } else {
          toast.error("Không tìm thấy thông tin phiên bản biểu mẫu");
          navigate("/admin/form-versions");
        }
      } catch (e) {
        console.error("Lỗi nạp thông tin:", e);
        toast.error("Không thể tải thông tin phiên bản biểu mẫu");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id]);

  // Sync customLayoutJson if user navigates back from Form Designer
  useEffect(() => {
    const handleStorageOrFocus = () => {
      const cached = sessionStorage.getItem(`drl_designer_layout_${id}`);
      if (cached) {
        setCustomLayoutJson(cached);
      }
    };
    window.addEventListener("focus", handleStorageOrFocus);
    return () => window.removeEventListener("focus", handleStorageOrFocus);
  }, [id]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
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

  // 15: Cấu hình form JSON
  const generatedLayoutJson = JSON.stringify(
    {
      formCode,
      versionNo: isActiveVersion ? `${versionNo} (Sẽ tự động tạo phiên bản clone mới)` : versionNo,
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

  // Compute differences for "So sánh với phiên bản hiện hành"
  const computeDifferences = () => {
    const origCodes = new Set(originalFields.map((f) => f.fieldCode || f.code));
    const curCodes = new Set(selectedFields.map((f) => f.fieldCode || f.code));

    const addedFields = selectedFields.filter((f) => !origCodes.has(f.fieldCode || f.code));
    const removedFields = originalFields.filter((f) => !curCodes.has(f.fieldCode || f.code));
    const unchangedFields = selectedFields.filter((f) => origCodes.has(f.fieldCode || f.code));

    const propertyChanges = [];
    if (originalTemplate?.formName !== formName) {
      propertyChanges.push({
        label: "Tên phiên bản",
        oldVal: originalTemplate?.formName || "Trống",
        newVal: formName
      });
    }
    if (String(originalTemplate?.semesterId) !== String(semesterId)) {
      const oldSem = semesters.find((s) => String(s.id) === String(originalTemplate?.semesterId))?.semesterName || "Trống";
      const newSem = semesters.find((s) => String(s.id) === String(semesterId))?.semesterName || "Trống";
      propertyChanges.push({
        label: "Học kỳ áp dụng",
        oldVal: oldSem,
        newVal: newSem
      });
    }
    if (originalTemplate?.effectiveTo !== effectiveTo) {
      propertyChanges.push({
        label: "Ngày hết hiệu lực",
        oldVal: originalTemplate?.effectiveTo || "Vô thời hạn",
        newVal: effectiveTo || "Vô thời hạn"
      });
    }

    return {
      addedFields,
      removedFields,
      unchangedFields,
      propertyChanges,
      hasChanges: addedFields.length > 0 || removedFields.length > 0 || propertyChanges.length > 0
    };
  };

  // Validation
  const validateForm = () => {
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
    if (effectiveTo && effectiveFrom && new Date(effectiveTo) <= new Date(effectiveFrom)) {
      toast.error("Ngày hết hiệu lực phải sau ngày có hiệu lực");
      return false;
    }
    // BẮT BUỘC: Lý do yêu cầu khi sửa
    if (!requestReason.trim()) {
      toast.error("Lý do yêu cầu là bắt buộc khi chỉnh sửa phiên bản biểu mẫu");
      return false;
    }
    return true;
  };

  // Lưu nháp (Save draft)
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        formCode,
        formName,
        semesterId: Number(semesterId),
        templateLayoutJson: activeLayoutJson,
        status: "DRAFT",
        description: requestReason
      };
      await formService.updateTemplate(id, payload);
      toast.success("Lưu tạm phiên bản ở trạng thái Nháp thành công!");
      setIsDirty(false);
      navigate("/admin/form-versions");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Lỗi lưu bản nháp");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận cập nhật (Submit update)
  const handleFinalUpdate = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        formCode,
        formName,
        semesterId: Number(semesterId),
        templateLayoutJson: activeLayoutJson,
        status: isAutoActivate ? "ACTIVE" : "DRAFT",
        description: requestReason
      };
      const res = await formService.updateTemplate(id, payload);
      const newVersion = res?.versionNo || (isActiveVersion ? "phiên bản mới" : versionNo);
      toast.success(
        isActiveVersion
          ? `Đã tạo thành công phiên bản mới (${newVersion}) sao chép từ phiên bản cũ!`
          : "Cập nhật phiên bản biểu mẫu thành công!"
      );
      setConfirmModalOpen(false);
      setIsDirty(false);
      navigate("/admin/form-versions");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Lỗi cập nhật phiên bản");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setCancelModalOpen(true);
    } else {
      navigate("/admin/form-versions");
    }
  };

  const diffData = computeDifferences();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Clock className="size-8 animate-spin mx-auto text-brand" />
          <p className="mt-2 text-sm text-muted">Đang nạp dữ liệu phiên bản biểu mẫu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        title="Chỉnh sửa phiên bản biểu mẫu"
        description={`Cập nhật thông tin và cấu hình cho biểu mẫu ${formCode} (${versionNo}).`}
        action={
          <div className="flex gap-2">
            <Button onClick={handleCancel}>
              <ArrowLeft className="size-4" />
              Quay lại
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDiffModalOpen(true)}
              className="text-brand border-brand hover:bg-brand-soft"
            >
              <GitCompare className="size-4" />
              So sánh với phiên bản hiện hành
            </Button>
            <Button
              onClick={() => {
                sessionStorage.setItem(`drl_designer_layout_${id}`, activeLayoutJson);
                navigate(`/admin/form-versions/${id}/design`);
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

      {/* BANNER THÔNG BÁO NẾU ĐANG SỬA BẢN ACTIVE */}
      {isActiveVersion ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <Info className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-sm block mb-0.5">
              Cơ chế bảo đảm toàn vẹn dữ liệu lịch sử (Active Version Cloning):
            </span>
            Bạn đang sửa phiên bản <strong>{versionNo}</strong> đang ở trạng thái <strong>Hiệu lực</strong>.
            Hệ thống sẽ <strong>giữ nguyên phiên bản cũ</strong> để các phiếu ĐRL đang chấm không bị ảnh hưởng,
            đồng thời <strong>tạo một phiên bản mới (clone)</strong> với mã phiên bản được tăng tự động sau khi bạn xác nhận cập nhật.
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
          <Info className="size-4 shrink-0 text-blue-600" />
          <span>Phiên bản ở trạng thái <strong>{originalTemplate?.status}</strong>. Các thay đổi sẽ được cập nhật trực tiếp vào bản ghi này.</span>
        </div>
      )}

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

            {/* Tên phiên bản (Sửa được) */}
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

            {/* Học kỳ áp dụng (Sửa được) */}
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

            {/* Áp dụng cho (Sửa được) */}
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

            {/* Có hiệu lực từ (Read-only nếu đã duyệt) */}
            <div>
              <Input
                type="date"
                label="Có hiệu lực từ"
                value={effectiveFrom}
                disabled={isEffectiveFromReadOnly}
                className={isEffectiveFromReadOnly ? "bg-slate-50 cursor-not-allowed" : ""}
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
              <span>Kích hoạt phiên bản khi lưu</span>
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
              <Button
                variant="secondary"
                onClick={() => setCopyModalOpen(true)}
                className="text-xs h-9"
              >
                <Copy className="size-3.5" />
                Sao chép từ biểu mẫu khác
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDiffModalOpen(true)}
                className="text-xs h-9"
              >
                <GitCompare className="size-3.5 text-brand" />
                So sánh với phiên bản hiện hành
              </Button>
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
                onChange={(e) => {
                  setSampleDataJson(e.target.value);
                  markDirty();
                  try {
                    if (e.target.value.trim()) JSON.parse(e.target.value);
                    setJsonError(null);
                  } catch (err) {
                    setJsonError(err.message);
                  }
                }}
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

        {/* PHÔI WORD & CƠ CHẾ ĐỊNH VỊ CHỮ KÝ */}
        <Card>
          <div className="mb-4 border-b border-line pb-3">
            <h2 className="text-base font-semibold text-slate-800">
              File template phôi Word (.docx) & Cơ chế định vị chữ ký tự động
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Phôi Word */}
            <div className="flex flex-col space-y-3">
              <span className="text-xs font-semibold text-slate-700">
                File template phôi Word (.docx)
              </span>

              <label className="flex flex-1 min-h-[175px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-canvas p-6 text-center cursor-pointer hover:border-brand hover:bg-white transition">
                <Upload className="size-8 text-muted mb-2.5" />
                <span className="text-sm font-medium text-slate-800">
                  {templateFile ? templateFile.name : "Tải lên phôi Word mới (.docx)"}
                </span>
                <span className="text-xs text-muted mt-1">
                  Nhấp để thay đổi file phôi nếu cần điều chỉnh mẫu in
                </span>
                <input
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setTemplateFile(file);
                      markDirty();
                      toast.success(`Đã cập nhật phôi: ${file.name}`);
                    }
                  }}
                />
              </label>
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

        {/* LÝ DO YÊU CẦU (BẮT BUỘC KHI SỬA) */}
        <Card>
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <h2 className="text-base font-semibold text-slate-800">
              Lý do yêu cầu chỉnh sửa *
            </h2>
            <span className="text-xs font-semibold text-brand">Bắt buộc khi sửa</span>
          </div>

          <Textarea
            required
            label="Lý do chỉnh sửa phiên bản"
            placeholder="Nhập chi tiết lý do và căn cứ chỉnh sửa phiên bản biểu mẫu này (Bắt buộc)..."
            value={requestReason}
            maxLength={1000}
            onChange={(e) => {
              setRequestReason(e.target.value);
              markDirty();
            }}
          />
        </Card>
      </div>

      {/* MODAL 1: SO SÁNH VỚI PHIÊN BẢN HIỆN HÀNH (Diff Viewer) */}
      <Modal
        open={diffModalOpen}
        wide
        title={`So sánh khác biệt với phiên bản hiện hành (${versionNo})`}
        onClose={() => setDiffModalOpen(false)}
        footer={
          <Button onClick={() => setDiffModalOpen(false)}>Đóng</Button>
        }
      >
        <div className="space-y-4">
          {!diffData.hasChanges ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center text-slate-600 border border-line">
              <Check className="size-8 mx-auto text-green-500 mb-2" />
              <p className="font-semibold text-slate-800">Không có thay đổi</p>
              <p className="text-xs text-muted mt-1">Cấu hình đang sửa hoàn toàn trùng khớp với phiên bản ban đầu.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Thuộc tính chung thay đổi */}
              {diffData.propertyChanges.length > 0 && (
                <div className="rounded-lg border border-line p-3">
                  <span className="font-bold text-slate-800 text-sm block mb-2">Thay đổi thông tin cơ bản:</span>
                  <div className="space-y-1.5">
                    {diffData.propertyChanges.map((prop, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 w-36">{prop.label}:</span>
                        <span className="line-through text-red-600 bg-red-50 px-2 py-0.5 rounded">{prop.oldVal}</span>
                        <span>➔</span>
                        <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">{prop.newVal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thay đổi về trường thông tin */}
              <div className="grid gap-3 md:grid-cols-2">
                {/* Các trường mới thêm */}
                <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-green-800 mb-2">
                    <Plus className="size-4 text-green-600" />
                    <span>Trường được thêm mới ({diffData.addedFields.length}):</span>
                  </div>
                  {diffData.addedFields.length === 0 ? (
                    <p className="text-muted italic">Không thêm trường nào</p>
                  ) : (
                    <ul className="space-y-1">
                      {diffData.addedFields.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-green-700">
                          <span className="font-mono font-bold">+{f.fieldCode}</span>
                          <span>({f.fieldName})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Các trường đã gỡ */}
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-red-800 mb-2">
                    <Trash2 className="size-4 text-red-600" />
                    <span>Trường bị gỡ bỏ ({diffData.removedFields.length}):</span>
                  </div>
                  {diffData.removedFields.length === 0 ? (
                    <p className="text-muted italic">Không gỡ trường nào</p>
                  ) : (
                    <ul className="space-y-1">
                      {diffData.removedFields.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-red-700">
                          <span className="font-mono font-bold line-through">-{f.fieldCode}</span>
                          <span className="line-through">({f.fieldName})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: THÊM NODE VÀO CÂY */}
      <AddNodeModal
        open={addNodeModalOpen}
        onClose={() => setAddNodeModalOpen(false)}
        allFieldCodes={allFieldCodes}
        existingNodes={selectedFields}
        targetParentCode={targetParentCode}
        onAddNodes={handleAddNodes}
      />

      {/* MODAL 2.1: CẤU HÌNH LỚP */}
      <ClassConfigModal
        open={classConfigModalOpen}
        onClose={() => setClassConfigModalOpen(false)}
        classNode={editingClassNode}
        onSaveClassConfig={handleSaveClassConfig}
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
            Bạn có các thay đổi chưa được lưu. Nếu hủy bỏ, toàn bộ thông tin vừa chỉnh sửa sẽ bị mất.
          </p>
          <p className="text-xs text-muted">Bạn có chắc chắn muốn quay về danh sách biểu mẫu không?</p>
        </div>
      </Modal>

      {/* MODAL 4: XÁC NHẬN CẬP NHẬT PHIÊN BẢN BIỂU MẪU */}
      <Modal
        open={confirmModalOpen}
        title="Xác nhận cập nhật phiên bản biểu mẫu"
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
              onClick={handleFinalUpdate}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {isActiveVersion ? (
            <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold text-sm text-amber-800">
                Lưu ý quan trọng khi cập nhật phiên bản đang hiệu lực:
              </div>
              <p>• Phiên bản <strong>{versionNo}</strong> cũ sẽ được giữ nguyên không đổi để các phiếu đang chấm tiếp tục sử dụng.</p>
              <p>• Hệ thống sẽ tự động tạo một <strong>phiên bản mới (clone)</strong> để lưu các thay đổi này.</p>
              <p>• Lý do cập nhật: <em>"{requestReason}"</em></p>
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 p-3.5 border border-green-200 text-xs text-green-900 space-y-1.5">
              <div className="font-bold text-sm text-green-800">
                Xác nhận lưu cập nhật vào phiên bản:
              </div>
              <p>• Mã biểu mẫu: <strong>{formCode}</strong> ({versionNo})</p>
              <p>• Tên phiên bản: <strong>{formName}</strong></p>
              <p>• Số lượng trường thông tin: <strong>{selectedFields.length} trường</strong></p>
              <p>• Lý do cập nhật: <em>"{requestReason}"</em></p>
            </div>
          )}

          <p className="text-xs text-slate-600">
            Hệ thống sẽ tiến hành kiểm tra dữ liệu và lưu cấu hình biểu mẫu. Bạn có chắc chắn muốn tiếp tục?
          </p>
        </div>
      </Modal>

      {/* MODAL 5: SAO CHÉP TỪ BIỂU MẪU KHÁC (3-STEP WIZARD) */}
      <CopyFromOtherWizardModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        availableTemplates={availableTemplates}
        allFieldCodes={allFieldCodes}
        currentFields={selectedFields}
        onApplyCopy={handleApplyCopyFromWizard}
      />
    </>
  )
}
