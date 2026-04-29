package com.exskill.exskill.controller;

import com.exskill.exskill.model.ChatMessage;
import com.exskill.exskill.model.ExchangeRequest;
import com.exskill.exskill.service.ChatMessageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    public ChatMessageController(ChatMessageService chatMessageService) {
        this.chatMessageService = chatMessageService;
    }

    @GetMapping("/rooms/{userId}")
    public List<ExchangeRequest> getRooms(@PathVariable Long userId) {
        return chatMessageService.getAvailableRooms(userId);
    }

    @GetMapping("/messages/{exchangeRequestId}")
    public List<ChatMessage> getMessages(@PathVariable Long exchangeRequestId,
                                         @RequestParam Long userId) {
        return chatMessageService.getMessages(exchangeRequestId, userId);
    }

    @PostMapping("/send")
    public ChatMessage sendMessage(@RequestBody SendChatMessageRequest request) {
        return chatMessageService.sendMessage(
                request.exchangeRequestId(),
                request.senderId(),
                request.content()
        );
    }

    public record SendChatMessageRequest(Long exchangeRequestId, Long senderId, String content) {
    }
}
