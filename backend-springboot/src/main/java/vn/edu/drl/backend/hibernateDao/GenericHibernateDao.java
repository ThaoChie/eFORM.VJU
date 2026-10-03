package vn.edu.drl.backend.hibernateDao;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@Transactional
public abstract class GenericHibernateDao<T, ID extends Serializable> {

    @PersistenceContext
    protected EntityManager entityManager;

    private final Class<T> entityClass;

    protected GenericHibernateDao(Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    // --- Basic CRUD Operations ---

    public T save(T entity) {
        entityManager.persist(entity);
        return entity;
    }

    public T update(T entity) {
        return entityManager.merge(entity);
    }

    public void delete(T entity) {
        if (entityManager.contains(entity)) {
            entityManager.remove(entity);
        } else {
            entityManager.remove(entityManager.merge(entity));
        }
    }

    public void deleteById(ID id) {
        findById(id).ifPresent(this::delete);
    }

    @Transactional(readOnly = true)
    public Optional<T> findById(ID id) {
        return Optional.ofNullable(entityManager.find(entityClass, id));
    }

    @Transactional(readOnly = true)
    public List<T> findAll() {
        return entityManager.createQuery("from " + entityClass.getName(), entityClass).getResultList();
    }

    // --- Advanced Query Operations ---

    @Transactional(readOnly = true)
    public List<T> findByHql(String hql, Map<String, Object> params) {
        var query = entityManager.createQuery(hql, entityClass);
        if (params != null) {
            params.forEach(query::setParameter);
        }
        return query.getResultList();
    }

    @Transactional(readOnly = true)
    public List<T> findByNativeQuery(String sql, Map<String, Object> params) {
        Query query = entityManager.createNativeQuery(sql, entityClass);
        if (params != null) {
            params.forEach(query::setParameter);
        }
        @SuppressWarnings("unchecked")
        List<T> resultList = query.getResultList();
        return resultList;
    }

    public int executeUpdateHql(String hql, Map<String, Object> params) {
        var query = entityManager.createQuery(hql);
        if (params != null) {
            params.forEach(query::setParameter);
        }
        return query.executeUpdate();
    }

    public int executeNativeUpdate(String sql, Map<String, Object> params) {
        Query query = entityManager.createNativeQuery(sql);
        if (params != null) {
            params.forEach(query::setParameter);
        }
        return query.executeUpdate();
    }
}
