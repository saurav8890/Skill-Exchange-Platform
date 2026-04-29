package com.exskill.exskill.service;

import com.exskill.exskill.model.ExchangeRequest;
import com.exskill.exskill.model.User;
import com.exskill.exskill.repository.ExchangeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExchangeService {

    private final ExchangeRepository exchangeRepository;

    // Constructor Injection
    public ExchangeService(ExchangeRepository exchangeRepository) {
        this.exchangeRepository = exchangeRepository;
    }

    // 🔥 1. Send Request
    public ExchangeRequest sendRequest(ExchangeRequest request) {

        request.setStatus("PENDING");

        return exchangeRepository.save(request);
    }

    // 🔥 2. Accept Request
    public ExchangeRequest acceptRequest(Long id) {

        ExchangeRequest req = exchangeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // validation (optional but good)
        if (!req.getStatus().equals("PENDING")) {
            throw new RuntimeException("Request already processed");
        }

        req.setStatus("ACCEPTED");

        return exchangeRepository.save(req);
    }

    // 🔥 3. Reject Request
    public ExchangeRequest rejectRequest(Long id) {

        ExchangeRequest req = exchangeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!req.getStatus().equals("PENDING")) {
            throw new RuntimeException("Request already processed");
        }

        req.setStatus("REJECTED");

        return exchangeRepository.save(req);
    }

    // 🔥 4. Get Sent Requests (Sender)
    public List<ExchangeRequest> getSentRequests(Long userId) {

        User user = new User();
        user.setId(userId);

        return exchangeRepository.findBySender(user);
    }

    // 🔥 5. Get Received Requests (Receiver)
    public List<ExchangeRequest> getReceivedRequests(Long userId) {

        User user = new User();
        user.setId(userId);

        return exchangeRepository.findByReceiver(user);
    }

    public List<ExchangeRequest> getAllRequests() {
        return exchangeRepository.findAll();
    }

    // 🔥 6. Get by Status
    public List<ExchangeRequest> getByStatus(String status) {
        return exchangeRepository.findByStatus(status);
    }

    // 🔥 7. Delete Request
    public void deleteRequest(Long id) {

        ExchangeRequest req = exchangeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        exchangeRepository.delete(req);
    }
}
