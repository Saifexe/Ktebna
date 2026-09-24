package com.ktebna.backend.repository;

import com.ktebna.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // One atomic UPDATE, so two simultaneous requests can't lose an increment.
    @Modifying
    @Transactional
    @Query("update User u set u.tokenVersion = u.tokenVersion + 1 where u.id = :userId")
    void incrementTokenVersion(@Param("userId") Long userId);
}
