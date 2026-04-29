package com.exskill.exskill.model;

import jakarta.persistence.*;

@Entity
public class ExchangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Request bhejne wala
    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    // Request receive karne wala
    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private User receiver;

    // Offered skill
    @ManyToOne
    @JoinColumn(name = "skill_offered_id")
    private Skill skillOffered;

    // Wanted skill
    @ManyToOne
    @JoinColumn(name = "skill_wanted_id")
    private Skill skillWanted;

    private String status; // PENDING, ACCEPTED, REJECTED

    // Default constructor (IMPORTANT)
    public ExchangeRequest() {}

    // Getters & Setters

    public Long getId() {
        return id;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public User getReceiver() {
        return receiver;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public Skill getSkillOffered() {
        return skillOffered;
    }

    public void setSkillOffered(Skill skillOffered) {
        this.skillOffered = skillOffered;
    }

    public Skill getSkillWanted() {
        return skillWanted;
    }

    public void setSkillWanted(Skill skillWanted) {
        this.skillWanted = skillWanted;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}