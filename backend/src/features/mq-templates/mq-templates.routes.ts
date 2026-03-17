import { Router } from 'express';
import { MqTemplatesController } from './mq-templates.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

const router = Router();
const controller = new MqTemplatesController();

router.use(authenticateToken);

// Template routes
router.post('/list', requirePermission('MQ_TEMPLATES_MGMT', 'VIEW'), controller.getTemplates);
router.post('/get', requirePermission('MQ_TEMPLATES_MGMT', 'VIEW'), controller.getTemplateById);
router.post('/get-with-questions', requirePermission('MQ_TEMPLATES_MGMT', 'VIEW'), controller.getTemplateWithQuestions);
router.get('/builder', requirePermission('MQ_TEMPLATES_MGMT', 'VIEW'), controller.getBuilderData);
router.post('/create', requirePermission('MQ_TEMPLATES_MGMT', 'CREATE'), controller.createTemplate);
router.put('/update', requirePermission('MQ_TEMPLATES_MGMT', 'UPDATE'), controller.updateTemplate);
router.post('/delete', requirePermission('MQ_TEMPLATES_MGMT', 'DELETE'), controller.deleteTemplate);

// Question sub-routes
router.post('/questions/list', requirePermission('MQ_TEMPLATES_MGMT', 'VIEW'), controller.getQuestions);
router.post('/questions/create', requirePermission('MQ_TEMPLATES_MGMT', 'CREATE'), controller.createQuestion);
router.put('/questions/update', requirePermission('MQ_TEMPLATES_MGMT', 'UPDATE'), controller.updateQuestion);
router.post('/questions/delete', requirePermission('MQ_TEMPLATES_MGMT', 'DELETE'), controller.deleteQuestion);

export default router;
