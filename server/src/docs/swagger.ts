import { Router } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import openapiDocument from './openapi.json';

export const swaggerRouter = Router();

// CSP מותאם ל-/api-docs בלבד, כדי ש-Swagger UI יוכל להריץ את הסקריפט והסגנון המוטמעים שלו.
// שאר האפליקציה נשארת עם ברירת המחדל המחמירה של helmet.
swaggerRouter.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  }),
);
swaggerRouter.get('/openapi.json', (_req, res) => {
  res.json(openapiDocument);
});
swaggerRouter.use('/', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  customSiteTitle: 'Encrypted Records API',
  swaggerOptions: { persistAuthorization: true },
}));
