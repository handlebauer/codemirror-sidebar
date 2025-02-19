export const demoFiles = [
    {
        name: 'main.ts',
        content: `// Main application file
console.log('Hello from the main file!')
        
// Add some example code
function greet(name: string) {
    return \`Hello, \${name}!\`
}

const message = greet('World')
console.log(message)`,
    },
    {
        name: 'src/config.ts',
        content: `// Configuration file
export const config = {
    appName: 'Demo App',
    version: '1.0.0',
    description: 'A simple demo application',
    features: [
        'File Explorer',
        'AI Assistant',
        'Code Editing'
    ]
}`,
    },
]
