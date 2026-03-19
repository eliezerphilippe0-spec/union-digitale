/**
 * File Upload Routes
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = req.query.type || 'general';
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Type de fichier non autorisé', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
  },
});

// Upload single image
router.post('/image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Aucun fichier téléchargé', 400);
    }

    const type = req.query.type || 'general';
    const url = `/uploads/${type}/${req.file.filename}`;

    res.json({
      message: 'Image téléchargée',
      url,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
});

// Upload multiple images
router.post('/images', authenticate, upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('Aucun fichier téléchargé', 400);
    }

    const type = req.query.type || 'general';
    const urls = req.files.map(file => `/uploads/${type}/${file.filename}`);

    res.json({
      message: 'Images téléchargées',
      urls,
      count: req.files.length,
    });
  } catch (error) {
    next(error);
  }
});

// Delete image
router.delete('/:type/:filename', authenticate, async (req, res, next) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(uploadDir, type, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Fichier supprimé' });
    } else {
      throw new AppError('Fichier non trouvé', 404);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
