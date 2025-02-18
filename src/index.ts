// Export core types needed by extensions
export type { SidebarOptions } from './sidebar'

// Re-export the main extensions
export { explorer } from './explorer'
export { assistant } from './assistant'

// Export effects that might be needed for external control
export { toggleSidebarEffect } from './sidebar'
export { updateFilesEffect } from './explorer'
