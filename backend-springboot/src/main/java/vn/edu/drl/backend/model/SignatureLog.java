package vn.edu.drl.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import vn.edu.drl.backend.enu.Role;
import java.time.Instant;

@Data
@Entity
@Table(name = "signature_logs")
public class SignatureLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "score_form_id")
    private ScoreForm scoreForm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signer_id")
    private User signer;

    @Enumerated(EnumType.STRING)
    @Column(name = "signer_role", length = 50)
    private Role signerRole;

    @Column(name = "sign_order")
    private Integer signOrder;

    @Column(name = "signature_img_url", columnDefinition = "TEXT")
    private String signatureImgUrl;

    @Column(name = "sha256_hash")
    private String sha256Hash;

    @Column(name = "signed_at", insertable = false, updatable = false)
    private Instant signedAt;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "is_revoked")
    private Boolean isRevoked = false;
}
