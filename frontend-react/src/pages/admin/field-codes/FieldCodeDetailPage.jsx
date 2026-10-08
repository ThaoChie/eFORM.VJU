import { ArrowLeft, Pencil } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import {
  Button,
  Card,
  PageTitle,
} from "../../../components/ui/Primitives"
import { client } from "../../../lib/axios/client"

export default function FieldCodeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadField = async () => {
      try {
        const res = await client.get("/fields", { params: { page: 0, size: 100 } });
        const item = res.content?.find(x => x.id === Number(id));
        if (item) {
          setField(item);
        } else {
          toast.error("Không tìm thấy trường thông tin");
        }
      } catch (e) {
        toast.error("Lỗi tải chi tiết trường thông tin");
      } finally {
        setLoading(false);
      }
    };
    loadField();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted">Đang tải...</div>;
  if (!field) return <div className="p-8 text-center text-red-500">Dữ liệu không tồn tại.</div>;

  return (
    <>
      <PageTitle
        title="Chi tiết Trường thông tin"
        description={`Xem chi tiết cấu hình của trường ${field.fieldCode}`}
      />
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <h2 className="mb-4 font-semibold border-b border-line pb-2">Thông tin chung</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <p className="text-muted mb-1">Mã trường</p>
              <p className="font-medium font-mono text-brand">{field.fieldCode}</p>
            </div>
            <div>
              <p className="text-muted mb-1">Tên trường</p>
              <p className="font-medium">{field.fieldName}</p>
            </div>
            <div>
              <p className="text-muted mb-1">Nhóm trường</p>
              <p className="font-medium">{field.category || "COMMON"}</p>
            </div>
            <div>
              <p className="text-muted mb-1">Kiểu dữ liệu</p>
              <p className="font-medium">{field.dataType}</p>
            </div>
            <div>
              <p className="text-muted mb-1">Trạng thái hiệu lực</p>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${field.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {field.isActive ? "Đang hiệu lực" : "Vô hiệu hóa"}
              </span>
            </div>
          </div>
        </Card>
        
        <Card>
          <h2 className="mb-4 font-semibold border-b border-line pb-2">Quy tắc xác thực</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <p className="text-muted mb-1">Bắt buộc nhập</p>
              <p className="font-medium">{field.isRequired ? "Có" : "Không"}</p>
            </div>
            {field.dataType === "NUMBER" && (
              <>
                <div>
                  <p className="text-muted mb-1">Giá trị nhỏ nhất</p>
                  <p className="font-medium">{field.minValue !== null ? field.minValue : "Không giới hạn"}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Giá trị lớn nhất</p>
                  <p className="font-medium">{field.maxValue !== null ? field.maxValue : "Không giới hạn"}</p>
                </div>
              </>
            )}
            <div className="col-span-2">
              <p className="text-muted mb-1">Biểu thức chính quy (Regex)</p>
              <p className="font-medium font-mono">{field.regexPattern || "Không có"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted mb-1">Ghi chú / Mô tả</p>
              <p className="font-medium whitespace-pre-wrap">{field.description || "Không có"}</p>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-0 flex justify-end gap-2 rounded-lg border border-line bg-white p-4">
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <Button variant="primary" onClick={() => navigate(`/admin/field-codes/${id}/edit`)}>
            <Pencil className="size-4" />
            Chỉnh sửa
          </Button>
        </div>
      </div>
    </>
  )
}
