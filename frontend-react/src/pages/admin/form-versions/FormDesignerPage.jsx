import {
  ArrowLeft,
  Eye,
  FileCode,
  FileText,
  Save,
  Undo2,
  Redo2,
  Search,
  Check,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  GripVertical,
  Lock,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  ClipboardCopy,
  Sliders,
  Settings,
  X,
  FolderPlus,
  FolderKanban,
  CornerDownRight,
  LayoutDashboard
} from "lucide-react"
import React, { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import {
  Button,
  Card,
  IconButton,
  Input,
  Modal,
  Select,
  Textarea
} from "../../../components/ui/Primitives"
import Renderer from "../../../components/form-builder/Renderer"
import { formService } from "../../../services/form-service"
import { client } from "../../../lib/axios/client"

// CẤU TRÚC 5 NHÓM TIÊU CHÍ CHUẨN (100Đ) THEO ĐÚNG PHÔI WORD (Phoi_Mau_Phieu_DRL_2026.docx)
const OFFICIAL_DRL_2026_BLOCKS = [
  {
    id: "group_1",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_1",
    title: "1. Ý thức và kết quả học tập, nghiên cứu khoa học",
    description: "Đánh giá ý thức thái độ trên lớp, tham gia NCKH, thi học thuật, vượt khó và kết quả GPA.",
    maxScore: 20,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_1_1",
        type: "CRITERIA",
        fieldCode: "score_1_1",
        title: "1.1. Ý thức và thái độ trong học tập",
        description: "Đi học đầy đủ, nghiêm túc trong giờ học, hoàn thành bài tập khi lên lớp.",
        maxScore: 3,
        isRequired: true,
        requiresProof: false
      },
      {
        id: "crit_1_2",
        type: "CRITERIA",
        fieldCode: "score_1_2",
        title: "1.2. Ý thức, thái độ tham gia các CLB học thuật, hoạt động ngoại khóa, giao lưu, NCKH",
        description: "Tham gia tích cực một hoặc nhiều hoạt động giao lưu học thuật, NCKH, Ngoại ngữ.",
        maxScore: 3,
        isRequired: false,
        requiresProof: true
      },
      {
        id: "crit_1_3",
        type: "CRITERIA",
        fieldCode: "score_1_3",
        title: "1.3. Ý thức và thái độ tham gia các kỳ thi, cuộc thi",
        description: "Chấp hành tốt quy chế thi và các quy định phòng thi.",
        maxScore: 3,
        isRequired: true,
        requiresProof: false
      },
      {
        id: "crit_1_4",
        type: "CRITERIA",
        fieldCode: "score_1_4",
        title: "1.4. Tinh thần vượt khó, có nỗ lực phấn đấu vươn lên trong học tập",
        description: "+ GPA duy trì ≥ 3.6 hoặc kết quả kỳ này cao hơn kỳ trước: 3đ\n+ GPA giảm trong khoảng 0.1đ – 0.3đ: 2đ\n+ GPA giảm trong khoảng 0.3đ – 0.5đ: 1đ",
        maxScore: 3,
        isRequired: false,
        requiresProof: false
      },
      {
        id: "crit_1_5",
        type: "CRITERIA",
        fieldCode: "score_1_5",
        title: "1.5. Kết quả học tập, nghiên cứu khoa học (Tối đa 8đ)",
        description: "- Điểm kết quả học tập (GPA):\n  + Khá (2.5 ≤ GPA < 3.2): 2đ\n  + Giỏi (3.2 ≤ GPA < 3.6): 3đ\n  + Xuất sắc (GPA ≥ 3.6): 4đ\n- Đạt giải Nghiên cứu khoa học:\n  + Cấp Khoa: 2đ | Cấp Trường: 3đ | Cấp ĐHQGHN: 4đ",
        maxScore: 8,
        isRequired: true,
        requiresProof: true
      }
    ]
  },
  {
    id: "group_2",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_2",
    title: "2. Ý thức chấp hành các nội quy, quy chế, quy định của Trường và ĐHQGHN",
    description: "Chấp hành chủ trương của Đảng, Nhà nước và nội quy, quy chế thi cử, kỷ luật của Trường.",
    maxScore: 25,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_2_1",
        type: "CRITERIA",
        fieldCode: "score_2_1",
        title: "2.1. Ý thức chấp hành các văn bản chỉ đạo của Đảng, Nhà nước, Bộ GD&ĐT và ĐHQGHN",
        description: "Nghiêm chỉnh chấp hành pháp luật, các chủ trương chính sách và quy định chung.",
        maxScore: 15,
        isRequired: true,
        requiresProof: false
      },
      {
        id: "crit_2_2",
        type: "CRITERIA",
        fieldCode: "score_2_2",
        title: "2.2. Ý thức chấp hành các nội quy, quy chế, quy định của Khoa, Trường và đơn vị",
        description: "- Vi phạm quy chế thi bị lập biên bản nhưng không bị đình chỉ thi: trừ 10đ\n- Vi phạm quy chế thi bị lập biên bản và bị đình chỉ thi: trừ 20đ\n- Kỷ luật mức Khiển trách: trừ 20đ | Cảnh cáo: trừ 25đ",
        maxScore: 10,
        isRequired: true,
        requiresProof: false
      }
    ]
  },
  {
    id: "group_3",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_3",
    title: "3. Ý thức tham gia các hoạt động chính trị - xã hội, văn hoá, thể thao, phòng chống TNXH",
    description: "Tham gia tuần sinh hoạt công dân, hoạt động rèn luyện chính trị xã hội, tình nguyện công ích.",
    maxScore: 20,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_3_1",
        type: "CRITERIA",
        fieldCode: "score_3_1",
        title: "3.1. Ý thức và hiệu quả tham gia hoạt động chính trị, xã hội, văn hóa, thể thao",
        description: "- Không tham gia Tuần Sinh hoạt công dân sinh viên: trừ 10đ\n- Không tham gia hoạt động khác do Trường tổ chức/yêu cầu: vắng 1 lần trừ 5đ, từ 2 lần trở lên trừ 10đ",
        maxScore: 10,
        isRequired: true,
        requiresProof: false
      },
      {
        id: "crit_3_2",
        type: "CRITERIA",
        fieldCode: "score_3_2",
        title: "3.2. Tham gia các hoạt động công ích, tình nguyện, công tác xã hội, hỗ trợ sự kiện",
        description: "Có minh chứng kèm theo: danh sách tham dự, giấy chứng nhận, giấy khen...",
        maxScore: 5,
        isRequired: false,
        requiresProof: true
      },
      {
        id: "crit_3_3",
        type: "CRITERIA",
        fieldCode: "score_3_3",
        title: "3.3. Ý thức tham gia tuyên truyền, phòng chống tội phạm và các tệ nạn xã hội",
        description: "Tích cực tham gia giữ gìn an ninh trật tự, phòng chống tệ nạn học đường và xã hội.",
        maxScore: 5,
        isRequired: true,
        requiresProof: false
      }
    ]
  },
  {
    id: "group_4",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_4",
    title: "4. Ý thức công dân và quan hệ với cộng đồng",
    description: "Tuyên truyền chủ trương pháp luật, hoạt động tình nguyện Đoàn TN, tinh thần tương thân tương ái.",
    maxScore: 25,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_4_1",
        type: "CRITERIA",
        fieldCode: "score_4_1",
        title: "4.1. Ý thức chấp hành và tuyên truyền chủ trương của Đảng, chính sách pháp luật trong cộng đồng",
        description: "Gương mẫu chấp hành pháp luật tại nơi cư trú và cộng đồng xã hội.",
        maxScore: 10,
        isRequired: true,
        requiresProof: false
      },
      {
        id: "crit_4_2",
        type: "CRITERIA",
        fieldCode: "score_4_2",
        title: "4.2. Ý thức tham gia hoạt động xã hội có thành tích, hoạt động tình nguyện Đoàn TN",
        description: "Mùa đông ấm, Mùa hè xanh, Hiến máu nhân đạo...\n+ Tham gia tình nguyện trực tiếp: 10đ\n+ Chuẩn bị cho các chiến dịch nhưng không tham dự: 5đ\n(Có minh chứng kèm theo: giấy chứng nhận, giấy khen...)",
        maxScore: 10,
        isRequired: false,
        requiresProof: true
      },
      {
        id: "crit_4_3",
        type: "CRITERIA",
        fieldCode: "score_4_3",
        title: "4.3. Tinh thần chia sẻ, giúp đỡ bạn bè, người thân, người gặp khó khăn hoạn nạn",
        description: "Có hành động giúp đỡ bạn bè vượt khó, tham gia quyên góp ủng hộ cộng đồng.",
        maxScore: 5,
        isRequired: false,
        requiresProof: false
      }
    ]
  },
  {
    id: "group_5",
    type: "CRITERIA_GROUP",
    fieldCode: "total_section_5",
    title: "5. Ý thức và kết quả tham gia công tác lớp, đoàn thể, thành tích đặc biệt",
    description: "Đảm nhận nhiệm vụ cán bộ lớp, Đoàn - Hội, kỹ năng tổ chức và thành tích đặc biệt cho ĐHQGHN.",
    maxScore: 10,
    calculationMode: "CLAMPED_SUM",
    children: [
      {
        id: "crit_5_1",
        type: "CRITERIA",
        fieldCode: "score_5_1",
        title: "5.1. Ý thức, tinh thần, uy tín và hiệu quả công việc khi được phân công quản lý lớp, đoàn thể",
        description: "+ Chủ nhiệm, Bí thư, BĐH, BĐP, Ban Chấp hành: 3đ\n+ Phó Chủ nhiệm, Phó Bí thư, Lớp phó: 2đ\n+ Trưởng ban các CLB: 1đ",
        maxScore: 3,
        isRequired: false,
        requiresProof: false
      },
      {
        id: "crit_5_2",
        type: "CRITERIA",
        fieldCode: "score_5_2",
        title: "5.2. Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn TN, Hội SV, CLB",
        description: "+ Chủ nhiệm, Bí thư, BĐH, BĐP, Ban Chấp hành: 2đ\n+ Phó Chủ nhiệm, Phó Bí thư, Lớp phó: 2đ\n+ Trưởng ban: 1đ",
        maxScore: 2,
        isRequired: false,
        requiresProof: false
      },
      {
        id: "crit_5_3",
        type: "CRITERIA",
        fieldCode: "score_5_3",
        title: "5.3. Hỗ trợ và tham gia tích cực vào các hoạt động chung của lớp, khoa và đơn vị",
        description: "Nhiệt tình tham gia chuẩn bị, điều phối các buổi sinh hoạt lớp và sự kiện.",
        maxScore: 2,
        isRequired: true,
        requiresProof: false
      },
      {
        id: "crit_5_4",
        type: "CRITERIA",
        fieldCode: "score_5_4",
        title: "5.4. Thành tích đặc biệt trong học tập, rèn luyện góp phần quảng bá hình ảnh ĐHQGHN",
        description: "Có giải thưởng văn thể mỹ, học thuật cấp Quốc gia/Quốc tế hoặc khen thưởng đặc biệt (Có minh chứng kèm theo).",
        maxScore: 3,
        isRequired: false,
        requiresProof: true
      }
    ]
  }
];

export default function FormDesignerPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id || id === "new"

  // Form metadata
  const [formName, setFormName] = useState("Phiếu Đánh giá Điểm Rèn luyện")
  const [formCode, setFormCode] = useState("DRL-2026")
  const [versionNo, setVersionNo] = useState("v1.0")
  const [semesterName, setSemesterName] = useState("Học kỳ 1 Năm 2026-2027")
  const [semesterId, setSemesterId] = useState(null)

  // Available Field Codes list
  const [allFieldCodes, setAllFieldCodes] = useState([])
  const [fieldSearch, setFieldSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")

  // Canvas Blocks
  const [blocks, setBlocks] = useState([])
  const [selectedBlockId, setSelectedBlockId] = useState(null)

  // Undo / Redo History
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Formula & Ranking Scale
  const [scoreFormula, setScoreFormula] = useState("SUM")
  const [rankingScale, setRankingScale] = useState([
    { rank: "Xuất sắc", minScore: 90, maxScore: 100, color: "text-purple-700 bg-purple-50 border-purple-200" },
    { rank: "Tốt", minScore: 80, maxScore: 89, color: "text-green-700 bg-green-50 border-green-200" },
    { rank: "Khá", minScore: 65, maxScore: 79, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { rank: "Trung bình", minScore: 50, maxScore: 64, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { rank: "Yếu", minScore: 35, maxScore: 49, color: "text-orange-700 bg-orange-50 border-orange-200" },
    { rank: "Kém", minScore: 0, maxScore: 34, color: "text-red-700 bg-red-50 border-red-200" }
  ])

  // Modals & Sidebar Tab
  const [sidebarTab, setSidebarTab] = useState("PROPERTIES") // "PROPERTIES" | "REGULATIONS"
  const [previewOpen, setPreviewOpen] = useState(false)
  const [exportJsonOpen, setExportJsonOpen] = useState(false)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch initial fields and existing form version layout
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [fieldsRes, tplRes] = await Promise.allSettled([
          client.get("/fields?size=100"),
          !isNew ? formService.getTemplateById(id) : Promise.resolve(null)
        ]);

        let loadedFields = [];
        if (fieldsRes.status === "fulfilled" && fieldsRes.value) {
          const content = fieldsRes.value.content || fieldsRes.value.data || fieldsRes.value || [];
          loadedFields = Array.isArray(content) ? content.filter((f) => f.isActive !== false) : [];
          setAllFieldCodes(loadedFields);
        }

        if (tplRes.status === "fulfilled" && tplRes.value) {
          const tpl = tplRes.value.data || tplRes.value;
          if (tpl) {
            setFormName(tpl.formName || formName);
            setFormCode(tpl.formCode || formCode);
            setVersionNo(tpl.versionNo || versionNo);
            setSemesterName(tpl.semesterName || semesterName);
            if (tpl.semesterId || tpl.semester?.id) {
              setSemesterId(tpl.semesterId || tpl.semester?.id);
            }

            if (tpl.templateLayoutJson) {
              try {
                const layout = typeof tpl.templateLayoutJson === "string"
                  ? JSON.parse(tpl.templateLayoutJson)
                  : tpl.templateLayoutJson;

                if (layout.blocks && Array.isArray(layout.blocks)) {
                  setBlocks(layout.blocks);
                  pushHistory(layout.blocks);
                  if (layout.blocks.length > 0) setSelectedBlockId(layout.blocks[0].id);
                  return;
                } else if (layout.fields && Array.isArray(layout.fields)) {
                  // Convert fields to blocks
                  const initialBlocks = layout.fields.map((f, i) => ({
                    id: `block_${f.fieldCode}_${i}`,
                    type: "CRITERIA",
                    fieldCode: f.fieldCode,
                    title: f.fieldName || f.fieldCode,
                    description: `Đánh giá mức độ hoàn thành nhiệm vụ theo quy chế ${f.fieldCode}.`,
                    maxScore: 20,
                    isRequired: !!f.isRequired,
                    requiresProof: f.fieldCode.includes("proof") || f.dataType === "FILE"
                  }));
                  setBlocks(initialBlocks);
                  pushHistory(initialBlocks);
                  if (initialBlocks.length > 0) setSelectedBlockId(initialBlocks[0].id);
                  return;
                }
              } catch (e) {
                console.warn("Could not parse layout json:", e);
              }
            }
          }
        }

        // Khi tạo mới (isNew) hoặc chưa có cấu hình: Để canvas trắng tinh để người dùng tự builder
        setBlocks([]);
        pushHistory([]);
        setSelectedBlockId(null);
      } catch (err) {
        console.error("Lỗi khởi tạo Designer:", err);
      }
    };

    loadInitialData();
  }, [id, isNew]);

  // Push state to Undo/Redo history
  const pushHistory = (newBlocks) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newBlocks];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const updateBlocksWithHistory = (newBlocks) => {
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setIsDirty(true);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setBlocks(history[nextIdx]);
      setIsDirty(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setBlocks(history[nextIdx]);
      setIsDirty(true);
    }
  };

  // Set of field codes currently used in canvas (both top-level and children)
  const usedFieldCodes = useMemo(() => {
    const codes = new Set();
    blocks.forEach((b) => {
      if (b.fieldCode) codes.add(b.fieldCode);
      if (b.children && Array.isArray(b.children)) {
        b.children.forEach((c) => {
          if (c.fieldCode) codes.add(c.fieldCode);
        });
      }
    });
    return codes;
  }, [blocks]);

  // Total Max Score across canvas (groups contribute their group.maxScore, standalone contribute their own maxScore)
  const totalMaxScore = useMemo(() => {
    return blocks.reduce((acc, b) => {
      if (b.type === "CRITERIA_GROUP") {
        return acc + (Number(b.maxScore) || 0);
      }
      if (b.type === "CRITERIA" || b.type === "SCORE_INPUT") {
        return acc + (Number(b.maxScore) || 0);
      }
      return acc;
    }, 0);
  }, [blocks]);

  // Selected block details (could be a group, standalone, or child inside a group)
  const selectedInfo = useMemo(() => {
    for (const b of blocks) {
      if (b.id === selectedBlockId) {
        return { block: b, isGroup: b.type === "CRITERIA_GROUP", parentGroup: null };
      }
      if (b.children && Array.isArray(b.children)) {
        const child = b.children.find((c) => c.id === selectedBlockId);
        if (child) {
          return { block: child, isGroup: false, parentGroup: b };
        }
      }
    }
    return null;
  }, [blocks, selectedBlockId]);

  // Add a new Criteria Group container to canvas
  const handleAddCriteriaGroup = () => {
    const groupCount = blocks.filter((b) => b.type === "CRITERIA_GROUP").length + 1;
    const newGroup = {
      id: `group_${Date.now()}`,
      type: "CRITERIA_GROUP",
      fieldCode: `group_${Date.now().toString().slice(-4)}`,
      title: `${blocks.length + 1}. Nhóm tiêu chí ${groupCount}`,
      description: "Đánh giá theo nhóm chỉ tiêu rèn luyện.",
      maxScore: 20,
      calculationMode: "CLAMPED_SUM", // CLAMPED_SUM | STRICT_SUM
      children: []
    };
    const nextBlocks = [...blocks, newGroup];
    updateBlocksWithHistory(nextBlocks);
    setSelectedBlockId(newGroup.id);
    toast.success("Đã thêm Nhóm tiêu chí cha mới!");
  };

  // Add child criterion into a specific group
  const handleAddChildToGroup = (groupId, field = null) => {
    if (field && usedFieldCodes.has(field.fieldCode)) {
      toast("Trường thông tin này đã có trên biểu mẫu", { icon: "ℹ️" });
      return;
    }

    const nextBlocks = blocks.map((b) => {
      if (b.id === groupId) {
        const childCount = (b.children || []).length + 1;
        const newChild = {
          id: `child_${field ? field.fieldCode : Date.now()}`,
          type: "CRITERIA",
          fieldCode: field ? field.fieldCode : `crit_${Date.now().toString().slice(-4)}`,
          title: field ? (field.fieldName || field.fieldCode) : `Tiêu chí con ${childCount}`,
          description: field ? `Đánh giá theo chỉ tiêu ${field.fieldCode}.` : "Mô tả tiêu chí con.",
          maxScore: 5,
          isRequired: field ? !!field.isRequired : false,
          requiresProof: field ? (field.dataType === "FILE" || field.fieldCode.includes("proof")) : false
        };
        return {
          ...b,
          children: [...(b.children || []), newChild]
        };
      }
      return b;
    });

    updateBlocksWithHistory(nextBlocks);
    toast.success("Đã thêm tiêu chí con vào nhóm!");
  };

  // Reorder child within group
  const handleMoveChild = (groupId, childIndex, direction, e) => {
    e?.stopPropagation();
    const nextBlocks = blocks.map((b) => {
      if (b.id === groupId && b.children) {
        const newIdx = childIndex + direction;
        if (newIdx < 0 || newIdx >= b.children.length) return b;
        const copy = [...b.children];
        const [moved] = copy.splice(childIndex, 1);
        copy.splice(newIdx, 0, moved);
        return { ...b, children: copy };
      }
      return b;
    });
    updateBlocksWithHistory(nextBlocks);
  };

  // Remove child from group
  const handleRemoveChild = (groupId, childId, e) => {
    e?.stopPropagation();
    const nextBlocks = blocks.map((b) => {
      if (b.id === groupId && b.children) {
        return {
          ...b,
          children: b.children.filter((c) => c.id !== childId)
        };
      }
      return b;
    });
    updateBlocksWithHistory(nextBlocks);
    if (selectedBlockId === childId) {
      setSelectedBlockId(groupId);
    }
  };

  // Add block from Field Code (top level)
  const handleAddFieldCodeToCanvas = (field) => {
    if (usedFieldCodes.has(field.fieldCode)) {
      toast("Trường thông tin này đã có trên biểu mẫu", { icon: "ℹ️" });
      return;
    }

    const newBlock = {
      id: `block_${field.fieldCode}_${Date.now()}`,
      type: "CRITERIA",
      fieldCode: field.fieldCode,
      title: `${blocks.length + 1}. ${field.fieldName || field.fieldCode}`,
      description: `Đánh giá theo chỉ tiêu trường ${field.fieldCode}.`,
      maxScore: 10,
      isRequired: !!field.isRequired,
      requiresProof: field.dataType === "FILE" || field.fieldCode.includes("proof")
    };

    const nextBlocks = [...blocks, newBlock];
    updateBlocksWithHistory(nextBlocks);
    setSelectedBlockId(newBlock.id);
    toast.success(`Đã thêm trường "${field.fieldName}" vào biểu mẫu!`);
  };

  // Remove block (either top-level or child)
  const handleRemoveBlock = (blockId, e) => {
    e?.stopPropagation();
    let isTopLevel = blocks.some((b) => b.id === blockId);

    let nextBlocks;
    if (isTopLevel) {
      nextBlocks = blocks.filter((b) => b.id !== blockId);
    } else {
      nextBlocks = blocks.map((b) => {
        if (b.children && Array.isArray(b.children)) {
          return {
            ...b,
            children: b.children.filter((c) => c.id !== blockId)
          };
        }
        return b;
      });
    }

    updateBlocksWithHistory(nextBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(nextBlocks[0]?.id || null);
    }
  };

  // Reorder top-level blocks
  const handleMoveBlock = (index, direction, e) => {
    e?.stopPropagation();
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const copy = [...blocks];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    updateBlocksWithHistory(copy);
  };

  // Update selected block property (supports group, standalone, or nested child)
  const handleUpdateSelectedBlock = (prop, value) => {
    if (!selectedBlockId) return;
    const nextBlocks = blocks.map((b) => {
      if (b.id === selectedBlockId) {
        return { ...b, [prop]: value };
      }
      if (b.children && Array.isArray(b.children)) {
        const updatedChildren = b.children.map((c) => {
          if (c.id === selectedBlockId) {
            return { ...c, [prop]: value };
          }
          return c;
        });
        return { ...b, children: updatedChildren };
      }
      return b;
    });
    updateBlocksWithHistory(nextBlocks);
  };

  // Generate complete layout JSON
  const layoutJson = useMemo(() => {
    return {
      formCode,
      formName,
      versionNo,
      semesterName,
      scoreFormula,
      rankingScale,
      blocks,
      signatureZone: [
        { role: "Sinh viên", fieldCode: "sign_student" },
        { role: "Lớp trưởng", fieldCode: "sign_class" },
        { role: "Trưởng Khoa", fieldCode: "sign_dean" }
      ]
    };
  }, [formCode, formName, versionNo, semesterName, scoreFormula, rankingScale, blocks]);

  const formattedJsonString = JSON.stringify(layoutJson, null, 2);

  // Nạp toàn bộ 5 nhóm tiêu chí chuẩn từ Phôi Word DRL 2026
  const handleLoadOfficialTemplate = () => {
    updateBlocksWithHistory(OFFICIAL_DRL_2026_BLOCKS);
    setSelectedBlockId(OFFICIAL_DRL_2026_BLOCKS[0].id);
    toast.success("Đã nạp đầy đủ 5 nhóm tiêu chí (100đ) theo chuẩn Phôi mẫu DRL 2026!");
  };

  // Save layout
  const handleSaveLayout = async () => {
    if (blocks.length === 0) {
      toast.error("Biểu mẫu không được để trống khối");
      return;
    }

    if (totalMaxScore !== 100) {
      toast.error(`Tổng điểm tối đa hiện tại là ${totalMaxScore}đ. Quy chế yêu cầu phải đúng 100đ!`);
    }

    setIsSaving(true);
    try {
      const storageKey = `drl_designer_layout_${id || "new"}`;
      sessionStorage.setItem(storageKey, formattedJsonString);
      localStorage.setItem(storageKey, formattedJsonString);
      sessionStorage.setItem("drl_latest_designer_layout", formattedJsonString);

      if (!isNew && id) {
        await formService.updateTemplate(id, {
          formCode,
          formName,
          semesterId: semesterId ? Number(semesterId) : 1,
          templateLayoutJson: formattedJsonString,
          status: "DRAFT"
        });
      }
      toast.success("Lưu cấu hình biểu mẫu (jsonForm) thành công!");
      setIsDirty(false);
      navigate(-1);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Lỗi lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, field) => {
    e.dataTransfer.setData("application/json", JSON.stringify(field));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        const field = JSON.parse(dataStr);
        handleAddFieldCodeToCanvas(field);
      }
    } catch (err) {
      console.warn("Drop error:", err);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-canvas overflow-hidden">
      {/* THANH CÔNG CỤ (TOOLBAR) */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              if (isDirty) setConfirmExitOpen(true);
              else navigate(-1);
            }}
            className="h-9 px-3 text-xs"
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>

          <div className="h-5 w-px bg-line" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">{formName}</span>
              <span className="font-mono text-xs font-semibold text-brand rounded bg-brand-soft px-2 py-0.5">
                {versionNo}
              </span>
            </div>
            <span className="text-[11px] text-muted">{semesterName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <IconButton
            label="Hoàn tác (Undo)"
            disabled={historyIndex <= 0}
            onClick={handleUndo}
            className="size-8"
          >
            <Undo2 className="size-4" />
          </IconButton>
          <IconButton
            label="Làm lại (Redo)"
            disabled={historyIndex >= history.length - 1}
            onClick={handleRedo}
            className="size-8"
          >
            <Redo2 className="size-4" />
          </IconButton>

          <div className="h-5 w-px bg-line mx-1" />

          {/* Xuất JSON */}
          <Button
            variant="secondary"
            onClick={() => setExportJsonOpen(true)}
            className="h-9 text-xs"
          >
            <FileCode className="size-4 text-slate-600" />
            Xuất JSON
          </Button>

          {/* Xem trước */}
          <Button
            variant="secondary"
            onClick={() => setPreviewOpen(true)}
            className="h-9 text-xs text-brand border-brand hover:bg-brand-soft"
          >
            <Eye className="size-4" />
            Xem trước
          </Button>

          {/* Nạp mẫu Phôi DRL 2026 */}
          <Button
            variant="secondary"
            onClick={handleLoadOfficialTemplate}
            className="h-9 text-xs text-slate-700 hover:text-brand"
            title="Nạp đầy đủ 5 nhóm tiêu chí (100đ) theo đúng Phôi Word DRL 2026"
          >
            <FileText className="size-4 text-brand" />
            Nạp Phôi DRL 2026
          </Button>

          {/* Lưu cấu hình */}
          <Button
            variant="primary"
            onClick={handleSaveLayout}
            loading={isSaving}
            className="h-9 text-xs"
          >
            <Save className="size-4" />
            Lưu cấu hình
          </Button>
        </div>
      </div>

      {/* BODY 3 CỘT */}
      <div className="flex flex-1 overflow-hidden">
        {/* CỘT TRÁI: CÂY FIELD CODE */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-white">
          <div className="border-b border-line p-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Danh mục Field Code
            </span>
            <Input
              placeholder="Tìm mã hoặc tên trường..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              className="text-xs"
            />
            <div className="mt-2 flex gap-1 overflow-x-auto text-[11px]">
              {["ALL", "COMMON", "CRITERIA", "HEADER", "FOOTER"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded px-2 py-1 font-medium transition ${
                    categoryFilter === cat
                      ? "bg-brand text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {allFieldCodes
              .filter((f) => {
                if (categoryFilter !== "ALL" && f.category !== categoryFilter) return false;
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
                const isUsed = usedFieldCodes.has(field.fieldCode);
                return (
                  <div
                    key={field.id}
                    draggable={!isUsed}
                    onDragStart={(e) => handleDragStart(e, field)}
                    onClick={() => !isUsed && handleAddFieldCodeToCanvas(field)}
                    className={`flex items-center justify-between rounded-lg border p-2 text-xs transition cursor-grab ${
                      isUsed
                        ? "border-line bg-slate-50 opacity-55 cursor-not-allowed"
                        : "border-line bg-white hover:border-brand hover:bg-brand-soft/30 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="size-3.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 truncate">
                            {field.fieldCode}
                          </span>
                          <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-semibold text-slate-500">
                            {field.dataType}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted truncate">{field.fieldName}</p>
                      </div>
                    </div>

                    {isUsed ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-green-100 text-green-700 shrink-0">
                        <Check className="size-3" />
                      </span>
                    ) : (
                      <IconButton
                        label="Thêm vào canvas"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddFieldCodeToCanvas(field);
                        }}
                        className="size-6 text-brand hover:bg-brand-soft"
                      >
                        <Plus className="size-3.5" />
                      </IconButton>
                    )}
                  </div>
                );
              })}
          </div>
        </aside>

        {/* CỘT GIỮA: CANVAS KÉO THẢ (6. Vùng thiết kế & 7. Vùng ký) */}
        <main
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {/* Header Canvas Tối giản & Tinh tế */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cấu trúc biểu mẫu
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                  {blocks.length} nhóm tiêu chí
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                    totalMaxScore === 100
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {totalMaxScore} / 100đ
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handleAddCriteriaGroup}
                  className="h-8 px-3 text-xs text-brand border-brand/40 hover:bg-brand-soft"
                >
                  <FolderPlus className="size-3.5" />
                  + Thêm nhóm
                </Button>
                <button
                  type="button"
                  onClick={handleLoadOfficialTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-brand hover:border-brand/40 transition"
                >
                  <FileText className="size-3.5 text-brand" />
                  Nạp phôi DRL 2026
                </button>
              </div>
            </div>

            {/* Nhắc nhở quy chế (Chỉ hiện khi đã có tiêu chí và chưa đạt 100đ) */}
            {blocks.length > 0 && totalMaxScore !== 100 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs text-amber-800">
                <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
                <span>
                  Tổng điểm hiện tại: <strong>{totalMaxScore}đ</strong> (Quy chế quy định 100 điểm để có thể kích hoạt).
                </span>
              </div>
            )}

            {/* DANH SÁCH CÁC KHỐI HOẶC EMPTY STATE */}
            {blocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
                  <FolderPlus className="size-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Canvas chưa có tiêu chí
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Bắt đầu tạo tiêu chí bằng cách thêm nhóm mới hoặc kéo thả trường thông tin từ danh mục bên trái.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddCriteriaGroup}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand/90 transition"
                  >
                    <FolderPlus className="size-3.5" />
                    + Thêm nhóm tiêu chí
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadOfficialTemplate}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  >
                    <FileText className="size-3.5 text-brand" />
                    Nạp nhanh phôi DRL 2026
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* TIÊU ĐỀ CÁC CỘT (CHỈ HIỂN THỊ KHI CÓ KHỐI) */}
                <div className="hidden sm:grid grid-cols-[1fr_85px_150px_75px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <span>Nội dung đánh giá / Hướng dẫn chấm</span>
                  <span className="text-center">Điểm trần</span>
                  <span className="text-center">Phân quyền</span>
                  <span className="text-center text-slate-400">Thao tác</span>
                </div>

                {/* Danh sách các khối trong Canvas */}
                <div className="space-y-3">
                  {blocks.map((block, idx) => {
                // TRƯỜNG HỢP 1: KHỐI NHÓM TIÊU CHÍ (CRITERIA_GROUP)
                if (block.type === "CRITERIA_GROUP") {
                  const isGroupSelected = selectedBlockId === block.id;
                  const children = block.children || [];
                  const childrenSum = children.reduce((acc, c) => acc + (Number(c.maxScore) || 0), 0);

                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const dataStr = e.dataTransfer.getData("application/json");
                          if (dataStr) {
                            const field = JSON.parse(dataStr);
                            handleAddChildToGroup(block.id, field);
                          }
                        } catch (err) {
                          console.warn("Drop error into group:", err);
                        }
                      }}
                      className={`group relative rounded-xl border-2 transition cursor-pointer bg-white overflow-hidden ${
                        isGroupSelected
                          ? "border-brand shadow-md ring-2 ring-brand-soft"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {/* Header Nhóm Tiêu chí */}
                      <div className="flex flex-col gap-2 border-b border-line bg-slate-50/80 p-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-brand font-mono text-xs font-bold text-white mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-1 min-w-0">
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
                              <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono text-[11px] text-muted">
                                <span>Mã: <strong className="text-slate-700">{block.fieldCode}</strong></span>
                                <span>•</span>
                                <span>Điểm trần: <strong className="text-brand font-bold">{block.maxScore}đ</strong></span>
                                <span>•</span>
                                <span className={childrenSum > block.maxScore ? "text-amber-700 font-semibold" : ""}>
                                  Tổng điểm con: {childrenSum}đ {childrenSum > block.maxScore && "(Tự động chặn trần)"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Cột Điểm trần & Thao tác trên Nhóm */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="rounded bg-brand-soft px-2 py-1 font-mono text-[11px] font-bold text-brand border border-brand/20">
                              Trần: {block.maxScore}đ
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddChildToGroup(block.id);
                              }}
                              className="inline-flex items-center gap-1 rounded border border-brand/40 bg-white px-2 py-1 text-[11px] font-semibold text-brand hover:bg-brand-soft transition"
                            >
                              <Plus className="size-3" />
                              <span>Thêm con</span>
                            </button>
                            <IconButton
                              label="Di chuyển lên"
                              disabled={idx === 0}
                              onClick={(e) => handleMoveBlock(idx, -1, e)}
                              className="size-7"
                            >
                              <MoveUp className="size-3.5" />
                            </IconButton>
                            <IconButton
                              label="Di chuyển xuống"
                              disabled={idx === blocks.length - 1}
                              onClick={(e) => handleMoveBlock(idx, 1, e)}
                              className="size-7"
                            >
                              <MoveDown className="size-3.5" />
                            </IconButton>
                            <IconButton
                              label="Xóa nhóm này"
                              onClick={(e) => handleRemoveBlock(block.id, e)}
                              className="size-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="size-3.5" />
                            </IconButton>
                          </div>
                        </div>
                      </div>

                      {/* Danh sách các mục con 1.1, 1.2, 1.3... */}
                      <div className="p-3 bg-slate-50/30 space-y-2">
                        {children.length === 0 ? (
                          <div className="rounded-lg border-2 border-dashed border-line p-4 text-center text-xs text-muted">
                            Kéo thả Field Code từ cột trái vào đây hoặc nhấn <strong>"+ Thêm con"</strong> để tạo các mục 1.1, 1.2...
                          </div>
                        ) : (
                          children.map((child, cIdx) => {
                            const isChildSelected = selectedBlockId === child.id;
                            return (
                              <div
                                key={child.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBlockId(child.id);
                                }}
                                className={`grid sm:grid-cols-[1fr_95px_160px_85px] gap-2 items-center rounded-lg border p-2.5 transition cursor-pointer bg-white ${
                                  isChildSelected
                                    ? "border-brand shadow-sm ring-1 ring-brand-soft"
                                    : "border-line hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <CornerDownRight className="size-4 text-slate-400 mt-0.5 shrink-0" />
                                  <span className="font-mono text-xs font-bold text-slate-500 mt-0.5">
                                    {idx + 1}.{cIdx + 1}
                                  </span>
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-semibold text-xs text-slate-800">
                                        {child.title || child.fieldName}
                                      </span>
                                      {child.isRequired && (
                                        <span className="rounded bg-red-100 px-1 py-0.2 text-[9px] font-bold text-red-700">
                                          Bắt buộc
                                        </span>
                                      )}
                                    </div>
                                    {child.description && (
                                      <p className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                                        {child.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                                      <span>Mã: <strong className="text-slate-700">{child.fieldCode}</strong></span>
                                    </div>
                                  </div>
                                </div>

                                {/* Cột Điểm tối đa */}
                                <div className="text-center font-bold font-mono text-xs text-brand">
                                  {child.maxScore}đ
                                </div>

                                {/* Cột Phân quyền chấm & Minh chứng */}
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                    {child.evaluationScope === "STUDENT_ONLY"
                                      ? "Chỉ Sinh viên"
                                      : child.evaluationScope === "CLASS_ONLY"
                                      ? "Chỉ Cán bộ lớp"
                                      : "SV & Lớp cùng chấm"}
                                  </span>
                                  {child.requiresProof && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-medium text-amber-800">
                                      Cần minh chứng
                                    </span>
                                  )}
                                </div>

                                {/* Nút di chuyển & xóa mục con */}
                                <div className="flex items-center justify-end gap-0.5 shrink-0">
                                  <IconButton
                                    label="Di chuyển lên"
                                    disabled={cIdx === 0}
                                    onClick={(e) => handleMoveChild(block.id, cIdx, -1, e)}
                                    className="size-6"
                                  >
                                    <MoveUp className="size-3" />
                                  </IconButton>
                                  <IconButton
                                    label="Di chuyển xuống"
                                    disabled={cIdx === children.length - 1}
                                    onClick={(e) => handleMoveChild(block.id, cIdx, 1, e)}
                                    className="size-6"
                                  >
                                    <MoveDown className="size-3" />
                                  </IconButton>
                                  <IconButton
                                    label="Xóa mục con này"
                                    onClick={(e) => handleRemoveChild(block.id, child.id, e)}
                                    className="size-6 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  >
                                    <Trash2 className="size-3" />
                                  </IconButton>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                }

                // TRƯỜNG HỢP 2: KHỐI TIÊU CHÍ ĐỘC LẬP (CRITERIA / SCORE_INPUT)
                const isSelected = selectedBlockId === block.id;
                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`group relative rounded-xl border-2 p-3.5 transition cursor-pointer bg-white ${
                      isSelected
                        ? "border-brand shadow-md ring-2 ring-brand-soft"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <div className="grid sm:grid-cols-[1fr_95px_160px_85px] gap-2 items-center">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft font-mono text-xs font-bold text-brand mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">
                              {block.title || block.fieldName}
                            </span>
                            {block.isRequired && (
                              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                                Bắt buộc
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                            {block.description}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5 font-mono text-[11px] text-muted">
                            <span>Mã: <strong className="text-slate-700">{block.fieldCode}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Điểm tối đa */}
                      <div className="text-center font-bold font-mono text-xs text-brand">
                        {block.maxScore}đ
                      </div>

                      {/* Cột Phân quyền chấm & Minh chứng */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {block.evaluationScope === "STUDENT_ONLY"
                            ? "Chỉ Sinh viên"
                            : block.evaluationScope === "CLASS_ONLY"
                            ? "Chỉ Cán bộ lớp"
                            : "SV & Lớp cùng chấm"}
                        </span>
                        {block.requiresProof && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-medium text-amber-800">
                            Cần minh chứng
                          </span>
                        )}
                      </div>

                      {/* Nút di chuyển & xóa */}
                      <div className="flex items-center justify-end gap-0.5 shrink-0">
                        <IconButton
                          label="Di chuyển lên"
                          disabled={idx === 0}
                          onClick={(e) => handleMoveBlock(idx, -1, e)}
                          className="size-7"
                        >
                          <MoveUp className="size-3.5" />
                        </IconButton>
                        <IconButton
                          label="Di chuyển xuống"
                          disabled={idx === blocks.length - 1}
                          onClick={(e) => handleMoveBlock(idx, 1, e)}
                          className="size-7"
                        >
                          <MoveDown className="size-3.5" />
                        </IconButton>
                        <IconButton
                          label="Xóa khối này"
                          onClick={(e) => handleRemoveBlock(block.id, e)}
                          className="size-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>

                {/* HÀNG TỔNG KẾT BIỂU MẪU (NỀN SÁNG, THIẾT KẾ TINH TẾ) */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">TỔNG ĐIỂM BIỂU MẪU:</span>
                    <span className={`font-mono font-bold text-sm ${totalMaxScore === 100 ? "text-emerald-700" : "text-amber-700"}`}>
                      {totalMaxScore} / 100đ
                    </span>
                    {totalMaxScore === 100 ? (
                      <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                        Đạt chuẩn 100đ
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                        Quy chế 100đ
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted font-medium">
                    {blocks.length} nhóm tiêu chí • Tách 2 JSON độc lập khi chấm
                  </span>
                </div>

                {/* VÙNG KÝ HỆ THỐNG GỌN GÀNG */}
                <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700 text-[11px]">3 Chữ ký điện tử quy chuẩn:</span>
                    <span className="text-[11px]">Sinh viên tự chấm • Cán bộ lớp thẩm định • Trưởng Khoa duyệt</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Fixed Signatures</span>
                </div>
              </>
            )}
          </div>
        </main>

        {/* CỘT PHẢI: THUỘC TÍNH KHỐI & QUY CHẾ */}
        <aside className="flex w-[360px] shrink-0 flex-col border-l border-line bg-white overflow-hidden">
          {/* Header 2 Tabs gọn gàng, thanh thoát */}
          <div className="border-b border-line p-3 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-1">
              <button
                type="button"
                onClick={() => setSidebarTab("PROPERTIES")}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                  sidebarTab === "PROPERTIES"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-muted hover:text-slate-700"
                }`}
              >
                <Sliders className="size-3.5" />
                <span>Thuộc tính khối</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("REGULATIONS")}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                  sidebarTab === "REGULATIONS"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-muted hover:text-slate-700"
                }`}
              >
                <Award className="size-3.5" />
                <span>Quy chế & Xếp loại</span>
              </button>
            </div>
          </div>

          {/* Nội dung scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sidebarTab === "PROPERTIES" ? (
              // TAB 1: THUỘC TÍNH KHỐI ĐANG CHỌN
              selectedInfo ? (
                selectedInfo.isGroup ? (
                  // CẤU HÌNH NHÓM TIÊU CHÍ CHA
                  <div className="space-y-3.5 rounded-xl border border-line bg-slate-50/60 p-3.5">
                    <div className="flex items-center justify-between border-b border-line/80 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-brand" />
                        <span className="font-bold text-xs text-brand uppercase tracking-wider">
                          Nhóm tiêu chí cha
                        </span>
                      </div>
                      <span className="font-mono text-[10px] bg-white border border-line px-2 py-0.5 rounded text-slate-600 font-semibold">
                        {selectedInfo.block.fieldCode}
                      </span>
                    </div>

                    <div>
                      <Input
                        label="Tiêu đề nhóm"
                        value={selectedInfo.block.title || ""}
                        onChange={(e) => handleUpdateSelectedBlock("title", e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <Input
                        label="Mã nhóm (Field Code)"
                        value={selectedInfo.block.fieldCode || ""}
                        onChange={(e) => handleUpdateSelectedBlock("fieldCode", e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>

                    <div>
                      <Textarea
                        label="Mô tả nhóm tiêu chí"
                        rows={3}
                        placeholder="Nhập mô tả, nội dung nhóm..."
                        value={selectedInfo.block.description || ""}
                        onChange={(e) => handleUpdateSelectedBlock("description", e.target.value)}
                      />
                    </div>

                    {/* Điểm trần tối đa của nhóm */}
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">
                        Điểm trần tối đa của nhóm
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={selectedInfo.block.maxScore || 20}
                          onChange={(e) => handleUpdateSelectedBlock("maxScore", Number(e.target.value))}
                          className="h-9 w-24 rounded-lg border border-line bg-white px-3 text-center text-sm font-bold text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft font-mono"
                        />
                        <span className="text-xs font-semibold text-slate-600">điểm</span>
                      </div>
                      <span className="text-[11px] text-muted block mt-1">
                        Điểm đóng góp của cả nhóm vào tổng 100đ của biểu mẫu.
                      </span>
                    </div>

                    {/* Chế độ tính điểm nhóm */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-muted">
                        Quy tắc tính điểm nhóm
                      </label>
                      <select
                        value={selectedInfo.block.calculationMode || "CLAMPED_SUM"}
                        onChange={(e) => handleUpdateSelectedBlock("calculationMode", e.target.value)}
                        className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
                      >
                        <option value="CLAMPED_SUM">Tự động chặn trần (Capped Sum)</option>
                        <option value="STRICT_SUM">Ràng buộc cứng (Tổng con ≤ Trần nhóm)</option>
                      </select>
                      <div className="rounded-md bg-white border border-line/70 p-2 text-[11px] text-slate-600 leading-relaxed">
                        {selectedInfo.block.calculationMode === "STRICT_SUM"
                          ? "Báo lỗi nếu tổng điểm các mục con vượt quá trần nhóm."
                          : "Tổng điểm các con có thể vượt trần, hệ thống tự động lấy tối đa bằng trần nhóm."}
                      </div>
                    </div>

                    {/* Nút thêm nhanh mục con vào nhóm */}
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddChildToGroup(selectedInfo.block.id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand/50 bg-white py-2 text-xs font-semibold text-brand hover:bg-brand-soft transition"
                      >
                        <Plus className="size-3.5" />
                        Thêm tiêu chí con vào nhóm này
                      </button>
                    </div>
                  </div>
                ) : (
                  // CẤU HÌNH TIÊU CHÍ CON HOẶC TIÊU CHÍ ĐỘC LẬP
                  <div className="space-y-3.5 rounded-xl border border-line bg-slate-50/60 p-3.5">
                    <div className="flex items-center justify-between border-b border-line/80 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-slate-500" />
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                          {selectedInfo.parentGroup ? "Tiêu chí con" : "Thuộc tính tiêu chí"}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] bg-white border border-line px-2 py-0.5 rounded text-brand font-semibold">
                        {selectedInfo.block.fieldCode}
                      </span>
                    </div>

                    {selectedInfo.parentGroup && (
                      <div className="flex items-center justify-between rounded-lg bg-brand-soft/40 border border-brand/20 px-2.5 py-1.5 text-xs text-brand-dark">
                        <span className="text-[11px] text-muted">Thuộc nhóm:</span>
                        <strong className="text-slate-800 font-semibold truncate max-w-[180px]">
                          {selectedInfo.parentGroup.title}
                        </strong>
                        <span className="font-mono text-[11px] font-bold text-brand">
                          {selectedInfo.parentGroup.maxScore}đ
                        </span>
                      </div>
                    )}

                    <div>
                      <Input
                        label="Tiêu đề tiêu chí"
                        value={selectedInfo.block.title || ""}
                        onChange={(e) => handleUpdateSelectedBlock("title", e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <Textarea
                        label="Mô tả / Hướng dẫn chấm"
                        rows={4}
                        placeholder="Nhập hướng dẫn chấm, các mốc điểm (hỗ trợ xuống dòng Enter)..."
                        value={selectedInfo.block.description || ""}
                        onChange={(e) => handleUpdateSelectedBlock("description", e.target.value)}
                      />
                    </div>

                    {/* Điểm tối đa */}
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">
                        Điểm tối đa
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={selectedInfo.block.maxScore || 10}
                          onChange={(e) => handleUpdateSelectedBlock("maxScore", Number(e.target.value))}
                          className="h-9 w-24 rounded-lg border border-line bg-white px-3 text-center text-sm font-bold text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft font-mono"
                        />
                        <span className="text-xs font-semibold text-slate-600">điểm</span>
                      </div>
                    </div>

                    {/* Phân quyền đánh giá (Phương án 1) */}
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">
                        Phân quyền đánh giá
                      </label>
                      <Select
                        value={selectedInfo.block.evaluationScope || "BOTH"}
                        onChange={(e) => handleUpdateSelectedBlock("evaluationScope", e.target.value)}
                        className="text-xs"
                      >
                        <option value="BOTH">Cả Sinh viên & Lớp cùng chấm (Mặc định)</option>
                        <option value="STUDENT_ONLY">Chỉ Sinh viên tự chấm</option>
                        <option value="CLASS_ONLY">Chỉ Ban cán sự lớp chấm</option>
                      </Select>
                      <span className="text-[10px] text-muted block mt-1">
                        Hệ thống sẽ tự động tách trường này vào JSON tương ứng của vai trò khi chấm.
                      </span>
                    </div>

                    {/* Bắt buộc */}
                    <label className="flex cursor-pointer items-center justify-between rounded-lg bg-white p-2.5 border border-line hover:border-slate-300 transition">
                      <span className="text-xs font-medium text-slate-700">Bắt buộc nhập</span>
                      <input
                        type="checkbox"
                        checked={!!selectedInfo.block.isRequired}
                        onChange={(e) => handleUpdateSelectedBlock("isRequired", e.target.checked)}
                        className="size-4 rounded text-brand focus:ring-brand"
                      />
                    </label>

                    {/* Cần minh chứng */}
                    <label className="flex cursor-pointer items-center justify-between rounded-lg bg-white p-2.5 border border-line hover:border-slate-300 transition">
                      <div>
                        <span className="text-xs font-medium text-slate-700 block">Cần minh chứng</span>
                        <span className="text-[10px] text-muted">Bắt buộc đính kèm khi điểm &gt; 0</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!selectedInfo.block.requiresProof}
                        onChange={(e) => handleUpdateSelectedBlock("requiresProof", e.target.checked)}
                        className="size-4 rounded text-brand focus:ring-brand"
                      />
                    </label>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="size-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Sliders className="size-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Chưa chọn khối nào</span>
                  <p className="text-[11px] text-muted mt-1 max-w-[210px] leading-relaxed">
                    Nhấp vào một nhóm hoặc một tiêu chí trên canvas để chỉnh sửa thuộc tính.
                  </p>
                </div>
              )
            ) : (
              // TAB 2: QUY CHẾ & XẾP LOẠI
              <div className="space-y-5">
                {/* Công thức tổng điểm */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-800">Công thức tổng điểm</span>
                  <Select
                    value={scoreFormula}
                    onChange={(e) => {
                      setScoreFormula(e.target.value);
                      setIsDirty(true);
                    }}
                    className="text-xs"
                  >
                    <option value="SUM">SUM (Tổng điểm các tiêu chí)</option>
                    <option value="MAX_100">SUM_CLAMP_100 (Tổng điểm tối đa 100)</option>
                    <option value="WEIGHTED">WEIGHTED (Tính theo trọng số)</option>
                  </Select>
                  <span className="text-[11px] text-muted block leading-relaxed">
                    Mặc định SUM; tự động cộng dồn điểm của các tiêu chí con.
                  </span>
                </div>

                {/* Thang xếp loại rèn luyện */}
                <div className="space-y-2.5 pt-3 border-t border-line">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Thang xếp loại rèn luyện</span>
                    <span className="text-[10px] text-muted font-medium">Quy chế ĐHQGHN</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-canvas font-semibold text-slate-700">
                        <tr>
                          <th className="px-2.5 py-1.5">Xếp loại</th>
                          <th className="px-2 py-1.5 text-center">Từ</th>
                          <th className="px-2 py-1.5 text-center">Đến</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-white">
                        {rankingScale.map((item, idx) => (
                          <tr key={item.rank}>
                            <td className="px-2.5 py-1.5 font-semibold text-slate-800">
                              {item.rank}
                            </td>
                            <td className="px-1 py-1 text-center">
                              <input
                                type="number"
                                value={item.minScore}
                                onChange={(e) => {
                                  const copy = [...rankingScale];
                                  copy[idx].minScore = Number(e.target.value);
                                  setRankingScale(copy);
                                  setIsDirty(true);
                                }}
                                className="w-12 rounded border border-line px-1 py-1 text-center font-mono text-xs focus:border-brand outline-none"
                              />
                            </td>
                            <td className="px-1 py-1 text-center">
                              <input
                                type="number"
                                value={item.maxScore}
                                onChange={(e) => {
                                  const copy = [...rankingScale];
                                  copy[idx].maxScore = Number(e.target.value);
                                  setRankingScale(copy);
                                  setIsDirty(true);
                                }}
                                className="w-12 rounded border border-line px-1 py-1 text-center font-mono text-xs focus:border-brand outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="text-[10px] text-muted block leading-relaxed">
                    Cho phép tinh chỉnh ngưỡng theo quyết định của Hội đồng Đánh giá.
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* MODAL 1: XEM TRƯỚC BIỂU MẪU (Renderer.jsx) */}
      <Modal
        open={previewOpen}
        wide
        title={`Xem trước giao diện sinh viên: ${formName} (${versionNo})`}
        onClose={() => setPreviewOpen(false)}
        footer={
          <Button variant="primary" onClick={() => setPreviewOpen(false)}>
            Đóng xem trước
          </Button>
        }
      >
        <Renderer
          layout={layoutJson}
          rankingScale={rankingScale}
          isInteractive={true}
        />
      </Modal>

      {/* MODAL 2: XUẤT JSON (jsonForm Viewer) */}
      <Modal
        open={exportJsonOpen}
        wide
        title="Cấu hình Layout JSON (jsonForm)"
        onClose={() => setExportJsonOpen(false)}
        footer={
          <>
            <Button onClick={() => setExportJsonOpen(false)}>Đóng</Button>
            <Button
              variant="primary"
              onClick={() => {
                navigator.clipboard.writeText(formattedJsonString);
                toast.success("Đã sao chép cấu hình JSON vào clipboard!");
              }}
            >
              <ClipboardCopy className="size-4" />
              Sao chép JSON
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Cấu trúc JSON này được lưu trữ trong cột <code>template_layout_json</code> để engine dựng form động:
          </p>
          <pre className="max-h-[400px] overflow-auto rounded-lg border border-line bg-slate-900 p-4 font-mono text-xs text-slate-200">
            {formattedJsonString}
          </pre>
        </div>
      </Modal>

      {/* MODAL 3: XÁC NHẬN THOÁT */}
      <Modal
        open={confirmExitOpen}
        title="Xác nhận thoát thiết kế"
        onClose={() => setConfirmExitOpen(false)}
        footer={
          <>
            <Button onClick={() => setConfirmExitOpen(false)}>Tiếp tục thiết kế</Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmExitOpen(false);
                navigate(-1);
              }}
            >
              Thoát và không lưu
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Bạn có những thay đổi thiết kế chưa được lưu. Nếu thoát, các chỉnh sửa này sẽ bị mất.
        </p>
      </Modal>
    </div>
  );
}
