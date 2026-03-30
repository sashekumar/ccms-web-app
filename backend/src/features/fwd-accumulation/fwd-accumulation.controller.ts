import { Request, Response } from 'express';
import { FwdAccumulationService } from './fwd-accumulation.service';
import { ResponseUtil } from '../../core/utils/response.util';

export class FwdAccumulationController {
  private readonly service: FwdAccumulationService;

  constructor() {
    this.service = new FwdAccumulationService();
  }

  // GET /fwd-accumulation/stats (POST)
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      ResponseUtil.success(res, stats, 'FWD accumulation statistics retrieved');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to retrieve FWD accumulation statistics', 500);
    }
  };

  // POST /fwd-accumulation/client
  getClientAccumulations = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getClientAccumulations(req.body || {});
      ResponseUtil.success(res, result, 'Client accumulation records retrieved');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to retrieve client accumulation records', 500);
    }
  };

  // POST /fwd-accumulation/disability
  getDisabilityAccumulations = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getDisabilityAccumulations(req.body || {});
      ResponseUtil.success(res, result, 'Disability accumulation records retrieved');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to retrieve disability accumulation records', 500);
    }
  };

  // POST /fwd-accumulation/onetime
  getOnetimeAccumulations = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getOnetimeAccumulations(req.body || {});
      ResponseUtil.success(res, result, 'Onetime accumulation records retrieved');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to retrieve onetime accumulation records', 500);
    }
  };

  // POST /fwd-accumulation/pa
  getPaAccumulations = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getPaAccumulations(req.body || {});
      ResponseUtil.success(res, result, 'PA accumulation records retrieved');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to retrieve PA accumulation records', 500);
    }
  };

  // POST /fwd-accumulation/client/create
  createClientAccumulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const id = await this.service.createClientAccumulation(req.body, userId);
      ResponseUtil.success(res, { client_acc_id: id }, 'Client accumulation record created');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to create client accumulation record', 500);
    }
  };

  // POST /fwd-accumulation/disability/create
  createDisabilityAccumulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const id = await this.service.createDisabilityAccumulation(req.body, userId);
      ResponseUtil.success(res, { disability_acc_id: id }, 'Disability accumulation record created');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to create disability accumulation record', 500);
    }
  };

  // POST /fwd-accumulation/onetime/create
  createOnetimeAccumulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const id = await this.service.createOnetimeAccumulation(req.body, userId);
      ResponseUtil.success(res, { onetime_acc_id: id }, 'Onetime accumulation record created');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to create onetime accumulation record', 500);
    }
  };

  // POST /fwd-accumulation/pa/create
  createPaAccumulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId?.toString() || 'system';
      const id = await this.service.createPaAccumulation(req.body, userId);
      ResponseUtil.success(res, { pa_acc_id: id }, 'PA accumulation record created');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to create PA accumulation record', 500);
    }
  };

  // PUT /fwd-accumulation/client/:id
  updateClientAccumulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params['id']);
      const userId = (req as any).user?.userId?.toString() || 'system';
      await this.service.updateClientAccumulation(id, req.body, userId);
      ResponseUtil.success(res, null, 'Client accumulation record updated');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to update client accumulation record', 500);
    }
  };

  // PUT /fwd-accumulation/disability/:id
  updateDisabilityAccumulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params['id']);
      const userId = (req as any).user?.userId?.toString() || 'system';
      await this.service.updateDisabilityAccumulation(id, req.body, userId);
      ResponseUtil.success(res, null, 'Disability accumulation record updated');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to update disability accumulation record', 500);
    }
  };

  // PUT /fwd-accumulation/onetime/:id
  updateOnetimeAccumulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params['id']);
      const userId = (req as any).user?.userId?.toString() || 'system';
      await this.service.updateOnetimeAccumulation(id, req.body, userId);
      ResponseUtil.success(res, null, 'Onetime accumulation record updated');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to update onetime accumulation record', 500);
    }
  };

  // PUT /fwd-accumulation/pa/:id
  updatePaAccumulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params['id']);
      const userId = (req as any).user?.userId?.toString() || 'system';
      await this.service.updatePaAccumulation(id, req.body, userId);
      ResponseUtil.success(res, null, 'PA accumulation record updated');
    } catch (error) {
      ResponseUtil.error(res, 'Failed to update PA accumulation record', 500);
    }
  };
}
