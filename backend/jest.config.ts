import type { Config } from "jest";
import { createDefaultEsmPreset } from "ts-jest";

const presetConfig = createDefaultEsmPreset();

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleNameMapper: {
    "^#src/(.*)\\.js$": "<rootDir>/src/$1",
    "^#prisma/(.*)\\.js$": "<rootDir>/prisma/generated/$1",
    "^(\\./.+)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          allowImportingTsExtensions: true,
          rewriteRelativeImportExtensions: true,
          moduleResolution: "node16",
        },
      },
    ],
  },
  ...presetConfig,
};

export default config;
