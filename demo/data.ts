import { type File } from '../src/explorer/index'

// Extract project name from Gist URL
const GIST_URL =
    'https://gist.github.com/handlebauer/c924b6ae9cbfa2bed7a81bb8ad2b8041'
const HASH_LENGTH = 7
export const PROJECT_NAME =
    '#' + (GIST_URL.split('/').pop()?.slice(0, HASH_LENGTH) || 'unknown') // Use shortened gist hash as project name

// GitHub Gist API types
interface GistFile {
    filename: string
    type: string
    language: string
    raw_url: string
    size: number
    truncated: boolean
    content: string
}

interface GistResponse {
    files: { [key: string]: GistFile }
}

// Function to fetch gist content
async function fetchGistContent(): Promise<File[]> {
    const files: File[] = []
    const gistId = GIST_URL.split('/').pop()

    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`)
        const data = (await response.json()) as GistResponse

        // Convert gist files to our File format
        for (const [filename, fileData] of Object.entries(data.files)) {
            files.push({
                name: filename,
                content: fileData.content,
            })
        }
    } catch (error) {
        console.error('Error fetching gist content:', error)
        // Provide fallback content in case of fetch failure
        files.push({
            name: 'README.md',
            content:
                '# Bun Basic Template\n\nFailed to load gist content. Please check your internet connection.',
        })
    }

    return files
}

// Export the files for the demo
export const demoFiles = await fetchGistContent()

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
        name: 'index.ts',
        content: 'console.log("Hello from Bun!")',
    },
]
