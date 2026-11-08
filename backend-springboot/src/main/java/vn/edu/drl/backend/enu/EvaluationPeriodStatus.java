package vn.edu.drl.backend.enu;

public enum EvaluationPeriodStatus {
    CHUA_MO("Chưa mở"),
    DANG_MO("Đang mở"),
    DA_DONG("Đã đóng");

    private final String displayName;

    EvaluationPeriodStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
