require('dotenv').config();

const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const ROLES = require('../constants/roles');
const logger = require('../utils/logger');

async function seed() {
  await connectDatabase();

  const email = process.env.ADMIN_EMAIL || 'admin@findthem.org';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  let admin = await User.findOne({ email }).select('+passwordHash');
  if (!admin) {
    admin = new User({
      fullName: 'FindThem Admin',
      email,
      role: ROLES.ADMIN,
      verifiedStatus: true
    });
    await admin.setPassword(password);
    await admin.save();
    logger.info(`Admin created: ${email}`);
  } else {
    logger.info(`Admin already exists: ${email}`);
  }

  process.exit(0);
}

seed().catch((error) => {
  logger.error(error);
  process.exit(1);
});

