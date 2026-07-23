As EMP\_Agent, I have analyzed the request to implement configurable column selection for data exports. This feature is critical for user experience when dealing with heterogeneous datasets like bug reports. The core challenge lies in managing persistent state (column names) while ensuring the output structure remains consistent and predictable during the export process.

My solution focuses on three main areas: State Management, Export Logic Abstraction, and Robust Unit Testing.

---

## ⚙️ Solution Implementation

We will implement a dedicated service, `exportColumnManager`, to handle persistence and filtering logic, separating it from both the UI and the core data retrieval mechanism.

### 1. Utility & Type Definitions (`src/types.ts`)

First, we define necessary types for clarity and type safety across modules.

```typescript
// src/types.ts

/** Defines a single column structure used internally. */
export interface ColumnDefinition {
    name: string;      // Unique name (e.g., 'title', 'body')
    accessor: keyof any[]; // The path or getter for the data field
}

/** The complete, ordered list of all available columns. */
export const COLUMNS: ColumnDefinition[] = [
    { name: 'id', accessor: ['id'] },
    { name: 'title', accessor: ['title'] },
    { name: 'state', accessor: ['state'] },
    { name: 'labels', accessor: ['labels'] },
    // ... up to 14 columns total
    { name: 'body', accessor: ['description'] } // Example for the problematic column
];

/** Structure for stored user preferences. */
export interface ColumnPreferences {
    selectedColumns: Set<string>; // Stores the names of enabled columns
}

// Global storage key
export const PREF_KEY = 'exportedColumnSelections';
```

### 2. Core State Manager (`src/columnManager.ts`)

This service handles reading, writing, and retrieving column preferences from `chrome.storage`. It also provides the derived list of visible columns for export.

```typescript
// src/columnManager.ts
import { COLUMNS, PREF_KEY, ColumnPreferences } from './types';
import { Storage } from 'browser-api'; // Mocking browser storage access

/**
 * Handles persistence and logic for determining which columns should be exported.
 */
export class ExportColumnManager {
    private storage: Storage;

    constructor(storageInstance: Storage) {
        this.storage = storageInstance;
    }

    /**
     * Retrieves the user's saved preferences or defaults to all enabled columns.
     * @returns A Map of column names and their boolean selection status (Set).
     */
    async loadPreferences(): Promise<Set<string>> {
        try {
            const storedData = await this.storage.get(PREF_KEY);
            const savedNames: string[] | undefined = storedData[PREF_KEY]?.selectedColumns;

            if (!savedNames || savedNames.length === 0) {
                console.warn("No column preferences found. Defaulting to all enabled columns.");
                // Default: Select all currently defined columns
                return new Set(COLUMNS.map(c => c.name));
            }

            return new Set(savedNames);

        } catch (e) {
            console.error("Error loading column preferences, defaulting to all:", e);
            return new Set(COLUMNS.map(c => c.name)); // Fallback on error
        }
    }

    /**
     * Persists the given set of selected column names to local storage.
     * @param enabledNames The set of column names that should be visible in the export.
     */
    async savePreferences(enabledNames: Set<string>): Promise<void> {
        // Convert Set to array for JSON serialization
        const data = { selectedColumns: Array.from(enabledNames) };
        await this.storage.set({ [PREF_KEY]: data });
    }

    /**
     * Generates the final, filtered list of column definitions ready for export processing.
     * Maintains fixed order based on COLUMNS array definition.
     * @param enabledNames The set of currently selected column names.
     * @returns An array of ColumnDefinition objects in the original guaranteed order.
     */
    getEnabledColumns(enabledNames: Set<string>): ColumnDefinition[] {
        // 1. Filter based on selection status
        const visibleColumns = COLUMNS.filter((_, index) => enabledNames.has(COLUMNS[index].name));

        // 2. Handle the edge case of zero selected columns gracefully (fall back to default/error state)
        if (visibleColumns.length === 0) {
            console.warn("Zero columns selected. Reverting selection to default.");
            const fallbackSet = new Set(COLUMNS.map(c => c.name));
            return COLUMNS; // Export everything if user selects nothing
        }

        // Returns the fixed list, maintaining original definition order.
        return visibleColumns;
    }
}
```

### 3. UI Interaction Handlers (`src/uiService.ts`) (Conceptual)

This module abstracts the interaction with the UI component built on the options page.

```typescript
// src/uiService.ts
import { ColumnDefinition, COLUMNS } from './types';
import { ExportColumnManager } from './columnManager';
import { Storage } from 'browser-api';

/**
 * Handles rendering and event listening for column selection checkboxes.
 */
export class UIService {
    private manager: ExportColumnManager;

    constructor(storageInstance: Storage) {
        this.manager = new ExportColumnManager(storageInstance);
    }

    /**
     * Initializes the UI component state by loading persisted preferences.
     * @returns The initial set of enabled column names.
     */
    async initializeUI(): Promise<Set<string>> {
        const enabledNames = await this.manager.loadPreferences();
        // Logic to render checkboxes: Iterate COLUMNS, setting checked state based on enabledNames
        console.log(`Initialized UI with ${enabledNames.size} selected columns.`);
        return enabledNames;
    }

    /**
     * Event handler triggered when a user changes a checkbox state in the options page.
     * @param columnName The name of the column (e.g., 'title').
     * @param isChecked Boolean indicating selection status.
     */
    async handleColumnSelectionChange(columnName: string, isChecked: boolean): Promise<void> {
        let currentSet = await this.manager.loadPreferences();
        const newSet = new Set(currentSet);

        if (isChecked) {
            newSet.add(columnName);
        } else {
            newSet.delete(columnName);
        }

        await this.manager.savePreferences(newSet);
        console.log(`Column ${columnName} set to ${isChecked}. Preferences saved.`);
    }

    /**
     * Public method called by the export function itself (e.g., button click).
     */
    async getExportableColumns(): Promise<ColumnDefinition[]> {
        const enabledNames = await this.manager.loadPreferences();
        return this.manager.getEnabledColumns(enabledNames);
    }
}

// --- Usage Example in Export Function ---
/*
async function performDataExport(data: any[]) {
    const uiService = new UIService(chrome.storage);
    // Get the filtered list of columns to use for headers and data selection
    const exportColumns = await uiService.getExportableColumns();

    if (exportColumns.length === 0) {
        throw new Error("Cannot export: No columns selected.");
    }

    // 1. Build Headers
    const headerRow = exportColumns.map(col => col.name);

    // 2. Process Data Row by Row, selecting only the relevant accessor data
    const formattedData = data.map(row => {
        return exportColumns.map(colDef => {
            // Accessor logic (e.g., fetching row[colDef.accessor['id']] or row.description)
            return extractValue(row, colDef);
        });
    });

    // Export headerRow and formattedData...
}
*/
```

---

## 🧪 Unit Testing Suite (`src/columnManager.test.ts`)

The core logic resides in `ExportColumnManager`. The tests must cover persistence initialization (defaults), successful updates, fixed ordering preservation, and the critical zero-selection edge case. We will use Jest syntax and mock browser storage.

```typescript
// src/columnManager.test.ts

import { ExportColumnManager } from './columnManager';
import { COLUMNS, PREF_KEY, ColumnDefinition } from './types';

// Mock global browser storage API for testing isolation
const mockStorage = {
    get: jest.fn(),
    set: jest.fn(),
};
jest.mock('browser-api', () => ({ Storage: class MockStorage { get = mockStorage.get; set = mockStorage.set; } }));

describe('ExportColumnManager', () => {
    let manager: ExportColumnManager;

    // Helper function to simulate successful storage reads/writes
    const setupMocks = (data: Record<string, any>) => {
        (mockStorage.get as jest.Mock).mockResolvedValue(data);
        (mockStorage.set as jest.Mock).mockResolvedValue({});
    };

    beforeEach(() => {
        jest.clearAllMocks();
        manager = new ExportColumnManager(mockStorage as any);
    });

    describe('loadPreferences', () => {
        test('Should default to all columns if no preferences are stored', async () => {
            setupMocks({}); // Empty storage response
            const enabledSet = await manager.loadPreferences();
            expect(enabledSet).toBeInstanceOf(Set);
            // Should match the size of the globally defined COLUMNS array
            expect(enabledSet.size).toBe(COLUMNS.length); 

        });

        test('Should load and return correctly stored preferences', async () => {
            const savedNames = ['title', 'state'];
            const mockStorageData: Record<string, any> = {
                [PREF_KEY]: { selectedColumns: savedNames },
            };
            setupMocks(mockStorageData);

            const enabledSet = await manager.loadPreferences();
            expect(enabledSet).toBeInstanceOf(Set);
            expect(enabledSet.has('title')).toBe(true);
            expect(enabledSet.has('state')).toBe(true);
            // Ensure other columns (like 'body') are correctly excluded
            expect(enabledSet.has('body')).toBe(false); 
        });

        test('Should handle storage read errors by defaulting to all columns', async () => {
            // Simulate a failure reading from storage
            (mockStorage.get as jest.Mock).mockRejectedValue(new Error('Storage Access Denied'));
            const enabledSet = await manager.loadPreferences();

            expect(enabledSet).toBeInstanceOf(Set);
            expect(enabledSet.size).toBe(COLUMNS.length); // Fallback to all
        });
    });

    describe('savePreferences', () => {
        test('Should persist a custom set of selected columns correctly', async () => {
            const names = new Set(['id', 'title']);
            await manager.savePreferences(names);

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            const callArgs: any[] = mockStorage.set.mock.calls[0][0];
            
            // Check that the stored data structure is correct (array of names)
            expect(callArgs[PREF_KEY]).toEqual({ 
                selectedColumns: ['id', 'title'] // Order may vary but content must match
            });
        });

        test('Should save all columns when no selection change occurs', async () => {
            const names = new Set(COLUMNS.map(c => c.name));
            await manager.savePreferences(names);

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
        });
    });


    describe('getEnabledColumns (Filtering Logic)', () => {
        
        test('Scenario 1: Should correctly filter visible columns while preserving global order', () => {
            // Set selection state to include only 'title' and 'body'
            const enabledNames = new Set(['title', 'body']);

            // NOTE: The fixed defined order in COLUMNS is usually [id, title, state, labels, body] 
            // For testing simplicity, assume the structure where 'state' comes after 'title'.
            const result = (manager as any).getEnabledColumns(enabledNames);
            
            expect(result.length).toBe(2); // Only two columns selected
            
            // Crucial check: The order must match the fixed global COLUMNS array order, 
            // regardless of the set iteration order.
            const expectedOrder = ['title', 'body']; 
            expect(result.map(c => c.name)).toEqual(expectedOrder);
        });

        test('Scenario 2: Edge case - Should gracefully fall back to exporting all columns if zero are selected', () => {
            // Simulate user unchecking every single column
            const enabledNames = new Set<string>(); // Empty set

            const result = (manager as any).getEnabledColumns(enabledNames);

            expect(result.length).toBe(COLUMNS.length); 
            // Verify that the entire COLUMNS list is returned (fallback)
            const fallbackNames = result.map(c => c.name);
            for (let i = 0; i < COLUMNS.length; i++) {
                expect(fallbackNames[i]).toBe(COLUMNS[i].name);
            }
        });

        test('Scenario 3: Full selection should return all defined columns in order', () => {
            const enabledNames = new Set(COLUMNS.map(c => c.name)); // All columns selected
            const result = (manager as any).getEnabledColumns(enabledNames);

            expect(result.length).toBe(COLUMNS.length); 
            // Ensure order is strictly maintained
            const actualOrder = result.map(c => c.name);
            for (let i = 0; i < COLUMNS.length; i++) {
                expect(actualOrder[i]).toBe(COLUMNS[i].name);
            }
        });
    });
});