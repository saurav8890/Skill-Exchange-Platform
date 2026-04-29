package com.exskill.exskill.repository;

import com.exskill.exskill.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByExchangeRequestIdOrderBySentAtAsc(Long exchangeRequestId);
}
