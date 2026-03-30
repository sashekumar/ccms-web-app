import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes';
import permissionsRoutes from '../features/permissions/permissions.routes';
import usersRoutes from '../features/users/users.routes';
import { ResponseUtil } from '../core/utils/response.util';
import banksRoutes from '../features/banks/banks.routes';
import clausesRoutes from '../features/clauses/clauses.routes';
import lookupsRoutes from '../features/lookups/lookups.routes';
import mqTemplatesRoutes from '../features/mq-templates/mq-templates.routes';
import hospitalsRoutes from '../features/hospitals/hospitals.routes';
import productsRoutes from '../features/products/products.routes';
import membersRoutes from '../features/members/members.routes';
import admissionsRoutes from '../features/admissions/admissions.routes';
import claimsRoutes from '../features/claims/claims.routes';
import escalationsRoutes from '../features/escalations/escalation.routes';
import investigationsRoutes from '../features/investigations/investigation.routes';
import financialsRoutes from '../features/financials/financials.routes';
import stopLossRoutes from '../features/stop-loss/stop-loss.routes';
import fwdAccumulationRoutes from '../features/fwd-accumulation/fwd-accumulation.routes';
import claimTrackingRoutes from '../features/claim-tracking/claim-tracking.routes';
import auditTrailRoutes from '../features/audit-trail/audit-trail.routes';
import notificationsRoutes from '../features/notifications/notifications.routes';
import checklistsRoutes from '../features/checklists/checklists.routes';
import eightHourMonitoringRoutes from '../features/eight-hour-monitoring/eight-hour-monitoring.routes';
import losMonitoringRoutes from '../features/los-monitoring/los-monitoring.routes';
import defermentMonitoringRoutes from '../features/deferment-monitoring/deferment-monitoring.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/users', usersRoutes);

// Master data routes
router.use('/master/banks', banksRoutes);
router.use('/master/clauses', clausesRoutes);
router.use('/master/lookups', lookupsRoutes);
router.use('/master/mq-templates', mqTemplatesRoutes);

// Hospital management routes
router.use('/hospitals', hospitalsRoutes);

// Products / Policy management routes
router.use('/products', productsRoutes);

// Members / Policy Holders routes
router.use('/members', membersRoutes);

// Admissions / Claims routes
router.use('/admissions', admissionsRoutes);
router.use('/claims', claimsRoutes);

// Common utilities
import commonRoutes from '../features/common/upload.routes';
router.use('/common/upload', commonRoutes);

// Investigations routes (Medical Investigation Case Management)
router.use('/investigations', investigationsRoutes);

// Escalations routes (Escalation Management)
router.use('/escalations', escalationsRoutes);

// Financials routes (Payment Advice Management)
router.use('/financials', financialsRoutes);

// Stop Loss routes
router.use('/stop-loss', stopLossRoutes);

// FWD Accumulation Tracking routes
router.use('/fwd-accumulation', fwdAccumulationRoutes);

// Claim Tracking / SLA routes
router.use('/claim-tracking', claimTrackingRoutes);

// Audit Trail & Admission Logging routes
router.use('/audit-trail', auditTrailRoutes);

// Notifications Log routes
router.use('/notifications', notificationsRoutes);

// Checklists routes
router.use('/checklists', checklistsRoutes);

// Eight Hour Monitoring routes
router.use('/eight-hour-monitoring', eightHourMonitoringRoutes);

// LOS Monitoring routes
router.use('/los-monitoring', losMonitoringRoutes);

// Deferment Monitoring routes
router.use('/deferment-monitoring', defermentMonitoringRoutes);

// Health check
router.get('/health', (req, res) => {
  ResponseUtil.success(res, {
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CCMS API'
  }, 'Service is healthy');
});

export default router;
