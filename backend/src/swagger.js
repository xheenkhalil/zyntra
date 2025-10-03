import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Zyntra API",
      version: "1.0.0",
      description: "API documentation for Zyntra backend",
    },
    servers: [{ url: "http://localhost:5000/api" }],
  },
  apis: ["./src/routes/*.js"], // scan route files for docs
};

const swaggerSpec = swaggerJsdoc(options);

export function swaggerDocs(app) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
