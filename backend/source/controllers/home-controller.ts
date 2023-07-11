import {Request, Response} from 'express';
import * as service from '../services/home-service';

const getHome = async (req: Request, res: Response) => {
  return res.send(service.goHome());
};
export default {getHome};
