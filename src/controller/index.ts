import express from 'express';
import schoolController from './school.controller';
import searchController from './search.controller';

const router = express.Router();

router.use('/schools', schoolController);
router.use('/search', searchController);

export default router;