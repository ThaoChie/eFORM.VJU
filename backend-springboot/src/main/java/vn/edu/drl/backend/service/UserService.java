package vn.edu.drl.backend.service;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.hibernateDao.UserHibernateDao;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.enu.Role;
import vn.edu.drl.backend.dto.request.UserRequest;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.*;

public interface UserService {
    List<User> findAll();
    List<User> findUsers(Long deptId, Long classId, String cohort, String role);
    User create(UserRequest req);
    byte[] generateExcelTemplate();
    Map<String, Object> importFromExcel(MultipartFile file, boolean preview);
    byte[] exportToExcel(Long deptId, Long classId, String cohort, String role);
}
