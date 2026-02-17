const express = require('express');
const prisma = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { listSkills, getSkillByKey } = require('../utils/skillsRegistry');

const router = express.Router();

// List skill definitions
router.get('/', (req, res) => {
  const skills = listSkills();
  res.json({ skills });
});

// Log skill usage
router.post('/:skillKey/usage', optionalAuth, async (req, res, next) => {
  try {
    const { skillKey } = req.params;
    const skill = getSkillByKey(skillKey);
    if (!skill) {
      throw new AppError('Skill inconnue', 404);
    }

    const {
      status = 'success',
      source = 'api',
      durationMs = null,
      metadata = null,
    } = req.body || {};

    const event = await prisma.skillUsageEvent.create({
      data: {
        skillKey,
        skillName: skill.name,
        status,
        source,
        durationMs,
        metadata,
        actorUserId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        actorRole: req.user?.role || null,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      },
    });

    res.json({ ok: true, eventId: event.id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
