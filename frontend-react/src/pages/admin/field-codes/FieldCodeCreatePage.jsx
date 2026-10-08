import { ArrowLeft, Save } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import {
  Button,
  Card,
  Input,
  PageTitle,
  Select,
  Textarea,
} from "../../../components/ui/Primitives"
import { client } from "../../../lib/axios/client"

export default function FieldCodeCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    fieldCode: "",
    fieldName: "",
    dataType: "STRING",
    category: "COMMON",
    isRequired: false,
    minValue: "",
    maxValue: "",
    regexPattern: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const loadField = async () => {
        try {
          const res = await client.get("/fields", { params: { page: 0, size: 100 } });
          const item = res.content?.find(x => x.id === Number(id));
          if (item) {
            setForm({
              fieldCode: item.fieldCode || "",
              fieldName: item.fieldName || "",
              dataType: item.dataType || "STRING",
              category: item.category || "COMMON",
              isRequired: item.isRequired || false,
              minValue: item.minValue || "",
              maxValue: item.maxValue || "",
              regexPattern: item.regexPattern || "",
              description: item.description || "",
            });
          }
        } catch (e) {
          toast.error("Không tải được dữ liệu trường");
        }
      };
      loadField();
    }
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!form.fieldCode || !form.fieldName) {
      toast.error("Vui lòng nhập Mã trường và Tên trường");
      return;
    }
    
    const payload = {
      ...form,
      minValue: form.minValue ? Number(form.minValue) : null,
      maxValue: form.maxValue ? Number(form.maxValue) : null,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await client.put(`/fields/${id}`, payload);
        toast.success("Cập nhật trường thông tin thành công");
      } else {
        await client.post("/fields", payload);
        toast.success("Thêm trường thông tin thành công");
      }
      navigate("/admin/field-codes");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Lỗi lưu trường thông tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle
        title={isEdit ? "Chỉnh sửa trường thông tin" : "Thêm trường thông tin"}
        description="Thông tin sẽ được ghi nhận trực tiếp vào hệ thống."
      />
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <h2 className="mb-4 font-semibold">Thông tin chung</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Mã trường *"
              placeholder="Ví dụ: student_name"
              value={form.fieldCode}
              onChange={e => setForm({...form, fieldCode: e.target.value})}
              disabled={isEdit}
            />
            <Input
              label="Tên trường *"
              placeholder="Tên hiển thị"
              value={form.fieldName}
              onChange={e => setForm({...form, fieldName: e.target.value})}
            />
            <Select 
              label="Nhóm trường"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option value="COMMON">COMMON</option>
              <option value="HEADER">HEADER</option>
              <option value="FOOTER">FOOTER</option>
            </Select>
            <Select 
              label="Kiểu dữ liệu"
              value={form.dataType}
              onChange={e => setForm({...form, dataType: e.target.value})}
            >
              <option value="STRING">STRING (Chuỗi)</option>
              <option value="NUMBER">NUMBER (Số)</option>
              <option value="DATE">DATE (Ngày tháng)</option>
              <option value="BOOLEAN">BOOLEAN (Đúng/Sai)</option>
              <option value="FILE">FILE (Tập tin)</option>
              <option value="SIGNATURE">SIGNATURE (Chữ ký)</option>
            </Select>
          </div>
        </Card>
        
        <Card>
          <h2 className="mb-4 font-semibold">Quy tắc xác thực (Không bắt buộc)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 md:col-span-2">
              <input 
                type="checkbox" 
                className="rounded border-line text-brand focus:ring-brand" 
                checked={form.isRequired}
                onChange={e => setForm({...form, isRequired: e.target.checked})}
              />
              Bắt buộc nhập
            </label>
            <Input
              label="Giá trị nhỏ nhất"
              type="number"
              placeholder="Chỉ áp dụng cho NUMBER"
              value={form.minValue}
              onChange={e => setForm({...form, minValue: e.target.value})}
            />
            <Input
              label="Giá trị lớn nhất"
              type="number"
              placeholder="Chỉ áp dụng cho NUMBER"
              value={form.maxValue}
              onChange={e => setForm({...form, maxValue: e.target.value})}
            />
            <div className="md:col-span-2">
              <Input
                label="Biểu thức chính quy (Regex Pattern)"
                placeholder="Ví dụ: ^[A-Z0-9]+$"
                value={form.regexPattern}
                onChange={e => setForm({...form, regexPattern: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Ghi chú / Mô tả"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>
          </div>
        </Card>

        <div className="sticky bottom-0 flex justify-end gap-2 rounded-lg border border-line bg-white p-4">
          <Button onClick={() => navigate(-1)} disabled={loading}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            <Save className="size-4" />
            {loading ? "Đang xử lý..." : "Lưu hệ thống"}
          </Button>
        </div>
      </div>
    </>
  )
}
