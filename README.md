# CodeMirror Sidebar Extensions

A powerful set of sidebar extensions for CodeMirror 6 that adds file explorer and AI assistance capabilities to your editor. This package includes three main components:

1. **Sidebar Framework**: A flexible and customizable sidebar system that can be docked to either side of the editor
2. **File Explorer**: A full-featured file explorer panel for navigating and managing your project files
3. **AI Assistant**: An intelligent coding assistant panel with support for multiple AI models

## Features

### Sidebar Framework

- Flexible docking system (left or right side)
- Resizable panels with drag handles
- Overlay or inline modes
- Customizable width and background color
- Keyboard shortcuts for toggling visibility

### File Explorer

- Tree-based file navigation
- File and directory management
- Syntax highlighting based on file type
- Automatic language detection
- Selected file highlighting
- Expandable/collapsible directories

### AI Assistant

- Multiple AI model support
- Code-aware conversations
- Code block parsing and syntax highlighting
- Settings management for API keys
- Tab-based interface
- Real-time message status updates

## Installation

```bash
npm install @repoview/codemirror-extensions
yarn add @repoview/codemirror-extensions
pnpm add @repoview/codemirror-extensions
bun add @repoview/codemirror-extensions
```

## Usage

### Basic Setup

```typescript
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import {
    sidebarExtension,
    createAISidebar,
} from '@repoview/codemirror-extensions'

// Create editor with both sidebars
const state = EditorState.create({
    doc: 'Your initial content here',
    extensions: [
        // ... other extensions ...

        // Add file explorer sidebar (left)
        ...sidebarExtension({
            sidebarOptions: {
                id: 'file-explorer',
                dock: 'left',
                overlay: false,
                width: '250px',
                backgroundColor: '#2c313a',
                initiallyOpen: false,
            },
            toggleKeymaps: {
                mac: 'Cmd-b',
                win: 'Ctrl-b',
            },
        }),

        // Add AI assistant sidebar (right)
        ...createAISidebar({
            width: '400px',
            backgroundColor: '#2c313a',
            initiallyOpen: true,
            toggleKeymaps: {
                mac: 'Cmd-r',
                win: 'Ctrl-r',
            },
        }),
    ],
})

const view = new EditorView({
    state,
    parent: document.querySelector('#editor'),
})
```

### React Integration

For React applications, we provide a convenient `useEditor` hook that simplifies the integration:

```typescript
import { useEditor } from '@repoview/codemirror-extensions'

function Editor() {
    const { ref, view } = useEditor({
        initialContent: 'Your initial content here',
        // Configure file explorer
        explorer: {
            initiallyOpen: true,
            width: '250px',
            initialFiles: [
                {
                    name: 'example.ts',
                    content: 'console.log("Hello World")',
                },
            ],
        },
        // Configure AI assistant
        assistant: {
            initiallyOpen: false,
            width: '400px',
        },
        // Add any additional CodeMirror extensions
        extensions: [],
    })

    return <div ref={ref} style={{ height: '100vh' }} />
}
```

### File Explorer Configuration

```typescript
import { updateFilesEffect } from '@repoview/codemirror-extensions'

// Update files in the explorer
view.dispatch({
    effects: [
        updateFilesEffect.of([
            {
                name: 'example.ts',
                content: 'console.log("Hello World")',
            },
            // ... more files
        ]),
    ],
})
```

### AI Assistant Configuration

```typescript
import { setApiKeyEffect } from '@repoview/codemirror-extensions'

// Configure AI assistant
view.dispatch({
    effects: [setApiKeyEffect.of('your-api-key')],
})
```

## API Reference

### Sidebar Options

```typescript
interface SidebarOptions {
    id: string
    dock: 'left' | 'right'
    width?: string
    backgroundColor?: string
    overlay?: boolean
    initiallyOpen?: boolean
}
```

### File Explorer Types

```typescript
interface File {
    name: string
    content: string
}
```

### AI Assistant Types

```typescript
interface AISidebarOptions {
    width?: string
    backgroundColor?: string
    initiallyOpen?: boolean
    toggleKeymaps?: {
        mac?: string
        win?: string
    }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
