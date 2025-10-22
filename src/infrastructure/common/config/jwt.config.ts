export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'supersecretkeyforjwt',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};
