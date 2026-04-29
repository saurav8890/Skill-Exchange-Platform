package com.exskill.exskill.service;

import com.exskill.exskill.model.ExchangeRequest;
import com.exskill.exskill.model.User;
import com.exskill.exskill.model.VideoCallSignal;
import com.exskill.exskill.repository.ExchangeRepository;
import com.exskill.exskill.repository.UserRepository;
import com.exskill.exskill.repository.VideoCallSignalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VideoCallService {

    private final VideoCallSignalRepository videoCallSignalRepository;
    private final ExchangeRepository exchangeRepository;
    private final UserRepository userRepository;

    public VideoCallService(VideoCallSignalRepository videoCallSignalRepository,
                            ExchangeRepository exchangeRepository,
                            UserRepository userRepository) {
        this.videoCallSignalRepository = videoCallSignalRepository;
        this.exchangeRepository = exchangeRepository;
        this.userRepository = userRepository;
    }

    public VideoCallSignal sendSignal(Long exchangeRequestId, Long senderId, String signalType, String payload) {
        ExchangeRequest exchangeRequest = exchangeRepository.findById(exchangeRequestId)
                .orElseThrow(() -> new RuntimeException("Exchange request not found"));

        if (!"ACCEPTED".equalsIgnoreCase(exchangeRequest.getStatus())) {
            throw new RuntimeException("Video call is enabled only after request acceptance");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        boolean participant = exchangeRequest.getSender().getId().equals(senderId)
                || exchangeRequest.getReceiver().getId().equals(senderId);
        if (!participant) {
            throw new RuntimeException("Sender is not part of this private room");
        }

        User receiver = exchangeRequest.getSender().getId().equals(senderId)
                ? exchangeRequest.getReceiver()
                : exchangeRequest.getSender();

        VideoCallSignal signal = new VideoCallSignal();
        signal.setExchangeRequest(exchangeRequest);
        signal.setSender(sender);
        signal.setReceiver(receiver);
        signal.setSignalType(signalType);
        signal.setPayload(payload);
        signal.setDelivered(false);
        signal.setCreatedAt(LocalDateTime.now());

        return videoCallSignalRepository.save(signal);
    }

    public List<VideoCallSignal> pollSignals(Long exchangeRequestId, Long receiverId) {
        ExchangeRequest exchangeRequest = exchangeRepository.findById(exchangeRequestId)
                .orElseThrow(() -> new RuntimeException("Exchange request not found"));

        boolean participant = exchangeRequest.getSender().getId().equals(receiverId)
                || exchangeRequest.getReceiver().getId().equals(receiverId);
        if (!participant) {
            throw new RuntimeException("You are not part of this private room");
        }

        List<VideoCallSignal> signals = videoCallSignalRepository
                .findByExchangeRequestIdAndReceiverIdAndDeliveredFalseOrderByCreatedAtAsc(exchangeRequestId, receiverId);

        signals.forEach(signal -> signal.setDelivered(true));
        videoCallSignalRepository.saveAll(signals);

        return signals;
    }
}
