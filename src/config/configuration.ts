export default () => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET,
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },
  upload: {
    provider: process.env.UPLOAD_PROVIDER ?? 'local',
    localBaseUrl: process.env.UPLOAD_LOCAL_BASE_URL ?? 'http://localhost:3000/uploads',
  },
  r2: {
    accessKey: process.env.R2_ACCESS_KEY,
    secretKey: process.env.R2_SECRET_KEY,
    bucket: process.env.R2_BUCKET,
    endpoint: process.env.R2_ENDPOINT,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
  media: {
    maxImageBytes: Number(process.env.MEDIA_MAX_IMAGE_BYTES ?? 8 * 1024 * 1024),
    maxVideoBytes: Number(process.env.MEDIA_MAX_VIDEO_BYTES ?? 150 * 1024 * 1024),
  },
});
