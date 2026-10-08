package vn.edu.drl.backend.enu;
public enum SignOrder {
    STUDENT(1), CLASS_LEADER(2), DEAN(3);
    private final int value;
    SignOrder(int value) { this.value = value; }
    public int getValue() { return value; }
}
