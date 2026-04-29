package com.exskill.exskill.service;

import com.exskill.exskill.model.Skill;
import com.exskill.exskill.repository.SkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillService {

    private final SkillRepository skillRepository;

    // Constructor Injection (BEST PRACTICE 🔥)
    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    // Add Skill
    public Skill addSkill(Skill skill) {
        return skillRepository.save(skill);
    }

    // Get All Skills
    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    // Get Skills by User
    public List<Skill> getSkillsByUser(Long userId) {
        return skillRepository.findByUserId(userId);
    }

    // Delete Skill
    public void deleteSkill(Long id) {
        skillRepository.deleteById(id);
    }
}