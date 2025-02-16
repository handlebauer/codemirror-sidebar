interface File {
    name: string
    content: string
}

export const demoFiles: File[] = [
    {
        name: 'src/index.js',
        content: `import { sum } from './utils';

console.log('Total:', sum(5, 3));`,
    },
    {
        name: 'src/utils.js',
        content: `export function sum(a, b) {
    return a + b;
}

export function multiply(a, b) {
    return a * b;
}`,
    },
    {
        name: 'tests/utils.test.js',
        content: `import { sum, multiply } from '../src/utils';

test('sum works correctly', () => {
    expect(sum(2, 2)).toBe(4);
});

test('multiply works correctly', () => {
    expect(multiply(3, 4)).toBe(12);
});`,
    },
    {
        name: 'README.md',
        content: `# Simple Math Library

A demonstration project showing basic math operations.

## Usage
\`\`\`js
import { sum } from './src/utils';
console.log(sum(5, 3)); // outputs: 8
\`\`\``,
    },
    {
        name: 'package.json',
        content: `{
    "name": "simple-math-lib",
    "version": "1.0.0",
    "main": "src/index.js",
    "scripts": {
        "test": "jest"
    }
}`,
    },
]
