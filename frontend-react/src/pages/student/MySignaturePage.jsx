import SignatureUploader from "../../components/signature/SignatureUploader"
import { PageTitle } from "../../components/ui/Primitives"

export default function MySignaturePage({ level = 1 }) {
  return (
    <>
      <PageTitle
        title="Chữ ký của tôi"
        description="Đăng ký một lần để xác nhận các phiếu điện tử."
      />
      <SignatureUploader level={level} />
    </>
  )
}
