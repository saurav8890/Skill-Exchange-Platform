package com.exskill.exskill.repository;

import com.exskill.exskill.model.ExchangeRequest;
import com.exskill.exskill.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ExchangeRepository extends JpaRepository<ExchangeRequest, Long> {

    List<ExchangeRequest> findBySender(User sender);

    List<ExchangeRequest> findByReceiver(User receiver);

    List<ExchangeRequest> findByStatus(String status);

    @Query("""
            select e from ExchangeRequest e
            where e.status = :status and (e.sender = :user or e.receiver = :user)
            """)
    List<ExchangeRequest> findAcceptedRoomsByUser(String status, User user);
}
