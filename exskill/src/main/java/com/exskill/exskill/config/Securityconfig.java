package com.exskill.exskill.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

    @Configuration
    public class Securityconfig {

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                    .csrf(csrf -> csrf.disable())   // 🔥 IMPORTANT
                    .authorizeHttpRequests(auth -> auth
                            .anyRequest().permitAll()   // sab allow karo
                    );

            return http.build();
        }
    }

