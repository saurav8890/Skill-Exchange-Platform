package com.exskill.exskill.controller;

import com.exskill.exskill.model.VideoCallSignal;
import com.exskill.exskill.service.VideoCallService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/video")
public class VideoCallController {

    private final VideoCallService videoCallService;

    public VideoCallController(VideoCallService videoCallService) {
        this.videoCallService = videoCallService;
    }

    @PostMapping("/signal")
    public VideoCallSignal sendSignal(@RequestBody VideoSignalRequest request) {
        return videoCallService.sendSignal(
                request.exchangeRequestId(),
                request.senderId(),
                request.signalType(),
                request.payload()
        );
    }

    @GetMapping("/signals/{exchangeRequestId}")
    public List<VideoCallSignal> pollSignals(@PathVariable Long exchangeRequestId,
                                             @RequestParam Long receiverId) {
        return videoCallService.pollSignals(exchangeRequestId, receiverId);
    }

    public record VideoSignalRequest(Long exchangeRequestId, Long senderId, String signalType, String payload) {
    }
}
