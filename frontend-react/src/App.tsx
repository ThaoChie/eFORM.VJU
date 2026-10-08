import { Toaster } from "react-hot-toast";
import { FileQuestion, ShieldX } from "lucide-react"
import { useEffect, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom"
import AppLayout from "./components/ui/AppLayout"
import { Button } from "./components/ui/Primitives"
import { homeByRole } from "./common/permission-config"
import { useAuthStore } from "./stores/useAuthStore"
import LoginPage from "./pages/login/LoginPage"
import StudentDashboard from "./pages/student/StudentDashboard"
import ComposePage from "./pages/student/ComposePage"
import PendingListPage from "./pages/student/PendingListPage"
import HistoryPage from "./pages/student/HistoryPage"
import MySignaturePage from "./pages/student/MySignaturePage"
import SubmissionDetailPage from "./pages/student/SubmissionDetailPage"
import ClassOverviewPage from "./pages/class-leader/ClassOverviewPage"
import ReviewQueuePage from "./pages/class-leader/ReviewQueuePage"
import ReviewDetailPage from "./pages/class-leader/ReviewDetailPage"
import DeanDashboard from "./pages/dean/DeanDashboard"
import BatchListPage from "./pages/dean/BatchListPage"
import BatchDetailPage from "./pages/dean/BatchDetailPage"
import DeanReportPage from "./pages/dean/DeanReportPage"
import AdminDashboard from "./pages/admin/AdminDashboard"
import FormVersionListPage from "./pages/admin/form-versions/FormVersionListPage"
import FieldCodeListPage from "./pages/admin/field-codes/FieldCodeListPage"
import FormVersionCreatePage from "./pages/admin/form-versions/FormVersionCreatePage"
import FieldCodeCreatePage from "./pages/admin/field-codes/FieldCodeCreatePage"
import FieldCodeDetailPage from "./pages/admin/field-codes/FieldCodeDetailPage"
import DirectoryPage from "./pages/admin/directory/DirectoryPage"
import ApprovalQueuePage from "./pages/admin/approvals/ApprovalQueuePage"

function Guard({ roles }) {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/403" replace />
  return <AppLayout />
}

function ErrorPage({ denied = false }) {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const Icon = denied ? ShieldX : FileQuestion
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-5 text-center">
      <div>
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-canvas">
          <Icon className="size-9 text-muted" />
        </span>
        <h1 className="mt-5 text-[22px] font-semibold">
          {denied ? "Bạn không có quyền truy cập" : "Không tìm thấy nội dung"}
        </h1>
        <p className="mt-2 text-muted">
          {denied
            ? "Tài khoản hiện tại không được phép mở trang này."
            : "Nội dung có thể đã được di chuyển hoặc không còn tồn tại."}
        </p>
        <Button
          variant="primary"
          className="mt-6"
          onClick={() => navigate(user ? homeByRole[user.role] : "/login")}
        >
          Về trang chủ
        </Button>
      </div>
    </div>
  )
}

function Start() {
  const user = useAuthStore((state) => state.user)
  return <Navigate to={user ? homeByRole[user.role] : "/login"} replace />
}

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAuth().finally(() => setChecking(false))
  }, [checkAuth])

  if (checking) return null

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<LoginPage />} />
        <Route
          element={
            <Guard roles={["student", "class-leader", "class-deputy"]} />
          }
        >
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/compose" element={<ComposePage />} />
          <Route path="/student/compose/:id" element={<ComposePage />} />
          <Route path="/student/pending" element={<PendingListPage />} />
          <Route
            path="/student/submissions/:id"
            element={<SubmissionDetailPage />}
          />
          <Route path="/student/history" element={<HistoryPage />} />
          <Route path="/student/signature" element={<MySignaturePage />} />
        </Route>
        <Route element={<Guard roles={["class-leader", "class-deputy"]} />}>
          <Route
            path="/class-leader/overview"
            element={<ClassOverviewPage />}
          />
          <Route path="/class-leader/review" element={<ReviewQueuePage />} />
          <Route
            path="/class-leader/review/:id"
            element={<ReviewDetailPage />}
          />
        </Route>
        <Route element={<Guard roles={["dean"]} />}>
          <Route path="/dean/dashboard" element={<DeanDashboard />} />
          <Route path="/dean/batches" element={<BatchListPage />} />
          <Route path="/dean/batches/:classId" element={<BatchDetailPage />} />
          <Route path="/dean/reports" element={<DeanReportPage />} />
          <Route
            path="/dean/signature"
            element={<MySignaturePage level={3} />}
          />
        </Route>
        <Route element={<Guard roles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route
            path="/admin/form-versions"
            element={<FormVersionListPage />}
          />
          <Route
            path="/admin/form-versions/new"
            element={<FormVersionCreatePage />}
          />
          <Route
            path="/admin/form-versions/:id"
            element={<FormVersionCreatePage />}
          />
          <Route
            path="/admin/form-versions/:id/edit"
            element={<FormVersionCreatePage />}
          />
          <Route
            path="/admin/form-versions/:id/design"
            element={<FormVersionCreatePage />}
          />
          <Route
            path="/admin/field-codes"
            element={<FieldCodeListPage />}
          />
          <Route path="/admin/field-codes/new" element={<FieldCodeCreatePage />} />
          <Route path="/admin/field-codes/:id" element={<FieldCodeDetailPage />} />
          <Route path="/admin/field-codes/:id/edit" element={<FieldCodeCreatePage />} />
          <Route path="/admin/directory/:tab" element={<DirectoryPage />} />
          <Route
            path="/admin/directory/users/new"
            element={<DirectoryPage />}
          />
          <Route
            path="/admin/directory/users/:id"
            element={<DirectoryPage />}
          />
          <Route
            path="/admin/directory/users/:id/edit"
            element={<DirectoryPage />}
          />
          <Route
            path="/admin/directory/classes/:id"
            element={<DirectoryPage />}
          />
          <Route path="/admin/pending" element={<ApprovalQueuePage />} />
          <Route path="/admin/reports" element={<DeanReportPage school />} />
        </Route>
        <Route path="/403" element={<ErrorPage denied />} />
        <Route path="/404" element={<ErrorPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}
