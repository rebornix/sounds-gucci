# Bug Analysis: Issue #249442

## Understanding the Bug
The issue reports that the Test Coverage view does not remember the chosen sort order. The repro is consistent: open coverage, change the sort, run tests without coverage so the coverage view disappears, then run with coverage again. The view comes back sorted by its original default instead of the previously selected option.

There are no issue comments, so the analysis depends on the parent-commit code and nearby history.

## Git History Analysis
I started with the required 24-hour history window before the parent commit and expanded to 3 days and then 7 days. There were no commits in that window touching the coverage view code, which makes this look more like a missing persistence path than a same-week regression.

The nearest earlier commits touching the coverage view were:

- `9880502f0ee` - `propagate list/tree indent level to renderers (#249443)`
- `8c197d877ea` - `Add collapse all functionality to test coverage view (#258906)`
- `05d55b367a6` - `debt - fix some leaks found by copilot (#293693)`

None of those suggest a stored sort preference. In the parent snapshot itself, the relevant code paths line up with the reported reset:

- `src/vs/workbench/contrib/testing/browser/testing.contribution.ts` registers the Test Coverage view with `when: TestingContextKeys.isTestCoverageOpen`, so the pane only exists while coverage is open.
- `src/vs/workbench/contrib/testing/common/testCoverageService.ts` binds `isTestCoverageOpen` to whether `selected` coverage exists; when a run completes without coverage, the service closes coverage and the view disappears.
- `src/vs/workbench/contrib/testing/browser/testCoverageView.ts` initializes `sortOrder` as `observableValue('sortOrder', CoverageSortOrder.Location)` and the quick-pick action only calls `view.sortOrder.set(...)`; there is no storage read or write anywhere in this path.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause
The selected sort order for the Test Coverage view is stored only in memory on the `TestCoverageView` instance. Because that view is conditionally created only while `testing.isTestCoverageOpen` is true, closing coverage disposes the pane. When coverage is opened again, a new `TestCoverageView` is constructed and `sortOrder` is reinitialized to `CoverageSortOrder.Location`.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/testing/browser/testCoverageView.ts`

**Changes Required:**
Persist the selected coverage sort order in workspace storage and restore it when the view is created.

Concretely:

- Inject `IStorageService` into `TestCoverageView`.
- Initialize `sortOrder` from a new workspace-scoped key such as `testing.coverageViewSorting` instead of always defaulting to `CoverageSortOrder.Location`.
- Add a small setter on the view that updates both the observable and storage.
- Change the quick-pick accept handler to call that setter rather than mutating `sortOrder` directly.

This matches the existing pattern already used by `TestingExplorerView`, which persists `testing.viewSorting` and `testing.viewMode` in workspace storage.

**Code Sketch:**
```ts
import { ISettableObservable, observableValue } from '../../../../base/common/observable.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';

export class TestCoverageView extends ViewPane {
	private static readonly sortOrderStorageKey = 'testing.coverageViewSorting';
	private readonly tree = this._register(new MutableDisposable<TestCoverageTree>());
	public readonly sortOrder: ISettableObservable<CoverageSortOrder>;

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IStorageService private readonly storageService: IStorageService,
		@ITestCoverageService private readonly coverageService: ITestCoverageService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);

		this.sortOrder = observableValue(
			'sortOrder',
			this.storageService.get(
				TestCoverageView.sortOrderStorageKey,
				StorageScope.WORKSPACE,
				CoverageSortOrder.Location,
			) as CoverageSortOrder,
		);
	}

	public setSortOrder(sortOrder: CoverageSortOrder): void {
		if (sortOrder === this.sortOrder.get()) {
			return;
		}

		this.sortOrder.set(sortOrder, undefined);
		this.storageService.store(
			TestCoverageView.sortOrderStorageKey,
			sortOrder,
			StorageScope.WORKSPACE,
			StorageTarget.MACHINE,
		);
	}
}
```

And in the quick-pick action:

```ts
if (picked !== undefined) {
	view.setSortOrder(picked);
	quickInput.dispose();
}
```

**Validation:**
- Open coverage, change the sort, close coverage by running tests without coverage, then reopen coverage and verify the chosen sort is restored.
- Reload the window and verify the same workspace still restores the last selected coverage sort.

### Option B: Comprehensive Fix (Optional)
Move coverage-view UI preferences into a small persisted view-state object so future state, such as collapse state or coverage-specific filters, also survives view recreation. That is a cleaner long-term direction if more coverage-view preferences are planned, but it is more change than this bug needs.

## Confidence Level: High

## Reasoning
The reset behavior follows directly from the parent snapshot: the coverage view is gated by `testing.isTestCoverageOpen`, the service clears that state on non-coverage runs, and the view reconstructs with a hard-coded default sort order because no storage is consulted. Persisting the selected enum in workspace storage fixes the exact symptom with a minimal change and follows the storage pattern already used by the neighboring Test Explorer view.