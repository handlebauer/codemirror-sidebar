import { type File } from '../../src/explorer'
import { db } from './utils/db'

// GitHub repository information
const REPO_OWNER = 'handlebauer'
const REPO_NAME = 'bun-basic-tmpl'
const REPO_BRANCH = 'main'
export const PROJECT_NAME = REPO_NAME

// GitHub API types
interface TreeItem {
    path: string
    type: string
    url: string
    sha: string
}

interface TreeResponse {
    tree: TreeItem[]
}

// Function to fetch file content from GitHub
async function fetchFileContent(
    owner: string,
    repo: string,
    path: string,
): Promise<string> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${REPO_BRANCH}`,
        )
        const data = await response.json()
        // GitHub API returns content as base64
        return atob(data.content)
    } catch (error) {
        console.error(`Error fetching file content for ${path}:`, error)
        return ''
    }
}

// Function to fetch repository content
async function fetchRepoContent(): Promise<File[]> {
    // First try to get from database
    const cached = await db.getRepository(REPO_OWNER, REPO_NAME, REPO_BRANCH)
    if (cached) {
        console.log('Using cached repository data')
        return cached.files
    }

    const files: File[] = []

    try {
        // First, get the repository tree
        const treeResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`,
        )
        const treeData = (await treeResponse.json()) as TreeResponse

        // Filter for files (not directories) and fetch their content
        const fileItems = treeData.tree.filter(item => item.type === 'blob')

        // Fetch content for each file
        for (const file of fileItems) {
            const content = await fetchFileContent(
                REPO_OWNER,
                REPO_NAME,
                file.path,
            )
            files.push({
                name: file.path,
                content,
            })
        }

        // Save to database
        await db.saveRepository(REPO_OWNER, REPO_NAME, REPO_BRANCH, files)
    } catch (error) {
        console.error('Error fetching repository content:', error)
        return fallbackFiles
    }

    return files
}

// Export the files for the demo
export const demoFiles = await fetchRepoContent()

// Fallback content in case the fetch fails during development
export const fallbackFiles: File[] = [
    {
        name: 'README.md',
        content: `# ${REPO_NAME}

A basic template for Bun projects.

## Features

- TypeScript
- ESLint
- Prettier
- Husky
- Lint-staged`,
    },
    {
        name: 'package.json',
        content: `{
    "name": "${REPO_NAME}",
    "module": "index.ts",
    "type": "module",
    "scripts": {
        "prepare": "husky install"
    },
    "devDependencies": {
        "bun-types": "latest",
        "husky": "^8.0.0"
    },
    "peerDependencies": {
        "typescript": "^5.0.0"
    }
}`,
    },
    {
        name: 'tsconfig.json',
        content: `{
    "compilerOptions": {
        "lib": ["ESNext"],
        "module": "esnext",
        "target": "esnext",
        "moduleResolution": "bundler",
        "moduleDetection": "force",
        "allowImportingTsExtensions": true,
        "noEmit": true,
        "composite": true,
        "strict": true,
        "downlevelIteration": true,
        "skipLibCheck": true,
        "jsx": "preserve",
        "allowSyntheticDefaultImports": true,
        "forceConsistentCasingInFileNames": true,
        "allowJs": true,
        "types": [
            "bun-types"
        ]
    }
}`,
    },
    {
        name: 'src/index.ts',
        content: `console.log("Hello via Bun!");`,
    },
]
