package com.exskill.exskill.controller;

import com.exskill.exskill.model.User;
import com.exskill.exskill.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/users", "/user"})
@CrossOrigin("*")
public class UserController {

    private static final String ADMIN_ACCESS_CODE = "EXSKILL_ADMIN_2026";

    private final UserRepository repo;

    public UserController(UserRepository repo) {
        this.repo = repo;
    }

    @PostMapping({"", "/", "/register"})
    public User register(@RequestBody User user) {
        if (user.getName() == null || user.getName().isBlank()
                || user.getEmail() == null || user.getEmail().isBlank()
                || user.getPassword() == null || user.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All fields are required");
        }

        if (user.isAdmin() && (user.getAdminCode() == null || !ADMIN_ACCESS_CODE.equals(user.getAdminCode().trim()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid admin access code");
        }

        if (repo.findByEmail(user.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        return repo.save(user);
    }

    @GetMapping({"", "/"})
    public List<User> getAllUsers() {
        return repo.findAll();
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> loginRequest) {
        String emailOrName = loginRequest.getOrDefault("email", "").trim();
        String password = loginRequest.getOrDefault("password", "").trim();

        if (emailOrName.isBlank() || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name or email and password are required");
        }

        User existingUser = repo.findByEmailOrName(emailOrName, emailOrName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (existingUser.getPassword() == null || !existingUser.getPassword().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid name/email or password");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", existingUser.getId());
        response.put("name", existingUser.getName());
        response.put("email", existingUser.getEmail());
        response.put("admin", existingUser.isAdmin());
        return response;
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@RequestBody Map<String, String> resetRequest) {
        String email = resetRequest.getOrDefault("email", "").trim();
        String newPassword = resetRequest.getOrDefault("newPassword", "").trim();

        if (email.isBlank() || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and new password are required");
        }

        if (newPassword.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 4 characters");
        }

        User existingUser = repo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found with this email"));

        existingUser.setPassword(newPassword);
        repo.save(existingUser);

        return Map.of("message", "Password reset successful");
    }
}
