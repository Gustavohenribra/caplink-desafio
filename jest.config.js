/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
      "^.+\\.tsx?$": "ts-jest",
    },
  };
  
  export default jestConfig;
  