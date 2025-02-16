import { type File } from '../src/explorer'

// Extract project name from GitHub URL
const GITHUB_URL =
    'https://raw.githubusercontent.com/handlebauer/bun-basic-tmpl/main'
export const PROJECT_NAME = GITHUB_URL.split('/')[4] // Extract repo name from URL

// Function to fetch repository content
async function fetchRepoContent(): Promise<File[]> {
    const files: File[] = []
    const baseUrl =
        'https://raw.githubusercontent.com/handlebauer/bun-basic-tmpl/main'

    // Define the files we want to fetch
    const filePaths = [
        '.gitignore',
        'README.md',
        'bun.lockb',
        'package.json',
        'src/index.ts',
        'tsconfig.json',
    ]

    try {
        const responses = await Promise.all(
            filePaths.map(path =>
                fetch(`${baseUrl}/${path}`)
                    .then(res => res.text())
                    .then(content => ({
                        name: path,
                        content,
                    })),
            ),
        )

        files.push(...responses)
    } catch (error) {
        console.error('Error fetching repository content:', error)
        // Provide fallback content in case of fetch failure
        files.push({
            name: 'README.md',
            content:
                '# Bun Basic Template\n\nFailed to load repository content. Please check your internet connection.',
        })
    }

    return files
}

// Export the files for the demo
export const demoFiles = await fetchRepoContent()

// Fallback content in case the fetch fails during development
export const fallbackFiles: File[] = [
    {
        name: 'README.md',
        content: '# Bun Basic Template\n\nA minimal template for Bun projects.',
    },
    {
        name: 'package.json',
        content: JSON.stringify(
            {
                name: 'bun-basic-tmpl',
                version: '0.0.0',
                type: 'module',
                dependencies: {},
                devDependencies: {
                    'bun-types': 'latest',
                    typescript: 'latest',
                },
            },
            null,
            2,
        ),
    },
    {
        name: 'src/index.ts',
        content: 'console.log("Hello from Bun!")',
    },
]
