package com.git.techocean.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.git.techocean.model.Carga;

public interface CargaRepository extends JpaRepository<Carga, Long> {
}