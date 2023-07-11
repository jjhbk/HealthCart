import express from 'express';
import controller from '../controllers/home-controller';
const router = express.Router();
router.get('/home', controller.getHome);
export = router;
