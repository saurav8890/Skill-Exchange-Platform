package com.exskill.exskill.service;

import com.exskill.exskill.model.ChatMessage;
import com.exskill.exskill.model.ExchangeRequest;
import com.exskill.exskill.model.User;
import com.exskill.exskill.repository.ChatMessageRepository;
import com.exskill.exskill.repository.ExchangeRepository;
import com.exskill.exskill.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ExchangeRepository exchangeRepository;
    private final UserRepository userRepository;

    public ChatMessageService(ChatMessageRepository chatMessageRepository,
                              ExchangeRepository exchangeRepository,
                              UserRepository userRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.exchangeRepository = exchangeRepository;
        this.userRepository = userRepository;
    }

    public ChatMessage sendMessage(Long exchangeRequestId, Long senderId, String content) {
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Message cannot be empty");
        }

        ExchangeRequest exchangeRequest = exchangeRepository.findById(exchangeRequestId)
                .orElseThrow(() -> new RuntimeException("Exchange request not found"));

        if (!"ACCEPTED".equalsIgnoreCase(exchangeRequest.getStatus())) {
            throw new RuntimeException("Chat is enabled only after request acceptance");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        boolean senderMatches = exchangeRequest.getSender().getId().equals(senderId)
                || exchangeRequest.getReceiver().getId().equals(senderId);
        if (!senderMatches) {
            throw new RuntimeException("Sender is not part of this chat");
        }

        User receiver = exchangeRequest.getSender().getId().equals(senderId)
                ? exchangeRequest.getReceiver()
                : exchangeRequest.getSender();

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setExchangeRequest(exchangeRequest);
        chatMessage.setSender(sender);
        chatMessage.setReceiver(receiver);
        chatMessage.setContent(content.trim());
        chatMessage.setSentAt(LocalDateTime.now());

        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getMessages(Long exchangeRequestId, Long userId) {
        ExchangeRequest exchangeRequest = exchangeRepository.findById(exchangeRequestId)
                .orElseThrow(() -> new RuntimeException("Exchange request not found"));

        boolean participant = exchangeRequest.getSender().getId().equals(userId)
                || exchangeRequest.getReceiver().getId().equals(userId);
        if (!participant) {
            throw new RuntimeException("You are not allowed to view this chat");
        }

        if (!"ACCEPTED".equalsIgnoreCase(exchangeRequest.getStatus())) {
            throw new RuntimeException("Chat is enabled only after request acceptance");
        }

        return chatMessageRepository.findByExchangeRequestIdOrderBySentAtAsc(exchangeRequestId);
    }

    public List<ExchangeRequest> getAvailableRooms(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return exchangeRepository.findAcceptedRoomsByUser("ACCEPTED", user);
    }
}
