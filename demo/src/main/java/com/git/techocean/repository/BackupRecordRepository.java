package com.git.techocean.repository;

import com.git.techocean.model.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BackupRecordRepository extends JpaRepository<BackupRecord, Long> { }
