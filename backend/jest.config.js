// jest.config.js
export default {
  testEnvironment: "node",
  transform: {}, // disable babel since you're using pure ESM
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
