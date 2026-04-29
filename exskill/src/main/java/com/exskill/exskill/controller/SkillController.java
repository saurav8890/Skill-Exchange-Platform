package com.exskill.exskill.controller;

import com.exskill.exskill.model.Skill;
import com.exskill.exskill.service.SkillService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    @Autowired
    private SkillService skillService;

    @PostMapping("/add")
    public Skill addSkill(@RequestBody Skill skill) {
        return skillService.addSkill(skill);
    }

    @GetMapping("/all")
    public List<Skill> getAllSkills() {
        return skillService.getAllSkills();
    }

    @GetMapping("/user/{userId}")
    public List<Skill> getSkillsByUser(@PathVariable Long userId) {
        return skillService.getSkillsByUser(userId);
    }
}
