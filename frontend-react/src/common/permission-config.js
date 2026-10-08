import {
  BookOpenCheck,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  Clock3,
  FilePenLine,
  FileStack,
  History,
  LayoutDashboard,
  ListChecks,
  PenLine,
  School,
  Settings2,
  Signature,
  Users,
} from "lucide-react"

const mine = [
  { label: "Tổng quan", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Soạn thảo mẫu biểu", path: "/student/compose", icon: FilePenLine },
  { label: "Danh sách chờ xử lý", path: "/student/pending", icon: Clock3 },
  { label: "Lịch sử phiếu", path: "/student/history", icon: History },
  { label: "Chữ ký của tôi", path: "/student/signature", icon: Signature },
]

export const menus = {
  student: [{ title: "", items: mine }],
  "class-leader": [
    { title: "Của tôi", items: mine },
    {
      title: "Quản lý lớp",
      items: [
        {
          label: "Tổng quan lớp",
          path: "/class-leader/overview",
          icon: School,
        },
        {
          label: "Duyệt phiếu lớp",
          path: "/class-leader/review",
          icon: ClipboardCheck,
          badge: 12,
        },
      ],
    },
  ],
  "class-deputy": [
    { title: "Của tôi", items: mine },
    {
      title: "Quản lý lớp",
      items: [
        {
          label: "Tổng quan lớp",
          path: "/class-leader/overview",
          icon: School,
        },
        {
          label: "Duyệt phiếu lớp",
          path: "/class-leader/review",
          icon: ClipboardCheck,
          badge: 12,
        },
      ],
    },
  ],
  dean: [
    {
      title: "",
      items: [
        { label: "Tổng quan", path: "/dean/dashboard", icon: LayoutDashboard },
        {
          label: "Duyệt phiếu khoa",
          path: "/dean/batches",
          icon: FileStack,
          badge: 3,
        },
        {
          label: "Báo cáo khoa",
          path: "/dean/reports",
          icon: ChartNoAxesColumnIncreasing,
        },
        { label: "Chữ ký của tôi", path: "/dean/signature", icon: Signature },
      ],
    },
  ],
  admin: [
    {
      title: "",
      items: [
        { label: "Tổng quan", path: "/admin/dashboard", icon: LayoutDashboard },
        {
          label: "Phiên bản biểu mẫu",
          path: "/admin/form-versions",
          icon: FileStack,
        },
        {
          label: "Trường thông tin",
          path: "/admin/field-codes",
          icon: Settings2,
        },
        {
          label: "Danh bạ đơn vị",
          path: "/admin/directory/departments",
          icon: Users,
        },
        {
          label: "Danh sách chờ xử lý",
          path: "/admin/pending",
          icon: ListChecks,
          badge: 6,
        },
        {
          label: "Báo cáo toàn trường",
          path: "/admin/reports",
          icon: BookOpenCheck,
        },
      ],
    },
  ],
}

export const homeByRole = {
  student: "/student/dashboard",
  "class-leader": "/class-leader/overview",
  "class-deputy": "/class-leader/overview",
  dean: "/dean/dashboard",
  admin: "/admin/dashboard",
}
