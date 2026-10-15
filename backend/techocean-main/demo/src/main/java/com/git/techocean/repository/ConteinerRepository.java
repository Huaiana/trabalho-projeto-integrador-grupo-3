package com.git.techocean.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.git.techocean.model.Conteiner;
import java.util.List;

@Repository 
public interface ConteinerRepository extends JpaRepository<Conteiner, Long> {

    //Buscar conteiner pelo código/número único
    Conteiner findByNumeroConteiner(String numeroConteiner);

    // Listar conteineres por situação (ex: DISPONIVEL, EM_USO)
    List<Conteiner> findBySituacao(String situacao);

}