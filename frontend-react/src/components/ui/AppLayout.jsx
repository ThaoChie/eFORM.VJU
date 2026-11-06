import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound, X } from "lucide-react"
import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { menus } from "../../common/permission-config"
import { useAuthStore } from "../../stores/useAuthStore"
import { IconButton } from "./Primitives"
import NotificationBell from "./NotificationBell"

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

  // Keyboard shortcut Cmd+B / Ctrl+B to toggle sidebar
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

  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const groups = menus[user.role] ?? []
  const activeItem = groups
    .flatMap((group) => group.items)
    .filter((item) => location.pathname.startsWith(item.path))
    .at(-1)
  const signOut = () => {
    logout()
    navigate("/login")
  }
  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-night/30 backdrop-blur-xs transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-white transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0 shadow-lg md:shadow-none" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/logoVJU.png" alt="VJU Logo" className="h-[42px] object-contain shrink-0" />
            <span className="min-w-0 font-semibold text-xs leading-4 text-brand">
              E-Form Chấm Điểm
              <br />
              Rèn Luyện
            </span>
          </div>
          <IconButton
            label="Thu gọn thanh bên"
            tooltipAlign="right"
            className="text-muted hover:text-brand hover:bg-brand-soft rounded-lg transition"
            onClick={closeSidebar}
          >
            {isMobile ? <X className="size-5" /> : <PanelLeftClose className="size-5" />}
          </IconButton>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {groups.map((group, groupIndex) => (
            <div key={group.title || groupIndex} className="mb-5">
              {group.title && (
                <div className="mb-2 px-6 text-[11px] font-semibold uppercase tracking-wider text-disabled">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
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
                    <Icon className="size-[18px]" />
                    <span className="flex-1">{item.label}</span>
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
        <button
          onClick={signOut}
          className="m-3 flex h-11 items-center gap-3 rounded-lg px-5 text-muted hover:bg-canvas hover:text-ink"
        >
          <LogOut className="size-[18px]" />
          Đăng xuất
        </button>
      </aside>

      {/* Main content wrapper */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "md:pl-[248px]" : "md:pl-0"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-line bg-white px-4 md:px-6">
          <IconButton
            label={sidebarOpen ? "Thu gọn thanh bên" : "Mở thanh bên"}
            tooltipAlign="left"
            className="mr-3 text-muted hover:text-brand hover:bg-brand-soft"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-5" />
            ) : (
              <PanelLeftOpen className="size-5 text-brand" />
            )}
          </IconButton>
          <span className="truncate font-semibold">
            {activeItem?.label ?? ""}
          </span>
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <span className="hidden rounded-lg bg-canvas px-3 py-1.5 text-xs text-muted lg:inline">
              {user.facultyName || user.className || user.context || "Hệ thống"}
            </span>
            <NotificationBell />
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-night text-xs font-semibold text-white">
                {(user.fullName || user.name || "U").split(" ").at(-1)[0]}
              </span>
              <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                {user.fullName || user.name}
              </span>
            </div>
          </div>
        </header>
        <main
          className={
            location.pathname.includes("/design")
              ? "h-[calc(100vh-3.5rem)] w-full max-w-none m-0 p-0 overflow-hidden"
              : "mx-auto max-w-[1280px] p-4 md:p-6"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
