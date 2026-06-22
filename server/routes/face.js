const express = require('express');
const router = express.Router();
const {
  registerFace, getFaceData, getAllFaceData, getClassFaceData, deleteFaceData
} = require('../controllers/faceController');
const { protect, authorize } = require('../middleware/auth');
const { uploadPhotos } = require('../middleware/upload');

router.use(protect);

router.post('/register/:studentId', authorize('admin', 'faculty'), uploadPhotos, registerFace);
router.get('/all', authorize('admin', 'faculty'), getAllFaceData);
router.get('/class', authorize('admin', 'faculty'), getClassFaceData);
router.get('/:studentId', authorize('admin', 'faculty'), getFaceData);
router.delete('/:studentId', authorize('admin'), deleteFaceData);

module.exports = router;
