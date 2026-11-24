import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useReviewStore } from "../../stores/useReviewStore"
import { useAuthStore } from "../../stores/useAuthStore"
import StatusTag from "../../components/ui/StatusTag"
import { ActionViewButton, Button, PageTitle, Pagination, Table } from "../../components/ui/Primitives"
import { Inbox, RefreshCw, Search, X } from "lucide-react"

export default function ReviewQueuePage() {
  const navigate = useNavigate()
  const { items, loading, load } = useReviewStore()
  const user = useAuthStore((state) => state.user)

  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    load()
  }, [load])

  const currentUserId = user?.id ? String(user.id) : null
  const currentUserCode = (user?.userCode || user?.code || "").trim().toLowerCase()

  // Business Rule BUS-CLS02-04: Reviewer's own form must NEVER appear in their review queue
  const validQueueItems = useMemo(() => {
    return items.filter((item) => {
      const studentId = item.raw?.studentId != null ? String(item.raw.studentId) : null
      const studentCode = (item.code || item.raw?.studentCode || "").trim().toLowerCase()

      if (currentUserId && studentId && studentId === currentUserId) return false
      if (currentUserCode && studentCode && studentCode === currentUserCode) return false
      return true
    })
  }, [items, currentUserId, currentUserCode])

  // Search filter by student code, name or class
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return validQueueItems

    return validQueueItems.filter((item) => {
      const name = (item.name || "").toLowerCase()
      const code = (item.code || item.raw?.studentCode || "").toLowerCase()
      const className = (item.className || "").toLowerCase()
      return name.includes(q) || code.includes(q) || className.includes(q)
    })
  }, [validQueueItems, searchQuery])

  // Paged rows
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle
          title="Duyệt phiếu lớp"
          description="Danh sách phiếu tự đánh giá ĐRL của sinh viên đang chờ ban cán sự lớp phê duyệt."
        />
        <Button
          variant="secondary"
          onClick={() => load()}
          loading={loading}
          className="text-xs"
        >
          <RefreshCw className="size-3.5 mr-1" />
          Làm mới
        </Button>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand text-sm">Đang chờ duyệt</span>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
            {validQueueItems.length}
          </span>
        </div>

        {/* Tìm kiếm theo Mã sinh viên / Họ tên */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm kiếm theo mã sinh viên, họ tên..."
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setPage(1)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Xóa tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-line bg-white p-12 text-center text-muted">
          <div className="animate-spin inline-block size-6 border-2 border-brand border-t-transparent rounded-full mb-3" />
          <p>Đang tải danh sách phiếu chờ duyệt...</p>
        </div>
      ) : validQueueItems.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-12 text-center text-muted shadow-2xs">
          <Inbox className="mx-auto size-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Hàng đợi trống</h3>
          <p className="mt-1 text-sm text-slate-500">
            Hiện không có phiếu rèn luyện nào đang ở trạng thái chờ lớp duyệt.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-12 text-center text-muted shadow-2xs">
          <Search className="mx-auto size-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Không tìm thấy kết quả</h3>
          <p className="mt-1 text-sm text-slate-500">
            Không tìm thấy phiếu rèn luyện nào phù hợp với từ khóa "{searchQuery}".
          </p>
          <Button
            variant="secondary"
            className="mt-4 text-xs"
            onClick={() => {
              setSearchQuery("")
              setPage(1)
            }}
          >
            Xóa tìm kiếm
          </Button>
        </div>
      ) : (
        <div>
          <Table
            rows={pagedRows}
            onRow={(r) => navigate(`/class-leader/review/${r.id}`)}
            columns={[
              { key: "stt", title: "STT", render: (_, i) => (page - 1) * pageSize + i + 1 },
              {
                key: "name",
                title: "Sinh viên",
                render: (r) => (
                  <div>
                    <span className="font-semibold text-slate-800">{r.name}</span>
                    {r.className && (
                      <small className="block text-slate-400 text-xs">
                        {r.className}
                      </small>
                    )}
                  </div>
                ),
              },
              { key: "code", title: "Mã SV", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
              { key: "submitted", title: "Ngày nộp" },
              {
                key: "score",
                title: "Tổng điểm SV",
                render: (r) => (
                  <span className="font-mono font-bold text-slate-800">
                    {r.score}đ
                  </span>
                ),
              },
              {
                key: "status",
                title: "Trạng thái",
                render: (r) => <StatusTag status={r.status} />,
              },
              {
                key: "action",
                title: "Thao tác",
                render: (r) => (
                  <div className="flex items-center gap-1">
                    <ActionViewButton
                      label="Thẩm định phiếu"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/class-leader/review/${r.id}`)
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />

          {/* Phân trang chuẩn hệ thống */}
          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={filteredItems.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="mt-4 rounded-xl border border-line"
          />
        </div>
      )}
    </>
  )
}
