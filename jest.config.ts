import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'], // Adjust if your test files have a different naming convention
    testTimeout: 50000
};

export default config;
