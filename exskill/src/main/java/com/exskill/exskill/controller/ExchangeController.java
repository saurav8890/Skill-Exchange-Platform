package com.exskill.exskill.controller;

import com.exskill.exskill.model.ExchangeRequest;
import com.exskill.exskill.service.ExchangeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exchange")
public class ExchangeController {

    private final ExchangeService exchangeService;

    public ExchangeController(ExchangeService exchangeService) {
        this.exchangeService = exchangeService;
    }

    @PostMapping("/request")
    public ExchangeRequest sendRequest(@RequestBody ExchangeRequest request) {
        return exchangeService.sendRequest(request);
    }

    @PutMapping("/accept/{id}")
    public ExchangeRequest accept(@PathVariable Long id) {
        return exchangeService.acceptRequest(id);
    }

    @PutMapping("/reject/{id}")
    public ExchangeRequest reject(@PathVariable Long id) {
        return exchangeService.rejectRequest(id);
    }

    @GetMapping("/sent/{userId}")
    public List<ExchangeRequest> sent(@PathVariable Long userId) {
        return exchangeService.getSentRequests(userId);
    }

    @GetMapping("/received/{userId}")
    public List<ExchangeRequest> received(@PathVariable Long userId) {
        return exchangeService.getReceivedRequests(userId);
    }

    @GetMapping("/all")
    public List<ExchangeRequest> all() {
        return exchangeService.getAllRequests();
    }

    @GetMapping("/status/{status}")
    public List<ExchangeRequest> byStatus(@PathVariable String status) {
        return exchangeService.getByStatus(status.toUpperCase());
    }
}
