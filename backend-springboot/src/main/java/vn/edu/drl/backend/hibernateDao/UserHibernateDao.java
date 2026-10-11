package vn.edu.drl.backend.hibernateDao;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.stereotype.Repository;
import vn.edu.drl.backend.model.User;
import vn.edu.drl.backend.enu.Role;

import java.util.ArrayList;
import java.util.List;

@Repository
public class UserHibernateDao extends GenericHibernateDao<User, Long> {

    public UserHibernateDao() {
        super(User.class);
    }

    public List<User> filterUsers(Long departmentId, Long classId, String cohort, String role) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> query = cb.createQuery(User.class);
        Root<User> root = query.from(User.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        if (departmentId != null) {
            predicates.add(cb.equal(root.get("department").get("id"), departmentId));
        }
        if (classId != null) {
            predicates.add(cb.equal(root.get("classEntity").get("id"), classId));
        }
        if (cohort != null && !cohort.trim().isEmpty()) {
            predicates.add(cb.equal(root.get("academicCohort"), cohort));
        }
        if (role != null && !role.trim().isEmpty()) {
            predicates.add(cb.equal(root.get("role"), Role.valueOf(role)));
        }
        
        query.where(predicates.toArray(new Predicate[0]));
        return entityManager.createQuery(query).getResultList();
    }
}
