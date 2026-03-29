-- ============================================================================
-- MONITORING SEED DATA
-- Purpose: Create sample data for LOS alerts and 8HM monitoring
-- TASK 12: Provides test data for monitoring dashboard development
-- ============================================================================

USE ccms_db;
GO

PRINT 'Starting monitoring seed data creation...';
GO

-- ============================================================================
-- STEP 1: Create sample LOS alerts (Level 1/2/3 mix)
-- ============================================================================

PRINT 'Creating sample LOS alerts...';
GO

-- Level 1 alerts (7-13 days LOS) - 10 records
INSERT INTO ccms_los_alerts (
  admission_id,
  alert_level,
  triggered_at,
  current_los,
  threshold_days,
  status,
  notes,
  created_at,
  updated_at
)
SELECT TOP 10
  a.admission_id,
  1 as alert_level,
  DATEADD(DAY, -2, GETDATE()) as triggered_at,
  DATEDIFF(DAY, a.admission_date, GETDATE()) as current_los,
  7 as threshold_days,
  'ACTIVE' as status,
  'Auto-generated Level 1 alert' as notes,
  GETDATE() as created_at,
  GETDATE() as updated_at
FROM ccms_admissions a
WHERE a.discharge_date IS NULL
  AND a.is_deleted = 0
  AND DATEDIFF(DAY, a.admission_date, GETDATE()) >= 7
  AND DATEDIFF(DAY, a.admission_date, GETDATE()) < 14
  AND NOT EXISTS (
    SELECT 1 FROM ccms_los_alerts 
    WHERE admission_id = a.admission_id
  );

PRINT '  - Created ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' Level 1 alerts';
GO

-- Level 2 alerts (14-20 days LOS) - 5 records
INSERT INTO ccms_los_alerts (
  admission_id,
  alert_level,
  triggered_at,
  current_los,
  threshold_days,
  status,
  notes,
  created_at,
  updated_at
)
SELECT TOP 5
  a.admission_id,
  2 as alert_level,
  DATEADD(DAY, -5, GETDATE()) as triggered_at,
  DATEDIFF(DAY, a.admission_date, GETDATE()) as current_los,
  14 as threshold_days,
  'ACTIVE' as status,
  'Auto-generated Level 2 alert - Management review required' as notes,
  GETDATE() as created_at,
  GETDATE() as updated_at
FROM ccms_admissions a
WHERE a.discharge_date IS NULL
  AND a.is_deleted = 0
  AND DATEDIFF(DAY, a.admission_date, GETDATE()) >= 14
  AND DATEDIFF(DAY, a.admission_date, GETDATE()) < 21
  AND NOT EXISTS (
    SELECT 1 FROM ccms_los_alerts 
    WHERE admission_id = a.admission_id
  );

PRINT '  - Created ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' Level 2 alerts';
GO

-- Level 3 alerts (21+ days LOS) - 3 records
INSERT INTO ccms_los_alerts (
  admission_id,
  alert_level,
  triggered_at,
  current_los,
  threshold_days,
  status,
  notes,
  created_at,
  updated_at
)
SELECT TOP 3
  a.admission_id,
  3 as alert_level,
  DATEADD(DAY, -8, GETDATE()) as triggered_at,
  DATEDIFF(DAY, a.admission_date, GETDATE()) as current_los,
  21 as threshold_days,
  'ACTIVE' as status,
  'Auto-generated Level 3 alert - Executive review required' as notes,
  GETDATE() as created_at,
  GETDATE() as updated_at
FROM ccms_admissions a
WHERE a.discharge_date IS NULL
  AND a.is_deleted = 0
  AND DATEDIFF(DAY, a.admission_date, GETDATE()) >= 21
  AND NOT EXISTS (
    SELECT 1 FROM ccms_los_alerts 
    WHERE admission_id = a.admission_id
  );

PRINT '  - Created ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' Level 3 alerts';
GO

-- Add some acknowledged alerts (for testing)
INSERT INTO ccms_los_alerts (
  admission_id,
  alert_level,
  triggered_at,
  current_los,
  threshold_days,
  status,
  acknowledged_by,
  acknowledged_at,
  notes,
  created_at,
  updated_at
)
SELECT TOP 5
  a.admission_id,
  1 as alert_level,
  DATEADD(DAY, -3, GETDATE()) as triggered_at,
  DATEDIFF(DAY, a.admission_date, GETDATE()) as current_los,
  7 as threshold_days,
  'ACKNOWLEDGED' as status,
  'admin' as acknowledged_by,
  DATEADD(DAY, -1, GETDATE()) as acknowledged_at,
  'Acknowledged - Patient under observation' as notes,
  DATEADD(DAY, -3, GETDATE()) as created_at,
  DATEADD(DAY, -1, GETDATE()) as updated_at
FROM ccms_admissions a
WHERE a.discharge_date IS NULL
  AND a.is_deleted = 0
  AND DATEDIFF(DAY, a.admission_date, GETDATE()) >= 8
  AND DATEDIFF(DAY, a.admission_date, GETDATE()) < 14
  AND NOT EXISTS (
    SELECT 1 FROM ccms_los_alerts 
    WHERE admission_id = a.admission_id
  );

PRINT '  - Created ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' acknowledged alerts';
GO

-- ============================================================================
-- STEP 2: Create sample 8HM monitoring checks
-- ============================================================================

PRINT 'Creating sample 8HM monitoring checks...';
GO

-- Completed checks (recent check records for active admissions)
INSERT INTO ccms_8hm_monitoring (
  admission_id,
  check_time,
  hours_elapsed,
  status,
  checked_by,
  notes,
  next_check_due,
  created_at,
  updated_at
)
SELECT TOP 20
  a.admission_id,
  DATEADD(HOUR, -4, GETDATE()) as check_time,
  DATEDIFF(HOUR, a.admission_date, GETDATE()) - 4 as hours_elapsed,
  'Checked' as status,
  'monitoring_officer' as checked_by,
  'Patient stable, vitals normal, no concerns at this time' as notes,
  DATEADD(HOUR, 4, GETDATE()) as next_check_due,
  DATEADD(HOUR, -4, GETDATE()) as created_at,
  DATEADD(HOUR, -4, GETDATE()) as updated_at
FROM ccms_admissions a
WHERE a.discharge_date IS NULL
  AND a.is_deleted = 0
  AND DATEDIFF(HOUR, a.admission_date, GETDATE()) >= 8
  AND NOT EXISTS (
    SELECT 1 FROM ccms_8hm_monitoring 
    WHERE admission_id = a.admission_id
  );

PRINT '  - Created ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' completed check records';
GO

-- Pending checks (upcoming checks)
INSERT INTO ccms_8hm_monitoring (
  admission_id,
  check_time,
  hours_elapsed,
  status,
  next_check_due,
  created_at,
  updated_at
)
SELECT TOP 10
  a.admission_id,
  NULL as check_time,
  0 as hours_elapsed,
  'Pending' as status,
  DATEADD(HOUR, 2, GETDATE()) as next_check_due,
  GETDATE() as created_at,
  GETDATE() as updated_at
FROM ccms_admissions a
WHERE a.discharge_date IS NULL
  AND a.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM ccms_8hm_monitoring 
    WHERE admission_id = a.admission_id
  );

PRINT '  - Created ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' pending check records';
GO

-- Overdue checks (for testing overdue handling)
INSERT INTO ccms_8hm_monitoring (
  admission_id,
  check_time,
  hours_elapsed,
  status,
  next_check_due,
  created_at,
  updated_at
)
SELECT TOP 5
  a.admission_id,
  NULL as check_time,
  0 as hours_elapsed,
  'Pending' as status,
  DATEADD(HOUR, -3, GETDATE()) as next_check_due,
  DATEADD(HOUR, -11, GETDATE()) as created_at,
  DATEADD(HOUR, -11, GETDATE()) as updated_at
FROM ccms_admissions a
WHERE a.discharge_date IS NULL
  AND a.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1 FROM ccms_8hm_monitoring 
    WHERE admission_id = a.admission_id
  );

PRINT '  - Created ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' overdue check records';
GO

-- ============================================================================
-- STEP 3: Verify data creation
-- ============================================================================

PRINT '';
PRINT 'Monitoring seed data summary:';
PRINT '======================================';

DECLARE @totalAlerts INT, @activeAlerts INT, @ackedAlerts INT;
DECLARE @totalChecks INT, @pendingChecks INT, @completedChecks INT, @overdueChecks INT;

SELECT @totalAlerts = COUNT(*) FROM ccms_los_alerts;
SELECT @activeAlerts = COUNT(*) FROM ccms_los_alerts WHERE status = 'ACTIVE';
SELECT @ackedAlerts = COUNT(*) FROM ccms_los_alerts WHERE status = 'ACKNOWLEDGED';

SELECT @totalChecks = COUNT(*) FROM ccms_8hm_monitoring;
SELECT @pendingChecks = COUNT(*) FROM ccms_8hm_monitoring WHERE status = 'Pending';
SELECT @completedChecks = COUNT(*) FROM ccms_8hm_monitoring WHERE status = 'Checked';
SELECT @overdueChecks = COUNT(*) FROM ccms_8hm_monitoring WHERE status = 'Pending' AND next_check_due < GETDATE();

PRINT 'LOS Alerts:';
PRINT '  - Total: ' + CAST(@totalAlerts AS VARCHAR(10));
PRINT '  - Active: ' + CAST(@activeAlerts AS VARCHAR(10));
PRINT '  - Acknowledged: ' + CAST(@ackedAlerts AS VARCHAR(10));
PRINT '';
PRINT '8HM Checks:';
PRINT '  - Total: ' + CAST(@totalChecks AS VARCHAR(10));
PRINT '  - Pending: ' + CAST(@pendingChecks AS VARCHAR(10));
PRINT '  - Completed: ' + CAST(@completedChecks AS VARCHAR(10));
PRINT '  - Overdue: ' + CAST(@overdueChecks AS VARCHAR(10));
PRINT '';
PRINT 'Monitoring seed data creation complete!';
GO
