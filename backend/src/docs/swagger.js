const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'FindThem API',
      version: '1.0.0',
      description: 'REST API for an AI-powered missing persons tracking platform.'
    },
    servers: [
      { url: '/api/v1', description: 'Current API server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Cases' },
      { name: 'Reports' },
      { name: 'AI' },
      { name: 'Admin' }
    ]
  },
  apis: ['./src/routes/*.js']
});

module.exports = { swaggerUi, swaggerSpec };

