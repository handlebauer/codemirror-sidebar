import Dexie, { type Table } from 'dexie'
import type { File } from '../../../src/explorer'

// Define interfaces for our database schema
interface RepoInfo {
    id?: number
    owner: string
    name: string
    branch: string
    lastUpdated: Date
}

interface StoredFile extends File {
    id?: number
    repoId: number
    lastUpdated: Date
}

// Create a Dexie database class
class GithubRepoDatabase extends Dexie {
    repos!: Table<RepoInfo>
    files!: Table<StoredFile>

    constructor() {
        super('GithubRepoDatabase')

        // Define database schema with compound index for repos
        this.version(1).stores({
            repos: '++id, [owner+name+branch], owner, name, branch',
            files: '++id, repoId, name, content',
        })
    }

    // Helper methods
    async saveRepository(
        owner: string,
        name: string,
        branch: string,
        files: File[],
    ) {
        // Start a transaction
        return await this.transaction(
            'rw',
            this.repos,
            this.files,
            async () => {
                // Save or update repo info
                const repoId = await this.repos.add({
                    owner,
                    name,
                    branch,
                    lastUpdated: new Date(),
                })

                // Delete existing files for this repo
                await this.files.where('repoId').equals(repoId).delete()

                // Add new files
                const storedFiles = files.map(file => ({
                    ...file,
                    repoId,
                    lastUpdated: new Date(),
                }))
                await this.files.bulkAdd(storedFiles)

                return repoId
            },
        )
    }

    async getRepository(owner: string, name: string, branch: string) {
        const repo = await this.repos
            .where('[owner+name+branch]')
            .equals([owner, name, branch])
            .first()

        if (!repo) return null

        const files = await this.files
            .where('repoId')
            .equals(repo.id!)
            .toArray()

        return {
            repo,
            files: files.map(({ repoId, lastUpdated, ...file }) => file),
        }
    }
}

// Create and export database instance
export const db = new GithubRepoDatabase()
