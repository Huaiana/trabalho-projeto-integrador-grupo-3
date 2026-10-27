package com.git.techocean.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.git.techocean.model.Carga;

@Repository
public interface CargaRepository extends JpaRepository<Carga, Long> {
}