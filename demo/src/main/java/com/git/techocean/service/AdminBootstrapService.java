package com.git.techocean.service;

import com.git.techocean.model.AdminBootstrapLock;
import com.git.techocean.repository.AdminBootstrapLockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminBootstrapService {
    private final AdminBootstrapLockRepository locks;
    public AdminBootstrapService(AdminBootstrapLockRepository locks) { this.locks = locks; }

    @Transactional
    public boolean reserve() {
        locks.saveAndFlush(new AdminBootstrapLock("INITIAL_ADMIN"));
        return true;
    }
}
