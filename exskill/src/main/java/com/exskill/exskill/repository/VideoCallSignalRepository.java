package com.exskill.exskill.repository;

import com.exskill.exskill.model.VideoCallSignal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VideoCallSignalRepository extends JpaRepository<VideoCallSignal, Long> {

    List<VideoCallSignal> findByExchangeRequestIdAndReceiverIdAndDeliveredFalseOrderByCreatedAtAsc(Long exchangeRequestId, Long receiverId);
}
