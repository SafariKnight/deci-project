import type {Config} from 'jest';
import { createDefaultEsmPreset } from "ts-jest"

const presetConfig = createDefaultEsmPreset({})

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  ...presetConfig
};

export default config;
