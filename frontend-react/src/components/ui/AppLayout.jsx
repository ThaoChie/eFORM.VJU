import { KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen, User, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { menus } from "../../common/permission-config"
import { useAuthStore } from "../../stores/useAuthStore"
import { Button, IconButton, Modal } from "./Primitives"
import NotificationBell from "./NotificationBell"

const getUserInitials = (name) => {
  if (!name) return "U"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + (parts[1] ? parts[1][0] : parts[0][1] || "")).toUpperCase()
}

const roleLabelMap = {
  admin: "Quản trị viên",
  student: "Sinh viên",
  "class-leader": "Cán bộ lớp / Lớp trưởng",
  "class-deputy": "Lớp phó",
  dean: "Ban Chủ nhiệm Khoa"
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar_open")
      if (saved !== null) return saved === "true"
      return window.innerWidth >= 768
    }
    return true
  })
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768
    }
    return false
  })

  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768
      setIsMobile(mobileView)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Phím tắt Cmd+B / Ctrl+B để đóng/mở sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        setSidebarOpen((prev) => {
          const next = !prev
          if (window.innerWidth >= 768) {
            localStorage.setItem("sidebar_open", String(next))
          }
          return next
        })
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev
      if (!isMobile) {
        localStorage.setItem("sidebar_open", String(next))
      }
      return next
    })
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
    if (!isMobile) {
      localStorage.setItem("sidebar_open", "false")
    }
  }

  const openSidebar = () => {
    setSidebarOpen(true)
    if (!isMobile) {
      localStorage.setItem("sidebar_open", "true")
    }
  }

  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef(null)

  const [sidebarUserMenuOpen, setSidebarUserMenuOpen] = useState(false)
  const sidebarUserMenuRef = useRef(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false)
      }
      if (sidebarUserMenuRef.current && !sidebarUserMenuRef.current.contains(event.target)) {
        setSidebarUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isFirstLogin = Boolean(user?.isFirstLogin || user?.mustChangePassword)
  const groups = menus[user.role] ?? []
  const activeItem = groups
    .flatMap((group) => group.items)
    .filter((item) => location.pathname.startsWith(item.path))
    .at(-1)

  const signOut = () => {
    setAccountMenuOpen(false)
    logout()
    navigate("/login")
  }

  // Nếu đang ở trạng thái đăng nhập lần đầu bắt buộc đổi mật khẩu, ẩn hoàn toàn Sidebar & Header điều hướng
  if (isFirstLogin) {
    return (
      <div className="min-h-screen bg-canvas">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-night/30 backdrop-blur-xs transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-white transition-[width,transform] duration-300 ease-in-out ${
          isMobile
            ? `w-[248px] ${sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`
            : sidebarOpen
            ? "w-[248px] translate-x-0"
            : "w-[68px] translate-x-0"
        }`}
      >
        {/* Header của Sidebar */}
        <div
          className={`flex h-16 items-center border-b border-line px-3.5 transition-all ${
            !isMobile && !sidebarOpen ? "justify-center px-0" : "justify-between"
          }`}
        >
          {(!isMobile && !sidebarOpen) ? (
            /* Mini-sidebar mode: chỉ 1 nút mở rộng duy nhất ở đỉnh cột icon */
            <IconButton
              label="Mở rộng thanh bên"
              tooltipPlacement="right"
              className="text-brand hover:bg-brand-soft rounded-xl p-2.5 transition"
              onClick={openSidebar}
            >
              <PanelLeftOpen className="size-5" />
            </IconButton>
          ) : (
            /* Expanded mode: Logo + Tiêu đề + Nút thu gọn */
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logoVJU.png" alt="VJU Logo" className="size-[42px] object-contain shrink-0" />
                <span className="min-w-0 font-semibold text-xs leading-4 text-brand truncate">
                  E-Form Chấm Điểm
                  <br />
                  Rèn Luyện
                </span>
              </div>
              <IconButton
                label="Thu gọn thanh bên"
                tooltipPlacement="bottom"
                tooltipAlign="right"
                className="text-muted hover:text-brand hover:bg-brand-soft rounded-lg transition"
                onClick={closeSidebar}
              >
                {isMobile ? <X className="size-5" /> : <PanelLeftClose className="size-5" />}
              </IconButton>
            </>
          )}
        </div>

        {/* Danh sách Menu Items */}
        <nav
          className={`flex-1 py-3 ${
            !isMobile && !sidebarOpen ? "overflow-visible" : "overflow-y-auto"
          }`}
        >
          {groups.map((group, groupIndex) => (
            <div key={group.title || groupIndex} className="mb-4">
              {group.title && (sidebarOpen || isMobile) && (
                <div className="mb-2 px-6 text-[11px] font-semibold uppercase tracking-wider text-disabled truncate">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const isItemActive = location.pathname.startsWith(item.path)

                // Khi sidebar đang thu gọn trên desktop: hiển thị cột icon mini có tooltip
                if (!isMobile && !sidebarOpen) {
                  return (
                    <div key={item.path} className="flex justify-center my-1.5 px-2">
                      <NavLink
                        to={item.path}
                        className={`relative group/navlink flex size-11 items-center justify-center rounded-xl transition ${
                          isItemActive
                            ? "bg-brand-soft text-brand font-medium shadow-xs"
                            : "text-muted hover:bg-canvas hover:text-ink"
                        }`}
                      >
                        <Icon className="size-5" />
                        {item.badge && (
                          <span className="absolute top-1.5 right-2.5 size-2 rounded-full bg-brand ring-2 ring-white" />
                        )}

                        {/* Tooltip hiển thị tên chức năng sang bên phải */}
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/navlink:inline-flex items-center whitespace-nowrap rounded-md bg-slate-100 border border-slate-300/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-md z-[100]"
                        >
                          {item.label}
                          {item.badge && (
                            <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.2 text-[10px] text-white">
                              {item.badge}
                            </span>
                          )}
                          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-r-slate-300 border-l-transparent border-t-transparent border-b-transparent" />
                        </span>
                      </NavLink>
                    </div>
                  )
                }

                // Khi sidebar mở rộng
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (isMobile) {
                        closeSidebar()
                      }
                    }}
                    className={({ isActive }) =>
                      `mx-2 flex h-11 items-center gap-3 rounded-r-lg border-l-[3px] px-4 transition ${
                        isActive
                          ? "border-brand bg-brand-soft font-medium text-brand"
                          : "border-transparent text-muted hover:bg-canvas hover:text-ink"
                      }`
                    }
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-line px-2 py-0.5 text-[11px] text-ink">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer: User profile & Dropup Menu (Thay thế nút đăng xuất cũ) */}
        <div className="relative p-2.5 border-t border-line" ref={sidebarUserMenuRef}>
          {/* Dropup Menu */}
          {sidebarUserMenuOpen && (
            <div
              className={`absolute z-50 rounded-xl border border-line bg-white shadow-xl p-1.5 transition-all ${
                !isMobile && !sidebarOpen
                  ? "left-full ml-2 bottom-2 w-56 animate-in fade-in slide-in-from-left-2 duration-150"
                  : "bottom-full mb-2 left-2 right-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setSidebarUserMenuOpen(false)
                  setProfileModalOpen(true)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-canvas rounded-lg transition"
              >
                <User className="size-4 text-slate-500 shrink-0" />
                <span>Hồ sơ cá nhân</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarUserMenuOpen(false)
                  if (isMobile) closeSidebar()
                  navigate("/change-password")
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-canvas rounded-lg transition"
              >
                <KeyRound className="size-4 text-slate-500 shrink-0" />
                <span>Đổi mật khẩu</span>
              </button>

              <div className="my-1 border-t border-line" role="separator" />

              <button
                type="button"
                onClick={() => {
                  setSidebarUserMenuOpen(false)
                  signOut()
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-brand hover:bg-brand-soft rounded-lg transition"
              >
                <LogOut className="size-4 shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* User trigger button */}
          {!isMobile && !sidebarOpen ? (
            <button
              type="button"
              onClick={() => setSidebarUserMenuOpen((prev) => !prev)}
              title={user.fullName || user.name || "Tài khoản"}
              className="flex size-10 mx-auto items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold hover:ring-2 hover:ring-brand/40 transition select-none cursor-pointer"
            >
              {getUserInitials(user.fullName || user.name)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarUserMenuOpen((prev) => !prev)}
              className="flex w-full items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-100/70 transition cursor-pointer select-none group"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shrink-0 group-hover:ring-2 group-hover:ring-brand/30 transition">
                {getUserInitials(user.fullName || user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user.fullName || user.name || "Người dùng"}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.email || user.username || "Tài khoản"}
                </p>
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* Main content wrapper */}
      <div
        className={`transition-[padding] duration-300 ease-in-out ${
          isMobile
            ? "pl-0"
            : sidebarOpen
            ? "md:pl-[248px]"
            : "md:pl-[68px]"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center border-b border-line bg-white px-3 sm:px-4 md:px-6">
          {/* Nút Hamburger chỉ hiển thị trên Mobile (Clickable area tối thiểu 44x44px) */}
          <button
            type="button"
            aria-label="Mở thanh bên"
            className="mr-2 sm:mr-3 md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink active:scale-95 transition"
            onClick={openSidebar}
          >
            <Menu className="size-6" />
          </button>

          <span className="truncate font-semibold text-ink text-sm sm:text-base">
            {activeItem?.label ?? ""}
          </span>

          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <span className="hidden rounded-lg bg-canvas px-3 py-1.5 text-xs text-muted lg:inline">
              {user.facultyName || user.className || user.context || "Hệ thống"}
            </span>
            <NotificationBell />
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-canvas transition"
              >
                <span className="flex size-9 sm:size-8 items-center justify-center rounded-full bg-night text-xs font-semibold text-white shrink-0">
                  {(user.fullName || user.name || "U").split(" ").at(-1)[0]}
                </span>
                <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                  {user.fullName || user.name}
                </span>
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-white py-1.5 shadow-lg z-50">
                  <div className="px-3.5 py-2 border-b border-line">
                    <p className="text-sm font-semibold text-ink truncate">
                      {user.fullName || user.name}
                    </p>
                    {user.email && (
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false)
                      navigate("/change-password")
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink hover:bg-canvas transition"
                  >
                    <KeyRound className="size-4 text-muted shrink-0" />
                    <span>Đổi mật khẩu</span>
                  </button>
                  <div className="my-1 border-t border-line" role="separator" />
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand hover:bg-brand-soft transition"
                  >
                    <LogOut className="size-4 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className={
            location.pathname.includes("/design")
              ? "h-[calc(100vh-3.5rem)] w-full max-w-none m-0 p-0 overflow-hidden"
              : "mx-auto max-w-[1280px] p-3 sm:p-4 md:p-6"
          }
        >
          <Outlet />
        </main>
      </div>

      {/* MODAL HỒ SƠ CÁ NHÂN */}
      <Modal
        open={profileModalOpen}
        title="Hồ sơ cá nhân"
        onClose={() => setProfileModalOpen(false)}
        size="md"
        className="max-w-md"
        footer={
          <div className="flex w-full items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                setProfileModalOpen(false)
                navigate("/change-password")
              }}
            >
              <KeyRound className="size-4 mr-1 text-slate-500" />
              Đổi mật khẩu
            </Button>
            <Button variant="primary" onClick={() => setProfileModalOpen(false)}>
              Đóng
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <span className="flex size-14 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white shrink-0">
              {getUserInitials(user.fullName || user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-800 truncate">
                {user.fullName || user.name || "Người dùng"}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user.email || user.username || "Chưa có email"}
              </p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                {roleLabelMap[user.role] || user.role}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Mã định danh / Tên đăng nhập:</span>
              <span className="font-mono font-semibold text-slate-800">
                {user.username || user.code || user.id || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-800">{user.email || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Đơn vị / Khoa:</span>
              <span className="font-medium text-slate-800">
                {user.facultyName || user.departmentName || user.context || "Trường Đại học Việt Nhật (VJU)"}
              </span>
            </div>
            {user.className && (
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Lớp sinh hoạt:</span>
                <span className="font-medium text-slate-800">{user.className}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Chữ ký số cá nhân:</span>
              <span className="font-medium text-emerald-700">
                {user.signatureSpecimenUrl ? "Đã thiết lập chữ ký" : "Chưa tải mẫu chữ ký"}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
