import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-white transition-[width,transform] duration-300 ease-in-out ${
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
                <img src="/logoVJU.png" alt="VJU Logo" className="h-[42px] object-contain shrink-0" />
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
        <nav className="flex-1 overflow-y-auto py-3">
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
                    <div key={item.path} className="relative group flex justify-center my-1.5 px-2">
                      <NavLink
                        to={item.path}
                        className={`flex size-11 items-center justify-center rounded-xl transition ${
                          isItemActive
                            ? "bg-brand-soft text-brand font-medium shadow-xs"
                            : "text-muted hover:bg-canvas hover:text-ink"
                        }`}
                      >
                        <Icon className="size-5" />
                        {item.badge && (
                          <span className="absolute top-1.5 right-2.5 size-2 rounded-full bg-brand ring-2 ring-white" />
                        )}
                      </NavLink>

                      {/* Tooltip hiển thị tên chức năng sang bên phải */}
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover:inline-flex items-center whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl ring-1 ring-white/10 z-[100]"
                      >
                        {item.label}
                        {item.badge && (
                          <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.2 text-[10px] text-white">
                            {item.badge}
                          </span>
                        )}
                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-r-slate-900 border-transparent" />
                      </span>
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

        {/* Footer: Đăng xuất */}
        <div className="p-2 border-t border-line">
          {!isMobile && !sidebarOpen ? (
            <div className="flex justify-center">
              <IconButton
                label="Đăng xuất"
                tooltipPlacement="right"
                className="text-muted hover:text-brand hover:bg-brand-soft rounded-xl size-11 transition"
                onClick={signOut}
              >
                <LogOut className="size-5" />
              </IconButton>
            </div>
          ) : (
            <button
              onClick={signOut}
              className="flex w-full h-11 items-center gap-3 rounded-lg px-4 text-muted hover:bg-canvas hover:text-ink transition"
            >
              <LogOut className="size-[18px] shrink-0" />
              <span className="truncate">Đăng xuất</span>
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
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-line bg-white px-4 md:px-6">
          {/* Nút Hamburger chỉ hiển thị trên Mobile */}
          <button
            type="button"
            aria-label="Mở thanh bên"
            className="mr-3 md:hidden rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink"
            onClick={openSidebar}
          >
            <Menu className="size-5" />
          </button>

          <span className="truncate font-semibold text-ink text-base">
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
