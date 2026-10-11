package vn.edu.drl.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.drl.backend.dao.*;
import vn.edu.drl.backend.dto.response.dashboard.*;
import vn.edu.drl.backend.enu.FormVersionStatus;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.enu.ScoreFormStatus;
import vn.edu.drl.backend.model.*;
import vn.edu.drl.backend.service.DashboardService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassRepository classRepository;
    private final SemesterRepository semesterRepository;
    private final FormVersionRepository formVersionRepository;
    private final ScoreFormRepository scoreFormRepository;
    private final NotificationRepository notificationRepository;

    private static final List<Role> STUDENT_ROLES = List.of(Role.STUDENT, Role.CLASS_LEADER, Role.CLASS_DEPUTY);

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard() {
        long totalStudents = userRepository.countByRoleIn(STUDENT_ROLES);
        long completedForms = scoreFormRepository.countByStatus(ScoreFormStatus.DEAN_APPROVED);
        long pendingApprovals = scoreFormRepository.countByStatusIn(List.of(ScoreFormStatus.SUBMITTED, ScoreFormStatus.CLASS_APPROVED));
        double completionRate = totalStudents > 0 ? Math.round((completedForms * 100.0 / totalStudents) * 10.0) / 10.0 : 0.0;

        // Warnings calculation
        List<String> warnings = new ArrayList<>();
        List<ClassEntity> allClasses = classRepository.findAll();
        for (ClassEntity c : allClasses) {
            if (c.getStatus() != null && c.getStatus() == 0) continue;
            List<User> deputies = userRepository.findByClassEntityIdAndRole(c.getId(), Role.CLASS_DEPUTY);
            if (deputies.isEmpty()) {
                warnings.add("Lớp " + c.getClassCode() + " chưa có Lớp phó");
            }
            List<User> leaders = userRepository.findByClassEntityIdAndRole(c.getId(), Role.CLASS_LEADER);
            if (leaders.isEmpty()) {
                warnings.add("Lớp " + c.getClassCode() + " chưa có Lớp trưởng");
            }
        }

        List<Department> allDepts = departmentRepository.findAll();
        for (Department d : allDepts) {
            if (d.getStatus() != null && d.getStatus() == 0) continue;
            Optional<User> dean = userRepository.findFirstByDepartmentIdAndRole(d.getId(), Role.DEAN);
            if (dean.isEmpty()) {
                warnings.add("Khoa " + d.getDeptName() + " chưa chỉ định Trưởng khoa");
            }
        }

        List<User> officeHolders = userRepository.findByRoleIn(List.of(Role.CLASS_LEADER, Role.CLASS_DEPUTY, Role.DEAN));
        long withoutSig = officeHolders.stream()
                .filter(u -> u.getSignatureSpecimenUrl() == null || u.getSignatureSpecimenUrl().trim().isEmpty())
                .count();
        if (withoutSig > 0) {
            warnings.add(withoutSig + " người dùng giữ chức vụ nhưng chưa có chữ ký");
        }

        // Department Progress
        List<AdminDashboardResponse.DepartmentProgressDto> deptProgressList = new ArrayList<>();
        for (Department d : allDepts) {
            if (d.getStatus() != null && d.getStatus() == 0) continue;
            long dStudents = userRepository.countByDepartmentIdAndRoleIn(d.getId(), STUDENT_ROLES);
            long dCompleted = scoreFormRepository.countByStatusAndStudentDepartmentId(ScoreFormStatus.DEAN_APPROVED, d.getId());
            double pct = dStudents > 0 ? Math.round((dCompleted * 100.0 / dStudents) * 10.0) / 10.0 : 0.0;
            deptProgressList.add(AdminDashboardResponse.DepartmentProgressDto.builder()
                    .departmentId(d.getId())
                    .departmentName(d.getDeptName())
                    .totalStudents(dStudents)
                    .completedCount(dCompleted)
                    .progressPercent(pct)
                    .build());
        }

        return AdminDashboardResponse.builder()
                .totalStudents(totalStudents)
                .pendingApprovals(pendingApprovals)
                .completedForms(completedForms)
                .completionRate(completionRate)
                .warnings(warnings)
                .departmentProgress(deptProgressList)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DeanDashboardResponse getDeanDashboard(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        Department dept = user != null ? user.getDepartment() : null;
        if (dept == null) {
            List<Department> depts = departmentRepository.findAll();
            dept = depts.isEmpty() ? null : depts.get(0);
        }

        Long deptId = dept != null ? dept.getId() : 1L;
        String deptName = dept != null ? dept.getDeptName() : "Khoa đào tạo";

        Semester activeSemester = semesterRepository.findByIsActiveTrue().orElse(null);
        String semName = activeSemester != null ? activeSemester.getSemesterName() + ", năm học " + activeSemester.getAcademicYear() : "Năm học 2026-2027";

        long totalStudents = userRepository.countByDepartmentIdAndRoleIn(deptId, STUDENT_ROLES);
        long pendingForms = scoreFormRepository.countByStatusAndStudentDepartmentId(ScoreFormStatus.CLASS_APPROVED, deptId);
        long completedForms = scoreFormRepository.countByStatusAndStudentDepartmentId(ScoreFormStatus.DEAN_APPROVED, deptId);

        List<ScoreForm> readyForms = scoreFormRepository.findByStudentDepartmentIdAndStatus(deptId, ScoreFormStatus.CLASS_APPROVED);
        long pendingBatches = readyForms.stream()
                .map(f -> f.getStudent() != null && f.getStudent().getClassEntity() != null ? f.getStudent().getClassEntity().getId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        // Class Progress
        List<ClassEntity> deptClasses = classRepository.findByDepartmentId(deptId);
        List<DeanDashboardResponse.ClassProgressDto> classProgressList = new ArrayList<>();
        for (ClassEntity c : deptClasses) {
            long cStudents = userRepository.countByClassEntityIdAndRoleIn(c.getId(), STUDENT_ROLES);
            long cCompleted = scoreFormRepository.countByStatusAndStudentClassEntityId(ScoreFormStatus.DEAN_APPROVED, c.getId());
            double pct = cStudents > 0 ? Math.round((cCompleted * 100.0 / cStudents) * 10.0) / 10.0 : 0.0;
            classProgressList.add(DeanDashboardResponse.ClassProgressDto.builder()
                    .classId(c.getId())
                    .classCode(c.getClassCode())
                    .className(c.getClassName())
                    .totalStudents(cStudents)
                    .completedCount(cCompleted)
                    .progressPercent(pct)
                    .slow(pct < 60.0)
                    .build());
        }

        // Warning Students
        List<ScoreForm> deptForms = scoreFormRepository.findByStudentDepartmentId(deptId);
        List<DeanDashboardResponse.WarningStudentDto> warningStudents = new ArrayList<>();
        for (ScoreForm sf : deptForms) {
            BigDecimal score = sf.getFinalTotal() != null ? sf.getFinalTotal() : sf.getClassTotal();
            boolean isLow = score != null && score.doubleValue() < 50.0;
            boolean isRejected = sf.getStatus() == ScoreFormStatus.REJECTED;
            if (isLow || isRejected) {
                User st = sf.getStudent();
                warningStudents.add(DeanDashboardResponse.WarningStudentDto.builder()
                        .id(sf.getId())
                        .name(st != null ? st.getFullName() : "Sinh viên")
                        .code(st != null ? st.getUserCode() : "")
                        .className(st != null && st.getClassEntity() != null ? st.getClassEntity().getClassCode() : "")
                        .score(score != null ? score.doubleValue() : null)
                        .ranking(sf.getRanking() != null ? sf.getRanking() : (isLow ? "Yếu" : "Chưa xếp loại"))
                        .status(sf.getStatus().name())
                        .reason(sf.getRejectReason())
                        .build());
            }
        }

        return DeanDashboardResponse.builder()
                .departmentId(deptId)
                .departmentName(deptName)
                .semesterName(semName)
                .totalStudents(totalStudents)
                .pendingForms(pendingForms)
                .pendingBatches(pendingBatches)
                .completedForms(completedForms)
                .classesProgress(classProgressList)
                .warningStudents(warningStudents)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ClassLeaderDashboardResponse getClassLeaderDashboard(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        ClassEntity cEntity = user != null ? user.getClassEntity() : null;
        if (cEntity == null) {
            List<ClassEntity> classes = classRepository.findAll();
            cEntity = classes.isEmpty() ? null : classes.get(0);
        }

        Long classId = cEntity != null ? cEntity.getId() : 1L;
        String classCode = cEntity != null ? cEntity.getClassCode() : "BCSE2023";
        String className = cEntity != null ? cEntity.getClassName() : "Lớp đào tạo";

        Semester activeSemester = semesterRepository.findByIsActiveTrue().orElse(null);
        String semName = activeSemester != null ? activeSemester.getSemesterName() + ", năm học " + activeSemester.getAcademicYear() : "Học kỳ 1, năm học 2026-2027";

        List<User> students = userRepository.findByClassEntityIdOrderByUserCodeAsc(classId);
        long totalStudents = students.size();

        List<ScoreForm> classForms = scoreFormRepository.findByStudentClassEntityId(classId);
        Map<Long, ScoreForm> formMap = new HashMap<>();
        for (ScoreForm sf : classForms) {
            if (sf.getStudent() != null) {
                formMap.put(sf.getStudent().getId(), sf);
            }
        }

        long notSubmitted = 0;
        long waitingClass = 0;
        long waitingDean = 0;
        long completed = 0;
        long rejected = 0;

        double scoreSum = 0;
        int scoreCount = 0;

        long xs = 0, tot = 0, kha = 0, tb = 0, yeu = 0, kem = 0;

        List<ClassLeaderDashboardResponse.StudentRowDto> studentRows = new ArrayList<>();
        for (User st : students) {
            ScoreForm sf = formMap.get(st.getId());
            String vnStatus = "Chưa nộp";
            Double sc = null;
            String rank = "—";

            if (sf == null) {
                notSubmitted++;
            } else {
                switch (sf.getStatus()) {
                    case DRAFT -> {
                        vnStatus = "Soạn thảo";
                        notSubmitted++;
                    }
                    case SUBMITTED -> {
                        vnStatus = "Chờ lớp duyệt";
                        waitingClass++;
                    }
                    case CLASS_APPROVED -> {
                        vnStatus = "Chờ khoa duyệt";
                        waitingDean++;
                    }
                    case DEAN_APPROVED -> {
                        vnStatus = "Hoàn tất";
                        completed++;
                    }
                    case REJECTED -> {
                        vnStatus = "Đã chuyển trả";
                        rejected++;
                    }
                }

                BigDecimal val = sf.getFinalTotal() != null ? sf.getFinalTotal() : (sf.getClassTotal() != null ? sf.getClassTotal() : sf.getStudentTotal());
                if (val != null) {
                    sc = val.doubleValue();
                    scoreSum += sc;
                    scoreCount++;

                    if (sc >= 90) { rank = "Xuất sắc"; xs++; }
                    else if (sc >= 80) { rank = "Tốt"; tot++; }
                    else if (sc >= 65) { rank = "Khá"; kha++; }
                    else if (sc >= 50) { rank = "Trung bình"; tb++; }
                    else if (sc >= 35) { rank = "Yếu"; yeu++; }
                    else { rank = "Kém"; kem++; }
                } else if (sf.getRanking() != null) {
                    rank = sf.getRanking();
                }
            }

            studentRows.add(ClassLeaderDashboardResponse.StudentRowDto.builder()
                    .id(st.getId())
                    .name(st.getFullName())
                    .code(st.getUserCode())
                    .className(classCode)
                    .score(sc)
                    .rank(rank)
                    .status(vnStatus)
                    .build());
        }

        double avgScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10.0) / 10.0 : 0.0;

        long gradedTotal = Math.max(1, scoreCount);
        List<ClassLeaderDashboardResponse.RankingDistributionDto> rankingDist = List.of(
                new ClassLeaderDashboardResponse.RankingDistributionDto("XS", xs, Math.round(xs * 100.0 / gradedTotal)),
                new ClassLeaderDashboardResponse.RankingDistributionDto("Tốt", tot, Math.round(tot * 100.0 / gradedTotal)),
                new ClassLeaderDashboardResponse.RankingDistributionDto("Khá", kha, Math.round(kha * 100.0 / gradedTotal)),
                new ClassLeaderDashboardResponse.RankingDistributionDto("TB", tb, Math.round(tb * 100.0 / gradedTotal)),
                new ClassLeaderDashboardResponse.RankingDistributionDto("Yếu", yeu, Math.round(yeu * 100.0 / gradedTotal)),
                new ClassLeaderDashboardResponse.RankingDistributionDto("Kém", kem, Math.round(kem * 100.0 / gradedTotal))
        );

        return ClassLeaderDashboardResponse.builder()
                .classId(classId)
                .classCode(classCode)
                .className(className)
                .semesterName(semName)
                .totalStudents(totalStudents)
                .completedCount(completed)
                .pendingCount(waitingClass + waitingDean)
                .averageScore(avgScore)
                .progressBreakdown(new ClassLeaderDashboardResponse.ProgressBreakdownDto(notSubmitted, waitingClass, waitingDean, completed, rejected))
                .rankingDistribution(rankingDist)
                .students(studentRows)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentDashboardResponse getStudentDashboard(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("NOT_FOUND"));
        boolean hasSig = user.getSignatureSpecimenUrl() != null && !user.getSignatureSpecimenUrl().trim().isEmpty();
        boolean isLeader = user.getRole() == Role.CLASS_LEADER || user.getRole() == Role.CLASS_DEPUTY;
        long pendingReviews = 0;
        if (isLeader && user.getClassEntity() != null) {
            pendingReviews = scoreFormRepository.countByStatusAndStudentClassEntityId(ScoreFormStatus.SUBMITTED, user.getClassEntity().getId());
        }

        Semester semester = semesterRepository.findByIsActiveTrue().orElse(null);
        LocalDate today = LocalDate.now();
        long remDays = 15;
        String deadlineStr = "30/11/2026";
        if (semester != null && semester.getEndDate() != null) {
            remDays = Math.max(0, ChronoUnit.DAYS.between(today, semester.getEndDate()));
            deadlineStr = semester.getEndDate().getDayOfMonth() + "/" + semester.getEndDate().getMonthValue() + "/" + semester.getEndDate().getYear();
        }

        StudentDashboardResponse.SemesterInfoDto semDto = StudentDashboardResponse.SemesterInfoDto.builder()
                .id(semester != null ? semester.getId() : 1L)
                .name(semester != null ? semester.getSemesterName() : "Học kỳ 1")
                .academicYear(semester != null ? semester.getAcademicYear() : "2026-2027")
                .deadline(deadlineStr)
                .remainingDays(remDays)
                .build();

        // Active form version
        String fvName = "Biểu mẫu ĐRL " + (semester != null ? semester.getAcademicYear() : "2026-2027");
        if (semester != null) {
            Optional<FormVersion> fvOpt = formVersionRepository.findByFormCodeAndSemesterIdAndStatus("FORM_DRL", semester.getId(), FormVersionStatus.ACTIVE);
            if (fvOpt.isPresent()) {
                fvName = fvOpt.get().getFormName() + " (v" + fvOpt.get().getVersionNo() + ")";
            }
        }

        // Student's score form
        Optional<ScoreForm> sfOpt = semester != null
                ? scoreFormRepository.findByStudentIdAndSemesterId(userId, semester.getId())
                : scoreFormRepository.findTopByStudentIdOrderByCreatedAtDesc(userId);

        StudentDashboardResponse.MyFormDto myFormDto = new StudentDashboardResponse.MyFormDto();
        if (sfOpt.isPresent()) {
            ScoreForm sf = sfOpt.get();
            myFormDto.setFormId(sf.getId());
            BigDecimal sc = sf.getFinalTotal() != null ? sf.getFinalTotal() : (sf.getClassTotal() != null ? sf.getClassTotal() : sf.getStudentTotal());
            myFormDto.setScore(sc != null ? sc.doubleValue() : null);
            myFormDto.setRanking(sf.getRanking());

            switch (sf.getStatus()) {
                case DRAFT -> {
                    myFormDto.setStatus("Soạn thảo");
                    myFormDto.setCurrentStep(0);
                }
                case SUBMITTED -> {
                    myFormDto.setStatus("Chờ lớp duyệt");
                    myFormDto.setCurrentStep(1);
                }
                case CLASS_APPROVED -> {
                    myFormDto.setStatus("Chờ khoa duyệt");
                    myFormDto.setCurrentStep(2);
                }
                case DEAN_APPROVED -> {
                    myFormDto.setStatus("Hoàn tất");
                    myFormDto.setCurrentStep(3);
                }
                case REJECTED -> {
                    myFormDto.setStatus("Đã chuyển trả");
                    myFormDto.setCurrentStep(0);
                }
            }
        } else {
            myFormDto.setStatus("Soạn thảo");
            myFormDto.setCurrentStep(0);
        }

        // Recent Notifications
        List<Notification> notifs = notificationRepository.findByUserId(userId, PageRequest.of(0, 5)).getContent();
        List<StudentDashboardResponse.NotificationDto> notifDtos = notifs.stream()
                .map(n -> StudentDashboardResponse.NotificationDto.builder()
                        .id(n.getId())
                        .text(n.getTitle() != null ? n.getTitle() + ": " + n.getContent() : n.getContent())
                        .time(n.getCreatedAt() != null ? n.getCreatedAt().toString() : "Vừa xong")
                        .read(Boolean.TRUE.equals(n.getIsRead()))
                        .build())
                .collect(Collectors.toList());

        return StudentDashboardResponse.builder()
                .studentName(user.getFullName())
                .hasSignature(hasSig)
                .isLeader(isLeader)
                .pendingLeaderReviews(pendingReviews)
                .semester(semDto)
                .formVersion(fvName)
                .myForm(myFormDto)
                .notifications(notifDtos)
                .build();
    }
}
