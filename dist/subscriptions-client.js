const waycraftSubscriptionsFactory = (require) => {
var module = { exports: {} }; var exports = module.exports;
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/legacy-names.ts
/** Old localStorage keys (read fallback only; never written, never deleted). */
const LEGACY_USAGE_BADGE_KEY = "majed.subscriptions.usageBadgeMode";
/** Old slot/section/panel ids mapped to their new ids (saved nav state). */
const LEGACY_PANEL_IDS = {
	"majed-skills": "waycraft-skills",
	"majed-subscriptions": "waycraft-subscriptions"
};
/** Old toolview slot key for a tool name. */
const legacyToolviewKey = (name) => `dsh_majed_${name}`;

//#endregion
//#region src/skills-browser.ts
function applySkills(root) {
	const fail = (error) => console.error("dsh-waycraft: Skill manager setup failed", error);
	try {
		Promise.resolve(root.inject(["slots", "locale"], (ctx) => {
			try {
				setupSkills(ctx, fail);
			} catch (error) {
				fail(error);
			}
		})).catch(fail);
	} catch (error) {
		fail(error);
	}
}
function setupSkills(ctx, fail) {
	{
		const effect = (run, label) => {
			const result = ctx.effect(run, label);
			Promise.resolve(result).catch(fail);
			return result;
		};
		const React = require("react");
		const h = React.createElement;
		const dictionaries = {
			en: {
				trash: "Trash",
				moveTrash: "Move to Trash",
				restoreTrash: "Restore original",
				deleteTrash: "Delete permanently",
				confirmTrash: "Confirm permanent deletion",
				trashWarning: "This permanently deletes the recoverable files. This cannot be undone.",
				trashOrigin: "Original location",
				trashEmpty: "Trash is empty",
				"code.trash-conflict": "The original location already contains a skill",
				"code.trash-readonly": "This source is read-only",
				"code.trash-unavailable": "Trash storage is unavailable; the skill catalog is still available",
				"code.trash-linked": "Linked or special write targets are not allowed",
				"code.trash-failed": "The operation failed; check the original and Trash before retrying",
				"code.trash-cancelled": "The operation was cancelled",
				"code.trash-limit": "The skill exceeds safe processing limits",
				"code.trash-overflow": "Trash has too many entries to list safely; organization data is kept",
				"code.trash-skipped": "Some Trash records are unreadable; organization data is kept",
				"code.trash-invalid": "The original location is no longer valid",
				"code.trash-missing": "This Trash entry no longer exists",
				"code.trash-confirm": "Confirm permanent deletion first",
				"code.trash-cleanup": "Operation completed; remaining files need cleanup",
				"code.trash-recovery": "Original removal failed; the complete Trash copy was retained for recovery",
				"code.trash-state": "Files deleted, but annotation cleanup failed; reload state before retrying",
				repositories: "Repositories",
				scopeDiscover: "Discover Skills",
				tabGit: "Git Repos",
				catSourceLabel: "Discover sources",
				catSourceClawhub: "ClawHub",
				catSourceSkillsh: "skills.sh",
				catSearchClawhub: "Search ClawHub",
				catSearchSkillsh: "Search skills.sh",
				catSearch: "Search",
				catPopularNote: "ClawHub download ranking · Up to 100; sort only displayed items",
				catSkillshHint: "skills.sh offers search only; enter a query to find skills.",
				catLoading: "Loading…",
				catLoadingMore: "Loading more…",
				catLoadMore: "Load 10 more",
				catEmpty: "No skills to show",
				catSearchEmpty: "No skills match this search",
				catLoadError: "Failed to load the catalog. Check your connection and retry.",
				catRetry: "Retry",
				catDownloads: "downloads",
				catInstalls: "installs",
				catStars: "stars",
				catSort: "Sort displayed items",
				catSortDownloads: "Downloads (ranking)",
				catSortInstalls: "Installs (high to low)",
				catSortName: "Name (A–Z)",
				catStatusFilter: "Catalog status",
				catStatusAll: "All statuses",
				catStatusAvailable: "Not installed",
				catStatusInstalled: "Installed",
				catInstalled: "Installed",
				catDetails: "Catalog details",
				catInstall: "Install from catalog",
				catInstallElsewhere: "Install elsewhere",
				catUninstall: "Uninstall catalog copy",
				catForget: "Forget catalog record",
				catReassociate: "Adopt identical existing copy",
				catCopy: "Copy SKILL.md",
				catCopied: "Copied",
				catCopyFailed: "Copy failed",
				catClose: "Close",
				catOrigin: "Origin",
				catDetailLoading: "Loading details…",
				catInstallTitle: "Install from catalog",
				catInstallConfirm: "Confirm install",
				destPath: "Destination folder",
				destInvalid: "Choose an available destination to install",
				destNoProjects: "No registered projects: only your DSH and Shared Agents folders are available.",
				destProjectNote: "Written inside the project and may be committed to its repository.",
				catInstallDone: "Installed from catalog",
				catCopies: "Installed copies",
				catUninstallTitle: "Uninstall catalog copy",
				catUninstallBody: "This moves \"{name}\" from {where} to Trash. You can restore it from Trash.",
				catForgetTitle: "Forget catalog record",
				catForgetBody: "This removes the catalog record for \"{name}\" only. No files are changed or deleted.",
				catSharedWarning: "This copy is in the shared agents folder. Other tools that read this folder will stop seeing it.",
				catConfirmUninstall: "Move to Trash",
				catConfirmForget: "Forget record",
				"catHint.trashed": "A copy is in Trash. Restore it from Trash, or install into a different destination.",
				"catHint.missing": "Its Trash entry no longer exists. Forget the record, then install again.",
				"catHint.invalid-root": "The copy location is unavailable. Forget the record, then install again.",
				"catStatus.installed": "Installed",
				"catStatus.modified": "Modified locally",
				"catStatus.missing": "Missing from disk",
				"catStatus.trashed": "In Trash",
				"catStatus.invalid-root": "Location unavailable",
				"code.catalog-query": "The search or paging request is not valid",
				"code.catalog-upstream": "The catalog could not be reached",
				"code.catalog-response": "The catalog returned an unusable response",
				"code.catalog-identity": "This catalog skill identity is not valid",
				"code.catalog-package": "The catalog package is not a valid skill",
				"code.catalog-confirm": "Confirm the installation first",
				"code.catalog-action": "This catalog action is not supported",
				"code.catalog-failed": "The catalog operation failed",
				repoAddTitle: "Subscribe to a repository",
				repoUrl: "Repository (owner/name, https URL or absolute folder)",
				repoRef: "Branch or tag (optional)",
				repoSubdirectory: "Subdirectory (optional)",
				repoAdd: "Subscribe",
				repoRefresh: "Refresh",
				repoRefreshAll: "Refresh all",
				repoFootnote: "Refresh checks repositories and skill updates without replacing local files. Historical backups are not cleaned automatically and use additional disk space.",
				repoRefreshing: "Refreshing…",
				repoUnsubscribe: "Unsubscribe (keeps installed skills)",
				repoFilter: "Filter repository skills",
				repoStatusFilter: "Filter by status",
				repoRepoFilter: "Filter by repository",
				repoAllStatuses: "All statuses",
				repoAllRepositories: "All repositories",
				repoConfirmUnsubscribe: "Unsubscribe from this repository? Installed skills and their provenance stay; the saved snapshot is removed.",
				repoConfirmUnsubscribeYes: "Unsubscribe",
				repoForget: "Forget record (deletes nothing)",
				repoConfirmForget: "Forget this installation record? Only the tracking record is removed; no files are read, moved or deleted.",
				repoConfirmForgetYes: "Forget record",
				"repoStatus.update": "Update available",
				repoUpdatePreview: "Preview update",
				repoRollbackPreview: "Preview rollback to previous version",
				repoApplyUpdate: "Apply update",
				repoApplyRollback: "Apply rollback",
				repoPreviewTitle: "Changes to the installed copy",
				repoNoChanges: "No file changes",
				repoLocalModified: "This copy was edited locally. Applying replaces those edits; the current copy is kept as the previous version.",
				repoOverwrite: "Replace local edits",
				repoApplying: "Applying…",
				repoUpdated: "Updated {name}. The previous version is kept for rollback.",
				repoRolledBack: "Rolled back {name} to the previous version.",
				repoTrackedHint: "Only file contents and the executable bit are tracked; empty folders and other file attributes are not.",
				repoUpstream: "Upstream",
				"repoChange.added": "Added",
				"repoChange.removed": "Removed",
				"repoChange.modified": "Modified",
				"code.repo-preview-stale": "The copy or the repository changed after this preview; preview again",
				"code.repo-local-modified": "The copy has local edits; confirm replacing them first",
				"code.repo-local-unsafe": "The installed copy contains links, special files or exceeds safe limits",
				"code.repo-up-to-date": "This copy already matches the repository",
				"code.repo-no-backup": "There is no previous version to roll back to",
				"code.repo-backup-changed": "The saved previous version changed; rollback refused",
				"code.repo-skill-renamed": "The skill was renamed upstream; the installed copy is unchanged",
				"code.repo-recovery": "Automatic recovery failed; the original files are kept at {recovery}. Do not repeat the operation",
				"code.repo-invalid-root": "The destination changed since install; the copy is not touched. Forget the record instead.",
				"code.repo-root-valid": "The destination is unchanged; use Uninstall to Trash",
				repoConflictIn: "Name already used in",
				repoEmpty: "No repository subscriptions",
				repoNoSkills: "No skills found in this snapshot",
				repoInstall: "Install",
				repoUninstall: "Uninstall to Trash",
				repoDestination: "Install into",
				dragTip: "Drag to move this skill to another category",
				dragMoved: "Moved to another category:",
				repoTracked: "Tracked installations",
				repoSnapshot: "Snapshot",
				repoLastError: "Last refresh failed; showing the previous snapshot",
				repoBulk: "Refreshed {done} of {total}; {failed} failed",
				repoFromSource: "Source",
				repoInstalledAt: "Installed in",
				repoNoInstalls: "No tracked installations",
				"repoKind.git-commit": "Git commit",
				"repoKind.archive-sha256": "Archive fingerprint (not a Git commit)",
				"repoKind.folder-sha256": "Folder content fingerprint",
				"repoStatus.available": "Available",
				"repoStatus.installed": "Installed",
				"repoStatus.modified": "Modified locally",
				"repoStatus.missing": "Missing",
				"repoStatus.conflict": "Name conflict",
				"repoStatus.invalid": "Invalid",
				"repoStatus.trashed": "In Trash",
				"repoStatus.invalid-root": "Destination changed",
				"code.repo-url": "Repository address is not supported (use owner/name, an https/http URL without credentials, or an absolute folder)",
				"code.repo-ref": "Branch or tag name is not valid",
				"code.repo-subdirectory": "Subdirectory is not valid or does not exist",
				"code.repo-host": "Local, private and link-local network hosts are not allowed",
				"code.repo-local": "The local folder is missing or is not a usable folder",
				"code.repo-git": "Git could not read this repository",
				"code.repo-git-missing": "Git is not installed or not on PATH",
				"code.repo-network": "The repository could not be reached (redirects are not followed)",
				"code.repo-notfound": "Repository, branch or tag was not found",
				"code.repo-auth": "Authentication is required; credentials are not supported",
				"code.repo-timeout": "The repository operation timed out",
				"code.repo-limit": "The repository exceeds safe size, file-count or depth limits",
				"code.repo-archive": "The repository archive is invalid or unsafe",
				"code.repo-cancelled": "The operation was cancelled",
				"code.repo-duplicate": "This repository is already subscribed",
				"code.repo-busy": "This repository is already being refreshed",
				"code.repo-not-found": "This subscription no longer exists",
				"code.repo-stale": "The repository changed; refresh the preview and try again",
				"code.repo-conflict": "A skill with this name already exists; nothing was overwritten",
				"code.repo-skill-missing": "This skill is not in the current snapshot",
				"code.repo-skill-invalid": "This skill is invalid and cannot be installed",
				"code.repo-skill-limit": "This skill exceeds safe size limits",
				"code.repo-skill-metadata": "This skill has invalid metadata",
				"code.repo-snapshot-changed": "The stored snapshot no longer matches; refresh the repository",
				"code.repo-not-installed": "This tracked installation no longer exists",
				"code.repo-trashed": "This installation is already in Trash",
				"code.repo-missing": "The installed copy is missing from disk",
				"code.repo-state-invalid": "Repository state is unreadable and was left untouched",
				"code.repo-state-write": "Repository state could not be saved",
				"code.repo-install-failed": "The skill could not be installed",
				"code.repo-failed": "The repository operation failed",
				importSkills: "Import skills",
				importPath: "Local absolute path",
				previewImport: "Preview local import",
				importNow: "Import now",
				uploadFiles: "ZIP or Markdown files",
				uploadFolder: "Skill folder",
				importConflict: "Existing skills",
				skipImport: "Skip existing",
				overwriteImport: "Overwrite existing (replace all bundled files)",
				importResult: "Import results",
				pendingImport: "Ready",
				conflictsImport: "Conflicts",
				importedImport: "Imported",
				skippedImport: "Skipped",
				failedImport: "Failed",
				warningsImport: "Cleanup warnings",
				inputsImport: "Archives processed",
				"code.import-cleanup": "Imported successfully; backup cleanup failed. Check the remaining backup path; its contents may be incomplete",
				importHint: "Copies original files. Select skip or overwrite explicitly. Local preview never writes.",
				create: "Create skill",
				skillName: "Skill name",
				skillDescription: "Routing description",
				skillBody: "Markdown instructions",
				destination: "Creation destination",
				created: "Skill created",
				"code.create-invalid": "Enter a valid name, description and instructions",
				"code.create-conflict": "A skill with this name already exists",
				"code.create-readonly": "This source is read-only",
				"code.create-linked-root": "Linked writable folders are not allowed",
				"code.create-too-large": "Skill content exceeds the size limit",
				"code.create-failed": "Unable to create the skill",
				"code.import-path": "Unsafe import path",
				"code.import-limit": "Import exceeds file, byte, depth or entry limits",
				"code.import-linked": "Linked or special files are not allowed",
				"code.import-empty": "No skill documents found",
				"code.import-metadata": "Skill metadata is invalid",
				"code.import-name": "Skill name is invalid",
				"code.import-duplicate": "Duplicate import paths or names",
				"code.import-encoding": "Invalid upload encoding",
				"code.import-archive": "Invalid or incomplete ZIP archive",
				"code.import-cancelled": "Import cancelled; unpublished changes discarded",
				"code.import-overlap": "Import source overlaps the destination",
				"code.import-conflict": "Choose skip or overwrite explicitly",
				"code.import-failed": "Unable to import this skill",
				"code.import-recovery": "Restoration failed; original backup retained in the destination for recovery",
				title: "Skill manager",
				search: "Search skills",
				all: "All sources",
				any: "All statuses",
				enabled: "Enabled",
				disabled: "Disabled",
				invalid: "Invalid",
				shadowed: "Shadowed",
				retry: "Retry",
				loading: "Loading skills…",
				error: "Unable to load skills",
				details: "Details",
				close: "Close",
				empty: "No matching skills",
				source: "Source",
				toggle: "Toggle",
				diagnostics: "Diagnostics",
				blocked: "Blocked by author",
				copyText: "Copy text",
				copyCopy: "Toggle copy",
				toggleSource: "Toggle source",
				modelInvocation: "Model invocation",
				userInvocation: "User invocation",
				allowed: "Allowed",
				denied: "Denied",
				shadowedBy: "Shadowed by",
				reloadState: "Reload state",
				refresh: "Refresh",
				refreshAria: "Refresh skills",
				actionsAria: "Skill actions",
				refreshing: "Refreshing…",
				statsAria: "Skill statistics",
				statSkill: "skill",
				statSkills: "skills",
				statEnabled: "enabled",
				statDisabled: "disabled",
				statDiagnostic: "diagnostic",
				statDiagnostics: "diagnostics",
				stateLocked: "Skill state is invalid; changes are locked",
				"diag.discovery-truncated": "Discovery stopped at the safe limit",
				sourceProblems: "to review",
				linkedReadOnly: "Linked (read-only)",
				diagWarnings: "warnings",
				diagWarning: "warning",
				diagNotes: "notes",
				diagNote: "note",
				showMoreCount: "Show {count} more",
				diagGeneral: "General",
				showLess: "Show less",
				diagProblems: "problems need attention",
				diagProblem: "problem needs attention",
				diagEntriesCount: "{count} entries could not be read",
				diagEntriesOne: "1 entry could not be read",
				"diagReason.permission": "Reason: permission denied",
				"diagReason.not-directory": "Reason: expected a folder but found a file",
				"diagReason.broken-link": "Reason: a link points to something that no longer exists",
				"diagReason.unknown": "Reason: the folder could not be read",
				"diagNext.unreadable-entries": "Check the folder permissions. These entries are skipped; your other skills are unaffected.",
				"diagNext.source-unavailable": "Check that the folder exists and is readable, or change the folder.",
				"diagNext.unreadable-skill": "Check the file permissions or replace the file.",
				"diagNext.oversized-skill": "Shorten SKILL.md; very large files are skipped.",
				"diagNext.empty-skill": "Add the skill name and description.",
				"diagNext.linked-outside-root": "This is allowed and read-only; nothing needs to be done.",
				diagDetails: "Affected paths",
				diagMore: "+{count} more",
				sourceOn: "On",
				sourceOff: "Off",
				"diag.source-unavailable": "Source unavailable",
				"diag.unreadable-entries": "Some entries could not be read",
				"diag.unreadable-skill": "Skill could not be read",
				"diag.oversized-skill": "Skill exceeds the size limit",
				"diag.empty-skill": "Skill file is empty",
				"diag.invalid-frontmatter": "Invalid frontmatter",
				"diag.invalid-yaml": "Invalid YAML",
				"diag.invalid-metadata": "Invalid metadata",
				"diag.invalid-policy": "Invalid invocation policy",
				"diag.linked-outside-root": "Skill document is linked from outside its source",
				"diag.state-invalid": "Invalid skill state; managed skills are disabled",
				"diag.project-unavailable": "Project unavailable",
				"diag.project-missing": "Project folder is missing",
				"diag.project-unreadable": "Project folder is not readable",
				"diag.project-source-outside": "Project skill folder resolves outside the project",
				"diag.project-source-overlap": "Project skill folder overlaps another source",
				scope: "View",
				scopeGlobal: "Global skills",
				scopeProject: "Project skills",
				project: "Project",
				projectNone: "Select a registered project",
				projectEmpty: "No registered projects yet",
				projectHint: "Project skills are read from the project and switched only for that project",
				readOnlySource: "Project DSH skills have no source switch",
				"code.project-missing": "folder missing",
				"code.project-unreadable": "not readable",
				"code.project-unavailable": "unavailable",
				"code.project-unregistered": "Project is not registered",
				"code.project-mismatch": "The selected project does not match this item",
				"code.project-dsh-source": "Project DSH skills have no source switch",
				"code.root-not-absolute": "Enter an absolute folder path",
				"code.root-too-long": "The folder path is too long",
				"code.root-not-found": "The folder does not exist",
				"code.root-not-directory": "The path is not a folder",
				"code.root-reserved": "This folder is reserved by the Skill manager",
				"code.root-overlap": "This folder overlaps another skill source",
				"code.custom-limit": "The limit of {limit} custom sources is reached",
				"code.custom-label": "The name or group is invalid or too long",
				"code.custom-unknown": "This custom source no longer exists",
				"code.scan-aborted": "The folder preview was cancelled",
				"code.forbidden": "The request was rejected; reload the page and retry",
				"code.unsupported": "The request format is not supported",
				"code.stopping": "The Skill manager is stopping; try again shortly",
				"code.state-invalid": "Skill state is invalid; reload the state before changing sources",
				"diag.registry-unavailable": "The workspace registry is unavailable; project policy may not apply",
				addSourceNamed: "Add source",
				editNamed: "Edit",
				removeNamed: "Remove source",
				confirmNamed: "Confirm removal",
				folders: "Source folders",
				foldersHint: "Preview a folder first; nothing is registered until you add it. Removing a source never deletes files",
				folderPath: "Folder path",
				scanFolder: "Preview folder",
				addFolder: "Add folder",
				addSource: "Add source",
				candidates: "Candidate sources",
				noCandidates: "No skill folders found within two levels",
				candidateRegistered: "Registered",
				candidateConflict: "Overlaps another source",
				skillCount: "skills",
				customBadge: "Custom folder",
				browse: "Browse…",
				customTag: "custom",
				addCategoryHere: "New category in this source",
				folderTitleFor: "Change the skills folder for",
				folderHelp: "DSH reads this source from the folder below. Pick another folder if you keep these skills elsewhere.",
				folderDefault: "Default folder",
				categoryHint: "Group skills in",
				categoryTaken: "A category with this name already exists.",
				editFolder: "Edit folder",
				more: "More actions",
				newCategory: "New category",
				addSkillsHere: "Add selected skills",
				enabledCount: "enabled",
				editNote: "Edit note",
				noteAndDescription: "Note replaces the description in this list",
				browseAria: "Browse for a folder",
				changeFolder: "Change folder",
				saveFolder: "Save folder",
				resetFolder: "Reset to default",
				folderRedirected: "Folder changed from the default",
				"code.root-unsupported": "This source folder cannot be changed",
				"code.project-scope-unsupported": "Provider folders can only be changed in Global skills",
				"diag.root-override-ignored": "A saved folder override was ignored because it is no longer allowed",
				edit: "Edit",
				save: "Save",
				cancel: "Cancel",
				label: "Name",
				group: "Group",
				remove: "Remove source",
				removeNote: "This removes only the source entry. Skill files are not deleted",
				confirmRemove: "Confirm removal",
				added: "Source added",
				registered: "This folder is already a source",
				categories: "Categories",
				categoryName: "Category name",
				addCategory: "Add category",
				uncategorized: "Uncategorized",
				renameCategory: "Rename category",
				deleteCategory: "Delete category",
				confirmDeleteCategory: "Confirm delete category",
				deleteCategoryNote: "Skills in this category become uncategorized. No skill files are changed",
				selectSkill: "Select skill",
				assignTo: "Assign selected to",
				filterCategory: "Category",
				allCategories: "All categories",
				note: "Note",
				saveNote: "Save note",
				noteHint: "Notes are searchable and never change the skill description",
				noteLimit: "Up to 500 characters",
				confirmNote: "Confirm",
				importDropTitle: "Drop a skill here",
				importDropHint: "Supports .zip, a skill folder, or one SKILL.md",
				importChooseFolder: "Choose folder",
				importChooseFile: "Choose file",
				importChosen: "{count} item(s) selected",
				importClear: "Clear",
				importDropUnsupported: "Only .zip files, folders and SKILL.md files can be imported; other items were ignored.",
				importDropFailed: "The dropped items could not be read.",
				skillSource: "Skill source",
				skillSourcePick: "Choose a source…",
				hideForm: "Hide form",
				destLocation: "Location",
				catHelp: "Categories stay in this source and do not move files.",
				catEmptyHere: "No skills yet. Use More on a skill to place it here.",
				addSkillsTo: "Add skills to category",
				addSkillsNone: "No other skills to add.",
				addSkillsCount: "Add skills",
				toggleCategory: "Toggle category",
				createHere: "Add skill",
				createHereBlocked: "Skills cannot be added here: this folder is read-only for Waycraft",
				createBlockedTool: "Read-only for Waycraft: this folder belongs to another tool. Add skills to DSH or Agents instead.",
				createBlockedCustom: "Read-only for Waycraft: custom sources are only read. Add skills to DSH or Agents instead.",
				destScope: "Scope",
				destScopeUser: "User directory",
				destScopeProject: "Project",
				noteSavedHint: "Saved in the plugin display layer without modifying SKILL.md. Clear to revert to original description.",
				copied: "Copied",
				pathChip: "Writes to",
				createFootnote: "Created skills are not linked to repository updates, and no source file is modified.",
				importReqTitle: "File requirements",
				importReq1: "Archives and folders must contain SKILL.md.",
				importReq2: "SKILL.md must include a YAML name and description.",
				importReq3: "Import copies all content and never modifies the source.",
				customSources: "Custom sources",
				"code.invalid-request": "The request was not valid",
				"code.source-unknown": "This source is not available in this view",
				"code.organization-limit": "Too many categories, notes or assignments for this source",
				"code.state-too-large": "The saved organization data is too large; remove some notes or categories",
				placement: "Entry placement",
				placementHint: "Choose where the Skill manager appears: Settings, the sidebar or both",
				placementBoth: "Both",
				placementSidebar: "Sidebar only",
				placementSettings: "Settings only",
				"code.category-name": "Enter a category name of up to 24 characters",
				"code.category-duplicate": "A category with this name already exists",
				"code.category-unknown": "This category no longer exists",
				"code.category-limit": "The limit of {limit} categories is reached",
				"code.skill-unknown": "This skill is not available in this view",
				"code.note-too-long": "The note is longer than {limit} characters",
				"code.placement-invalid": "The entry placement is invalid"
			},
			ar: {
				trash: "سلة المحذوفات",
				moveTrash: "نقل إلى سلة المحذوفات",
				restoreTrash: "استعادة إلى المصدر",
				deleteTrash: "حذف نهائي",
				confirmTrash: "تأكيد الحذف النهائي",
				trashWarning: "سيتم حذف الملفات القابلة للاستعادة نهائياً. لا يمكن التراجع.",
				trashOrigin: "الموقع الأصلي",
				trashEmpty: "سلة المحذوفات فارغة",
				"code.trash-conflict": "يوجد بالفعل مهارة في الموقع الأصلي",
				"code.trash-readonly": "هذا المصدر للقراءة فقط",
				"code.trash-unavailable": "تخزين سلة المحذوفات غير متاح؛ ما زال كتالوج المهارات متاحًا",
				"code.trash-linked": "لا يُسمح بالكتابة إلى روابط أو ملفات خاصة",
				"code.trash-failed": "فشلت العملية؛ افحص المصدر والسلة قبل المحاولة مجدداً",
				"code.trash-cancelled": "أُلغيت العملية",
				"code.trash-limit": "تتجاوز المهارة حدود المعالجة الآمنة",
				"code.trash-overflow": "عدد عناصر سلة المحذوفات أكبر من أن يُعرض بأمان؛ بيانات التنظيم محفوظة",
				"code.trash-skipped": "بعض سجلات سلة المحذوفات غير قابلة للقراءة؛ بيانات التنظيم محفوظة",
				"code.trash-invalid": "لم يعد الموقع الأصلي صالحاً",
				"code.trash-missing": "لم يعد هذا العنصر في سلة المحذوفات",
				"code.trash-confirm": "أكد الحذف النهائي أولاً",
				"code.trash-cleanup": "اكتملت العملية؛ تحتاج الملفات المتبقية إلى تنظيف",
				"code.trash-recovery": "فشل حذف المصدر؛ حُفظت نسخة كاملة في السلة للاستعادة",
				"code.trash-state": "حُذفت الملفات لكن فشل تنظيف التعليقات؛ أعد تحميل الحالة",
				repositories: "المستودعات",
				scopeDiscover: "اكتشاف المهارات",
				tabGit: "مستودعات Git",
				catSourceLabel: "مصادر الاكتشاف",
				catSourceClawhub: "ClawHub",
				catSourceSkillsh: "skills.sh",
				catSearchClawhub: "ابحث في ClawHub",
				catSearchSkillsh: "ابحث في skills.sh",
				catSearch: "بحث",
				catPopularNote: "ترتيب ClawHub حسب التنزيلات · حتى 100؛ الفرز للعناصر المعروضة فقط",
				catSkillshHint: "يوفّر skills.sh البحث فقط؛ أدخل عبارة بحث للعثور على المهارات.",
				catLoading: "جارٍ التحميل…",
				catLoadingMore: "جارٍ تحميل المزيد…",
				catLoadMore: "تحميل 10 أخرى",
				catEmpty: "لا توجد مهارات للعرض",
				catSearchEmpty: "لا توجد مهارات مطابقة لهذا البحث",
				catLoadError: "تعذر تحميل الفهرس. تحقق من الاتصال وأعد المحاولة.",
				catRetry: "إعادة المحاولة",
				catDownloads: "تنزيل",
				catInstalls: "تثبيت",
				catStars: "نجمة",
				catSort: "فرز العناصر المعروضة",
				catSortDownloads: "التنزيلات (الترتيب)",
				catSortInstalls: "التثبيتات (من الأعلى)",
				catSortName: "الاسم (أ–ي)",
				catStatusFilter: "حالة الفهرس",
				catStatusAll: "كل الحالات",
				catStatusAvailable: "غير مثبتة",
				catStatusInstalled: "مثبتة",
				catInstalled: "مثبتة",
				catDetails: "تفاصيل الفهرس",
				catInstall: "تثبيت من الفهرس",
				catInstallElsewhere: "تثبيت في موضع آخر",
				catUninstall: "إزالة نسخة الفهرس",
				catForget: "نسيان سجل الفهرس",
				catReassociate: "تبنّي النسخة المطابقة الموجودة",
				catCopy: "نسخ SKILL.md",
				catCopied: "تم النسخ",
				catCopyFailed: "فشل النسخ",
				catClose: "إغلاق",
				catOrigin: "المصدر",
				catDetailLoading: "جارٍ تحميل التفاصيل…",
				catInstallTitle: "تثبيت من الفهرس",
				catInstallConfirm: "تأكيد التثبيت",
				destPath: "مجلد الوجهة",
				destInvalid: "اختر وجهة متاحة للتثبيت",
				destNoProjects: "لا توجد مشاريع مسجلة: المتاح فقط مجلدا DSH والوكلاء المشتركين.",
				destProjectNote: "يُكتب داخل المشروع وقد يُرفع إلى مستودعه.",
				catInstallDone: "تم التثبيت من الفهرس",
				catCopies: "النسخ المثبتة",
				catUninstallTitle: "إزالة نسخة الفهرس",
				catUninstallBody: "سيُنقل \"{name}\" من {where} إلى السلة. يمكنك استعادته من السلة.",
				catForgetTitle: "نسيان سجل الفهرس",
				catForgetBody: "سيُزال سجل الفهرس الخاص بـ \"{name}\" فقط. لن تتغير أي ملفات ولن تُحذف.",
				catSharedWarning: "هذه النسخة في مجلد الوكلاء المشترك. ستتوقف الأدوات الأخرى التي تقرأ هذا المجلد عن رؤيتها.",
				catConfirmUninstall: "نقل إلى السلة",
				catConfirmForget: "نسيان السجل",
				"catHint.trashed": "توجد نسخة في السلة. استعدها من السلة أو ثبّت في وجهة مختلفة.",
				"catHint.missing": "لم يعد عنصرها في السلة. انسَ السجل ثم ثبّت مرة أخرى.",
				"catHint.invalid-root": "موضع النسخة غير متاح. انسَ السجل ثم ثبّت مرة أخرى.",
				"catStatus.installed": "مثبتة",
				"catStatus.modified": "معدّلة محلياً",
				"catStatus.missing": "مفقودة من القرص",
				"catStatus.trashed": "في السلة",
				"catStatus.invalid-root": "الموقع غير متاح",
				"code.catalog-query": "طلب البحث أو التصفح غير صالح",
				"code.catalog-upstream": "تعذر الوصول إلى الفهرس",
				"code.catalog-response": "أعاد الفهرس استجابة غير صالحة للاستخدام",
				"code.catalog-identity": "هوية مهارة الفهرس غير صالحة",
				"code.catalog-package": "حزمة الفهرس ليست مهارة صالحة",
				"code.catalog-confirm": "أكّد التثبيت أولاً",
				"code.catalog-action": "إجراء الفهرس هذا غير مدعوم",
				"code.catalog-failed": "فشلت عملية الفهرس",
				repoAddTitle: "الاشتراك في مستودع",
				repoUrl: "المستودع (owner/name أو رابط https أو مجلد مطلق)",
				repoRef: "الفرع أو الوسم (اختياري)",
				repoSubdirectory: "المجلد الفرعي (اختياري)",
				repoAdd: "اشتراك",
				repoRefresh: "تحديث",
				repoRefreshAll: "تحديث الكل",
				repoFootnote: "يتحقق التحديث من المستودعات وتحديثات المهارات دون استبدال الملفات المحلية. لا تُنظَّف النسخ الاحتياطية السابقة تلقائيًا وتستهلك مساحة قرص إضافية.",
				repoRefreshing: "جارٍ التحديث…",
				repoUnsubscribe: "إلغاء الاشتراك (تبقى المهارات المثبتة)",
				repoFilter: "تصفية مهارات المستودع",
				repoStatusFilter: "تصفية حسب الحالة",
				repoRepoFilter: "تصفية حسب المستودع",
				repoAllStatuses: "كل الحالات",
				repoAllRepositories: "كل المستودعات",
				repoConfirmUnsubscribe: "إلغاء الاشتراك في هذا المستودع؟ تبقى المهارات المثبتة وسجل مصدرها، وتُحذف اللقطة المحفوظة.",
				repoConfirmUnsubscribeYes: "إلغاء الاشتراك",
				repoForget: "نسيان السجل (لا يحذف شيئاً)",
				repoConfirmForget: "نسيان سجل هذا التثبيت؟ يُزال سجل التتبع فقط؛ لا تُقرأ ملفات ولا تُنقل ولا تُحذف.",
				repoConfirmForgetYes: "نسيان السجل",
				"repoStatus.update": "تحديث متاح",
				repoUpdatePreview: "معاينة التحديث",
				repoRollbackPreview: "معاينة الرجوع إلى النسخة السابقة",
				repoApplyUpdate: "تطبيق التحديث",
				repoApplyRollback: "تطبيق الرجوع",
				repoPreviewTitle: "التغييرات على النسخة المثبتة",
				repoNoChanges: "لا تغييرات في الملفات",
				repoLocalModified: "عُدّلت هذه النسخة محلياً. سيستبدل التطبيق تلك التعديلات وتُحفظ النسخة الحالية كنسخة سابقة.",
				repoOverwrite: "استبدال التعديلات المحلية",
				repoApplying: "جارٍ التطبيق…",
				repoUpdated: "تم تحديث {name}. تُحفظ النسخة السابقة للرجوع إليها.",
				repoRolledBack: "تم الرجوع بـ {name} إلى النسخة السابقة.",
				repoTrackedHint: "يُتتبَّع محتوى الملفات وإذن التنفيذ فقط؛ لا تُتتبَّع المجلدات الفارغة ولا سمات الملفات الأخرى.",
				repoUpstream: "المصدر",
				"repoChange.added": "مضاف",
				"repoChange.removed": "محذوف",
				"repoChange.modified": "معدّل",
				"code.repo-preview-stale": "تغيرت النسخة أو المستودع بعد هذه المعاينة؛ أعد المعاينة",
				"code.repo-local-modified": "للنسخة تعديلات محلية؛ أكّد استبدالها أولاً",
				"code.repo-local-unsafe": "تحتوي النسخة المثبتة على روابط أو ملفات خاصة أو تتجاوز الحدود الآمنة",
				"code.repo-up-to-date": "هذه النسخة مطابقة للمستودع بالفعل",
				"code.repo-no-backup": "لا توجد نسخة سابقة للرجوع إليها",
				"code.repo-backup-changed": "تغيرت النسخة السابقة المحفوظة؛ رُفض الرجوع",
				"code.repo-skill-renamed": "أُعيدت تسمية المهارة في المصدر؛ لم تتغير النسخة المثبتة",
				"code.repo-recovery": "فشل الاسترداد التلقائي؛ الملفات الأصلية محفوظة في {recovery}. لا تكرر العملية",
				"code.repo-invalid-root": "تغيّرت الوجهة منذ التثبيت؛ لا يُمس النسخ. انسَ السجل بدلاً من ذلك.",
				"code.repo-root-valid": "الوجهة لم تتغير؛ استخدم النقل إلى سلة المحذوفات",
				repoConflictIn: "الاسم مستخدم في",
				repoEmpty: "لا توجد اشتراكات مستودعات",
				repoNoSkills: "لا توجد مهارات في هذه اللقطة",
				repoInstall: "تثبيت",
				repoUninstall: "إزالة إلى السلة",
				repoDestination: "التثبيت في",
				dragTip: "اسحب لنقل هذه المهارة إلى تصنيف آخر",
				dragMoved: "تم النقل إلى تصنيف آخر:",
				repoTracked: "التثبيتات المتتبعة",
				repoSnapshot: "اللقطة",
				repoLastError: "فشل آخر تحديث؛ تُعرض اللقطة السابقة",
				repoBulk: "حُدّث {done} من {total}؛ فشل {failed}",
				repoFromSource: "المصدر",
				repoInstalledAt: "مثبّت في",
				repoNoInstalls: "لا توجد تثبيتات متتبعة",
				"repoKind.git-commit": "إيداع Git",
				"repoKind.archive-sha256": "بصمة الأرشيف (ليست إيداع Git)",
				"repoKind.folder-sha256": "بصمة محتوى المجلد",
				"repoStatus.available": "متاحة",
				"repoStatus.installed": "مثبتة",
				"repoStatus.modified": "معدلة محلياً",
				"repoStatus.missing": "مفقودة",
				"repoStatus.conflict": "تعارض اسم",
				"repoStatus.invalid": "غير صالحة",
				"repoStatus.trashed": "في السلة",
				"repoStatus.invalid-root": "تغيّرت الوجهة",
				"code.repo-url": "عنوان المستودع غير مدعوم (استخدم owner/name أو رابط https/http بلا بيانات اعتماد أو مجلداً مطلقاً)",
				"code.repo-ref": "اسم الفرع أو الوسم غير صالح",
				"code.repo-subdirectory": "المجلد الفرعي غير صالح أو غير موجود",
				"code.repo-host": "المضيفات المحلية والخاصة غير مسموحة",
				"code.repo-local": "المجلد المحلي مفقود أو غير صالح",
				"code.repo-git": "تعذرت قراءة المستودع عبر Git",
				"code.repo-git-missing": "Git غير مثبت أو غير موجود في PATH",
				"code.repo-network": "تعذر الوصول إلى المستودع (لا تُتبع إعادة التوجيه)",
				"code.repo-notfound": "لم يُعثر على المستودع أو الفرع أو الوسم",
				"code.repo-auth": "المصادقة مطلوبة؛ بيانات الاعتماد غير مدعومة",
				"code.repo-timeout": "انتهت مهلة عملية المستودع",
				"code.repo-limit": "يتجاوز المستودع حدود الحجم أو عدد الملفات أو العمق الآمنة",
				"code.repo-archive": "أرشيف المستودع غير صالح أو غير آمن",
				"code.repo-cancelled": "أُلغيت العملية",
				"code.repo-duplicate": "هذا المستودع مشترك فيه بالفعل",
				"code.repo-busy": "يجري تحديث هذا المستودع بالفعل",
				"code.repo-not-found": "لم يعد هذا الاشتراك موجوداً",
				"code.repo-stale": "تغير المستودع؛ حدّث المعاينة وأعد المحاولة",
				"code.repo-conflict": "توجد مهارة بهذا الاسم؛ لم يُستبدل شيء",
				"code.repo-skill-missing": "هذه المهارة ليست في اللقطة الحالية",
				"code.repo-skill-invalid": "هذه المهارة غير صالحة ولا يمكن تثبيتها",
				"code.repo-skill-limit": "تتجاوز هذه المهارة حدود الحجم الآمنة",
				"code.repo-skill-metadata": "بيانات هذه المهارة الوصفية غير صالحة",
				"code.repo-snapshot-changed": "لم تعد اللقطة المخزنة مطابقة؛ حدّث المستودع",
				"code.repo-not-installed": "لم يعد هذا التثبيت المتتبع موجوداً",
				"code.repo-trashed": "هذا التثبيت موجود بالفعل في السلة",
				"code.repo-missing": "النسخة المثبتة مفقودة من القرص",
				"code.repo-state-invalid": "حالة المستودعات غير مقروءة وتُركت دون تغيير",
				"code.repo-state-write": "تعذر حفظ حالة المستودعات",
				"code.repo-install-failed": "تعذر تثبيت المهارة",
				"code.repo-failed": "فشلت عملية المستودع",
				importSkills: "استيراد مهارات",
				importPath: "المسار المحلي المطلق",
				previewImport: "معاينة الاستيراد المحلي",
				importNow: "استيراد الآن",
				uploadFiles: "ملفات ZIP أو Markdown",
				uploadFolder: "مجلد مهارة",
				importConflict: "المهارات الموجودة",
				skipImport: "تخطي الموجود",
				overwriteImport: "استبدال الموجود (كل ملفات الحزمة)",
				importResult: "نتائج الاستيراد",
				pendingImport: "جاهزة",
				conflictsImport: "تعارضات",
				importedImport: "مستوردة",
				skippedImport: "متخطاة",
				failedImport: "فاشلة",
				warningsImport: "تحذيرات التنظيف",
				inputsImport: "الأرشيفات المعالجة",
				"code.import-cleanup": "تم الاستيراد بنجاح؛ تعذر تنظيف النسخة الاحتياطية. تحقق من مسار البقايا؛ قد تكون محتوياتها غير مكتملة",
				importHint: "ينسخ الملفات الأصلية. اختر التخطي أو الاستبدال صراحةً. المعاينة المحلية لا تكتب ملفات.",
				create: "إنشاء مهارة",
				skillName: "اسم المهارة",
				skillDescription: "وصف الاستخدام",
				skillBody: "تعليمات Markdown",
				destination: "وجهة الإنشاء",
				created: "تم إنشاء المهارة",
				"code.create-invalid": "أدخل اسمًا ووصفًا وتعليمات صالحة",
				"code.create-conflict": "توجد مهارة بهذا الاسم بالفعل",
				"code.create-readonly": "هذا المصدر للقراءة فقط",
				"code.create-linked-root": "لا يُسمح بمجلدات كتابة مرتبطة",
				"code.create-too-large": "محتوى المهارة يتجاوز الحد المسموح",
				"code.create-failed": "تعذر إنشاء المهارة",
				"code.import-path": "مسار الاستيراد غير آمن",
				"code.import-limit": "يتجاوز الاستيراد حدود الملفات أو الحجم أو العمق أو عدد العناصر",
				"code.import-linked": "لا يُسمح بالملفات المرتبطة أو الخاصة",
				"code.import-empty": "لم يتم العثور على مستندات مهارات",
				"code.import-metadata": "بيانات المهارة غير صالحة",
				"code.import-name": "اسم المهارة غير صالح",
				"code.import-duplicate": "مسارات أو أسماء استيراد مكررة",
				"code.import-encoding": "ترميز الرفع غير صالح",
				"code.import-archive": "أرشيف ZIP غير صالح أو غير مكتمل",
				"code.import-cancelled": "تم إلغاء الاستيراد والتخلص من التغييرات غير المنشورة",
				"code.import-overlap": "يتداخل مصدر الاستيراد مع الوجهة",
				"code.import-conflict": "اختر التخطي أو الاستبدال صراحةً",
				"code.import-failed": "تعذر استيراد هذه المهارة",
				"code.import-recovery": "فشلت الاستعادة؛ تم الاحتفاظ بالنسخة الأصلية في مجلد الوجهة لاستعادتها",
				title: "مدير المهارات",
				search: "البحث عن مهارات",
				all: "كل المصادر",
				any: "كل الحالات",
				enabled: "مفعلة",
				disabled: "معطلة",
				invalid: "غير صالحة",
				shadowed: "محجوبة بنسخة أعلى أولوية",
				retry: "إعادة المحاولة",
				loading: "جارٍ تحميل المهارات…",
				error: "تعذر تحميل المهارات",
				details: "التفاصيل",
				close: "إغلاق",
				empty: "لا توجد مهارات مطابقة",
				source: "المصدر",
				toggle: "تبديل",
				diagnostics: "التشخيصات",
				blocked: "محجوبة بقيد المؤلف",
				copyText: "نسخ النص",
				copyCopy: "تبديل النسخة",
				toggleSource: "تبديل المصدر",
				modelInvocation: "استدعاء النموذج",
				userInvocation: "استدعاء المستخدم",
				allowed: "مسموح",
				denied: "مرفوض",
				shadowedBy: "محجوبة بواسطة",
				reloadState: "إعادة قراءة الحالة",
				refresh: "إعادة تحميل",
				refreshAria: "إعادة تحميل المهارات",
				actionsAria: "إجراءات المهارات",
				refreshing: "جارٍ إعادة التحميل…",
				statsAria: "إحصاءات المهارات",
				statSkill: "مهارة",
				statSkills: "مهارات",
				statEnabled: "مفعلة",
				statDisabled: "معطلة",
				statDiagnostic: "تشخيص",
				statDiagnostics: "تشخيصات",
				stateLocked: "حالة المهارات غير صالحة؛ التغييرات مقفلة",
				"diag.discovery-truncated": "توقف الاكتشاف عند الحد الآمن",
				sourceProblems: "للمراجعة",
				linkedReadOnly: "مرتبطة (للقراءة فقط)",
				diagWarnings: "تحذيرات",
				diagWarning: "تحذير",
				diagNotes: "ملاحظات",
				diagNote: "ملاحظة",
				showMoreCount: "عرض {count} إضافية",
				diagGeneral: "عام",
				showLess: "عرض أقل",
				diagProblems: "مشكلات تحتاج إلى انتباه",
				diagProblem: "مشكلة تحتاج إلى انتباه",
				diagEntriesCount: "تعذرت قراءة {count} عنصر",
				diagEntriesOne: "تعذرت قراءة عنصر واحد",
				"diagReason.permission": "السبب: تم رفض الإذن",
				"diagReason.not-directory": "السبب: كان المتوقع مجلدًا لكن وُجد ملف",
				"diagReason.broken-link": "السبب: رابط يشير إلى عنصر لم يعد موجودًا",
				"diagReason.unknown": "السبب: تعذرت قراءة المجلد",
				"diagNext.unreadable-entries": "تحقق من أذونات المجلد. يتم تخطي هذه العناصر ولا تتأثر مهاراتك الأخرى.",
				"diagNext.source-unavailable": "تحقق من وجود المجلد وقابليته للقراءة، أو غيّر المجلد.",
				"diagNext.unreadable-skill": "تحقق من أذونات الملف أو استبدله.",
				"diagNext.oversized-skill": "قصّر ملف SKILL.md؛ يتم تخطي الملفات الكبيرة جدًا.",
				"diagNext.empty-skill": "أضف اسم المهارة ووصفها.",
				"diagNext.linked-outside-root": "هذا مسموح وللقراءة فقط؛ لا يلزم أي إجراء.",
				diagDetails: "المسارات المتأثرة",
				diagMore: "+{count} أخرى",
				sourceOn: "مفعّل",
				sourceOff: "معطّل",
				"diag.source-unavailable": "المصدر غير متاح",
				"diag.unreadable-entries": "تعذرت قراءة بعض العناصر",
				"diag.unreadable-skill": "تعذرت قراءة المهارة",
				"diag.oversized-skill": "حجم المهارة يتجاوز الحد",
				"diag.empty-skill": "ملف المهارة فارغ",
				"diag.invalid-frontmatter": "بيانات وصفية غير صالحة",
				"diag.invalid-yaml": "بيانات YAML غير صالحة",
				"diag.invalid-metadata": "بيانات وصفية غير صالحة",
				"diag.invalid-policy": "سياسة استدعاء غير صالحة",
				"diag.linked-outside-root": "وثيقة المهارة مرتبطة من خارج مصدرها",
				"diag.state-invalid": "حالة المهارات غير صالحة؛ المهارات المُدارة معطلة",
				"diag.project-unavailable": "المشروع غير متاح",
				"diag.project-missing": "مجلد المشروع غير موجود",
				"diag.project-unreadable": "تتعذر قراءة مجلد المشروع",
				"diag.project-source-outside": "مجلد مهارات المشروع يشير إلى خارج المشروع",
				"diag.project-source-overlap": "مجلد مهارات المشروع يتداخل مع مصدر آخر",
				scope: "العرض",
				scopeGlobal: "المهارات العامة",
				scopeProject: "مهارات المشروع",
				project: "المشروع",
				projectNone: "اختر مشروعاً مسجلاً",
				projectEmpty: "لا توجد مشاريع مسجلة بعد",
				projectHint: "تُقرأ مهارات المشروع من المشروع نفسه وتُبدَّل لذلك المشروع فقط",
				readOnlySource: "مهارات DSH في المشروع بلا مفتاح تبديل للمصدر",
				"code.project-missing": "المجلد غير موجود",
				"code.project-unreadable": "تتعذر قراءته",
				"code.project-unavailable": "غير متاح",
				"code.project-unregistered": "المشروع غير مسجل",
				"code.project-mismatch": "المشروع المحدد لا يطابق هذا العنصر",
				"code.project-dsh-source": "مهارات DSH في المشروع بلا مفتاح تبديل للمصدر",
				"code.root-not-absolute": "أدخل مسار مجلد مطلقاً",
				"code.root-too-long": "مسار المجلد طويل جداً",
				"code.root-not-found": "المجلد غير موجود",
				"code.root-not-directory": "المسار ليس مجلداً",
				"code.root-reserved": "هذا المجلد محجوز لمدير المهارات",
				"code.root-overlap": "هذا المجلد يتداخل مع مصدر مهارات آخر",
				"code.custom-limit": "بلغت الحد الأقصى وهو {limit} مصدراً مخصصاً",
				"code.custom-label": "الاسم أو المجموعة غير صالح أو طويل جداً",
				"code.custom-unknown": "هذا المصدر المخصص لم يعد موجوداً",
				"code.scan-aborted": "أُلغيت معاينة المجلد",
				"code.forbidden": "رُفض الطلب؛ أعد تحميل الصفحة وحاول مجدداً",
				"code.unsupported": "صيغة الطلب غير مدعومة",
				"code.stopping": "مدير المهارات قيد الإيقاف؛ حاول بعد قليل",
				"code.state-invalid": "حالة المهارات غير صالحة؛ أعد قراءة الحالة قبل تغيير المصادر",
				"diag.registry-unavailable": "سجل مساحات العمل غير متاح؛ قد لا تُطبَّق سياسة المشاريع",
				addSourceNamed: "إضافة مصدر",
				editNamed: "تعديل",
				removeNamed: "إزالة المصدر",
				confirmNamed: "تأكيد الإزالة",
				folders: "مجلدات المصادر",
				foldersHint: "عاين المجلد أولاً؛ لا يُسجَّل شيء حتى تضيفه. إزالة المصدر لا تحذف أي ملفات",
				folderPath: "مسار المجلد",
				scanFolder: "معاينة المجلد",
				addFolder: "إضافة المجلد",
				addSource: "إضافة مصدر",
				candidates: "المصادر المرشحة",
				noCandidates: "لا توجد مجلدات مهارات ضمن مستويين",
				candidateRegistered: "مسجل",
				candidateConflict: "يتداخل مع مصدر آخر",
				skillCount: "مهارات",
				customBadge: "مجلد مخصص",
				browse: "استعراض…",
				customTag: "مخصص",
				addCategoryHere: "تصنيف جديد في هذا المصدر",
				folderTitleFor: "تغيير مجلد المهارات لـ",
				folderHelp: "يقرأ DSH هذا المصدر من المجلد أدناه. اختر مجلدًا آخر إن كنت تحتفظ بالمهارات في مكان مختلف.",
				folderDefault: "المجلد الافتراضي",
				categoryHint: "تجميع المهارات في",
				categoryTaken: "يوجد تصنيف بهذا الاسم بالفعل.",
				editFolder: "تعديل المجلد",
				more: "مزيد من الإجراءات",
				newCategory: "تصنيف جديد",
				addSkillsHere: "إضافة المهارات المحددة",
				enabledCount: "مفعلة",
				editNote: "تعديل الملاحظة",
				noteAndDescription: "تحل الملاحظة محل الوصف في هذه القائمة",
				browseAria: "استعراض لاختيار مجلد",
				changeFolder: "تغيير المجلد",
				saveFolder: "حفظ المجلد",
				resetFolder: "استعادة الافتراضي",
				folderRedirected: "تم تغيير المجلد عن الافتراضي",
				"code.root-unsupported": "لا يمكن تغيير مجلد هذا المصدر",
				"code.project-scope-unsupported": "لا يمكن تغيير مجلدات المزوّدين إلا في المهارات العامة",
				"diag.root-override-ignored": "تم تجاهل تجاوز مجلد محفوظ لأنه لم يعد مسموحًا",
				edit: "تعديل",
				save: "حفظ",
				cancel: "إلغاء",
				label: "الاسم",
				group: "المجموعة",
				remove: "إزالة المصدر",
				removeNote: "هذا يزيل إدخال المصدر فقط ولا تُحذف ملفات المهارات",
				confirmRemove: "تأكيد الإزالة",
				added: "أُضيف المصدر",
				registered: "هذا المجلد مصدر بالفعل",
				categories: "التصنيفات",
				categoryName: "اسم التصنيف",
				addCategory: "إضافة تصنيف",
				uncategorized: "بدون تصنيف",
				renameCategory: "إعادة تسمية التصنيف",
				deleteCategory: "حذف التصنيف",
				confirmDeleteCategory: "تأكيد حذف التصنيف",
				deleteCategoryNote: "تصبح مهارات هذا التصنيف بلا تصنيف. لا تتغير أي ملفات مهارات",
				selectSkill: "تحديد المهارة",
				assignTo: "إسناد المحدد إلى",
				filterCategory: "التصنيف",
				allCategories: "كل التصنيفات",
				note: "ملاحظة",
				saveNote: "حفظ الملاحظة",
				noteHint: "الملاحظات قابلة للبحث ولا تغيّر وصف المهارة",
				noteLimit: "حتى 500 حرف",
				confirmNote: "تأكيد",
				importDropTitle: "أفلت المهارة هنا",
				importDropHint: "يدعم ملف .zip أو مجلد مهارة أو ملف SKILL.md واحد",
				importChooseFolder: "اختيار مجلد",
				importChooseFile: "اختيار ملف",
				importChosen: "تم اختيار {count} عنصر",
				importClear: "مسح",
				importDropUnsupported: "يمكن استيراد ملفات .zip والمجلدات وملفات SKILL.md فقط؛ تم تجاهل العناصر الأخرى.",
				importDropFailed: "تعذرت قراءة العناصر المُفلتة.",
				skillSource: "مصدر المهارات",
				skillSourcePick: "اختر مصدرًا…",
				hideForm: "إخفاء النموذج",
				destLocation: "الموقع",
				catHelp: "تبقى التصنيفات داخل هذا المصدر ولا تنقل الملفات.",
				catEmptyHere: "لا توجد مهارات بعد. استخدم «المزيد» في مهارة لوضعها هنا.",
				addSkillsTo: "إضافة مهارات إلى التصنيف",
				addSkillsNone: "لا توجد مهارات أخرى للإضافة.",
				addSkillsCount: "إضافة مهارات",
				toggleCategory: "تبديل التصنيف",
				createHere: "إضافة مهارة",
				createHereBlocked: "لا يمكن إضافة مهارات هنا: هذا المجلد للقراءة فقط في Waycraft",
				createBlockedTool: "للقراءة فقط في Waycraft: هذا المجلد يتبع أداة أخرى. أضف المهارات إلى DSH أو Agents بدلًا من ذلك.",
				createBlockedCustom: "للقراءة فقط في Waycraft: المصادر المخصصة تُقرأ فقط. أضف المهارات إلى DSH أو Agents بدلًا من ذلك.",
				destScope: "النطاق",
				destScopeUser: "مجلد المستخدم",
				destScopeProject: "مشروع",
				noteSavedHint: "تُحفظ في طبقة العرض الخاصة بالإضافة دون تعديل SKILL.md. امسح الحقل للرجوع إلى الوصف الأصلي.",
				copied: "تم النسخ",
				pathChip: "يُكتب في",
				createFootnote: "المهارات المُنشأة غير مرتبطة بتحديثات المستودعات، ولا يتم تعديل أي ملف مصدر.",
				importReqTitle: "متطلبات الملفات",
				importReq1: "يجب أن تحتوي الأرشيفات والمجلدات على SKILL.md.",
				importReq2: "يجب أن يتضمن SKILL.md اسمًا ووصفًا بصيغة YAML.",
				importReq3: "يقوم الاستيراد بنسخ كل المحتوى ولا يعدّل المصدر أبدًا.",
				customSources: "مصادر مخصصة",
				"code.invalid-request": "الطلب غير صالح",
				"code.source-unknown": "هذا المصدر غير متاح في هذا العرض",
				"code.organization-limit": "عدد التصنيفات أو الملاحظات أو الإسنادات لهذا المصدر كبير جدا",
				"code.state-too-large": "بيانات التنظيم المحفوظة كبيرة جدا؛ احذف بعض الملاحظات أو التصنيفات",
				placement: "موضع الدخول",
				placementHint: "اختر مكان ظهور مدير المهارات: الإعدادات أو الشريط الجانبي أو كليهما",
				placementBoth: "كلاهما",
				placementSidebar: "الشريط الجانبي فقط",
				placementSettings: "الإعدادات فقط",
				"code.category-name": "أدخل اسم تصنيف لا يتجاوز 24 حرفاً",
				"code.category-duplicate": "يوجد تصنيف بهذا الاسم بالفعل",
				"code.category-unknown": "لم يعد هذا التصنيف موجوداً",
				"code.category-limit": "بلغت الحد الأقصى وهو {limit} تصنيفاً",
				"code.skill-unknown": "هذه المهارة غير متاحة في هذا العرض",
				"code.note-too-long": "الملاحظة أطول من {limit} حرفاً",
				"code.placement-invalid": "موضع الدخول غير صالح"
			}
		};
		effect(() => ctx.locale.register("waycraft.skills", dictionaries), "waycraft-skills dictionaries");
		const t = ctx.locale.bind("waycraft.skills");
		const isArabic = () => ctx.locale.language?.getSnapshot?.() === "ar";
		let pickDirectory;
		try {
			ctx.inject?.(["uiWorkspace"], (injected) => {
				const workspace = injected?.uiWorkspace ?? injected;
				if (typeof workspace?.pickDirectory === "function") pickDirectory = () => workspace.pickDirectory();
			});
		} catch {}
		const sourceLabel = (source) => source.label ?? source.name ?? source.id;
		const PROJECT_DEST = "project-dsh:";
		const projectOfDest = (id) => id.startsWith(PROJECT_DEST) ? id.slice(12) : void 0;
		const pathParts = (value) => String(value).split(/[\\/]+/).filter(Boolean);
		const projectLabel = (data, id) => {
			const list = data?.projects ?? [];
			const found = list.find((x) => x.id === id);
			if (!found) return id;
			const same = list.filter((x) => x.name === found.name);
			if (same.length < 2) return found.name;
			const longest = Math.max(...same.map((x) => pathParts(x.path).length));
			for (let depth = 2; depth <= longest; depth++) {
				const tails = same.map((x) => pathParts(x.path).slice(-depth, -1).join("/"));
				if (tails.every(Boolean) && new Set(tails).size === tails.length) return `${found.name} (${pathParts(found.path).slice(-depth, -1).join("/")})`;
			}
			return `${found.name} (${found.path})`;
		};
		const projectFolder = (project) => {
			if (!project.available || !project.root) return void 0;
			const sep = project.root.includes("\\") && !project.root.includes("/") ? "\\" : "/";
			return `${project.root}${sep}.dsh${sep}skills`;
		};
		const destinationsOf = (data) => [...["user-dsh", "user-agents"].flatMap((id) => {
			const found = data?.sources?.find((x) => x.id === id);
			return found ? [{
				id,
				label: sourceLabel(found),
				path: found.path
			}] : [];
		}), ...(data?.projects ?? []).map((x) => ({
			id: `${PROJECT_DEST}${x.id}`,
			label: `${projectLabel(data, x.id)} — DSH`,
			path: projectFolder(x),
			project: true,
			...x.available ? {} : {
				disabled: true,
				reason: t(`code.${x.code ?? "project-unavailable"}`)
			}
		}))];
		const validDestination = (data, id) => destinationsOf(data).find((x) => x.id === id && !x.disabled);
		const destinationOption = (item, label = item.label) => h("option", {
			key: item.id,
			value: item.id,
			disabled: !!item.disabled
		}, item.disabled ? `${label} · ${item.reason}` : label);
		const destinationInfo = (data, selected) => [
			!(data?.projects ?? []).length ? h("p", null, t("destNoProjects")) : null,
			selected ? selected.path ? h("p", null, `${t("destPath")}: `, h("bdi", { dir: "ltr" }, selected.path)) : null : h("p", null, t("destInvalid")),
			selected?.project ? h("p", null, t("destProjectNote")) : null
		];
		const placeName = (data, entry) => {
			if (entry.project) return `${projectLabel(data, entry.project)} — DSH`;
			const found = (data?.sources ?? []).find((x) => x.id === entry.source);
			return found ? sourceLabel(found) : entry.source;
		};
		const placeNode = (data, entry) => h("bdi", { dir: "ltr" }, placeName(data, entry));
		const responsive = (condition, rules) => `@container (${condition}){${rules}}\n@supports not (container-type:inline-size){@media (${condition}){${rules}}}`;
		const SKILLS_STYLE = `
.waycraft-skills{container-type:inline-size;inline-size:100%;max-inline-size:720px;min-inline-size:0;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.waycraft-skills *{box-sizing:border-box;min-inline-size:0}
.waycraft-skills bdi{unicode-bidi:isolate}
.waycraft-skills-path{direction:ltr;unicode-bidi:isolate;overflow-wrap:anywhere;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.waycraft-skills-header{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-skills-title{margin:0;flex:1 1 auto;font-size:18px;line-height:26px;font-weight:600;color:var(--dsw-alias-label-primary)}
.waycraft-skills-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.waycraft-skills-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.waycraft-skills-toolbar select{order:1}
.waycraft-skills-toolbar input{order:2;flex:1 1 160px}
.waycraft-skills-toolbar .waycraft-skills-iconbar{order:3}
.waycraft-skills-toolbar select{flex:0 1 150px}
.waycraft-skills button,.waycraft-skills input,.waycraft-skills select,.waycraft-skills textarea{font:inherit;color:inherit}
.waycraft-skills button{min-block-size:28px;padding-inline:12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);cursor:pointer;transition:background-color .2s cubic-bezier(.4,0,.2,1)}
.waycraft-skills button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3))}
.waycraft-skills button:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-bg-layer-3))}
.waycraft-skills button:disabled{opacity:.5;cursor:not-allowed}
.waycraft-skills-header button{min-block-size:36px;border-radius:var(--dsw-radius-md,12px)}
.waycraft-skills button.waycraft-skills-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));border-color:transparent;color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-skills button.waycraft-skills-primary:hover:not(:disabled),.waycraft-skills button.waycraft-skills-primary:active:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary));border-color:transparent;color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-skills button.waycraft-skills-primary:disabled{background:var(--dsw-alias-button-primary-dimmed,var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary)));opacity:.5}
.waycraft-skills button.waycraft-skills-danger{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills button.waycraft-skills-danger:hover:not(:disabled),.waycraft-skills button.waycraft-skills-danger:active:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,var(--dsw-alias-interactive-bg-hover));color:var(--dsw-alias-state-error-primary)}
.waycraft-skills select{appearance:none;-webkit-appearance:none;block-size:32px;min-block-size:32px;padding-block:0;padding-inline:12px 32px;border-radius:var(--dsw-radius-md,12px);background-color:var(--dsw-alias-bg-layer-1);background-repeat:no-repeat;background-position:calc(100% - 15px) 14px,calc(100% - 10px) 14px;background-size:5px 5px,5px 5px;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-tertiary) 50%),linear-gradient(135deg,var(--dsw-alias-label-tertiary) 50%,transparent 50%);max-inline-size:100%;cursor:pointer}
.waycraft-skills select:dir(rtl),.waycraft-skills [dir=rtl] select{background-position:15px 14px,10px 14px;padding-inline:32px 12px}
.waycraft-skills select{color:var(--dsw-alias-label-primary);border:0.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2))}
.waycraft-skills select:focus{border-color:var(--dsw-alias-state-business-primary)}
.waycraft-skills select:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));outline-offset:2px}
.waycraft-skills select:disabled{opacity:.6;cursor:not-allowed}
.waycraft-skills-toolbar select{max-inline-size:240px}
.waycraft-skills-dialog select,.waycraft-skills-menu select{max-inline-size:none;inline-size:100%}
.waycraft-skills input{min-block-size:32px;padding-inline:12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.waycraft-skills input::placeholder{color:var(--dsw-alias-label-tertiary)}
.waycraft-skills button:focus-visible,.waycraft-skills input:focus-visible,.waycraft-skills summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.waycraft-skills-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-skills-stat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.waycraft-skills-stat+.waycraft-skills-stat{border-inline-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-stat strong{font-size:18px;line-height:26px;color:var(--dsw-alias-label-primary)}
.waycraft-skills-source{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-skills-source>summary{display:flex;align-items:center;gap:8px;min-block-size:44px;padding:8px 16px;cursor:pointer;font-weight:600;list-style:none}
.waycraft-skills-source>summary::-webkit-details-marker{display:none}
.waycraft-skills-chev{flex:none;inline-size:6px;block-size:6px;margin-inline:4px;border-inline-end:1.5px solid var(--dsw-alias-label-tertiary);border-block-end:1.5px solid var(--dsw-alias-label-tertiary);transform:rotate(-45deg);transition:transform .2s cubic-bezier(.4,0,.2,1)}
.waycraft-skills-source:dir(rtl) .waycraft-skills-chev{transform:rotate(135deg)}
.waycraft-skills-source[open] .waycraft-skills-chev,.waycraft-skills-source:dir(rtl)[open] .waycraft-skills-chev{transform:rotate(45deg)}
.waycraft-skills-source[data-off]>summary>.waycraft-skills-source-name,.waycraft-skills-source[data-off]>summary>.waycraft-skills-count,.waycraft-skills-source[data-off]>summary>.waycraft-skills-source-icon{opacity:.55}
.waycraft-skills-source-name{flex:0 1 auto;overflow-wrap:anywhere}
.waycraft-skills-source-icon{inline-size:16px;block-size:16px;flex:none;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-source-path{flex:1 1 0;min-inline-size:0;margin-inline-start:auto;text-align:end;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.waycraft-skills-count{flex:none;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400;white-space:nowrap}
${responsive("min-width:521px", `.waycraft-skills-source-meta .waycraft-skills-path{display:none}`)}
${responsive("max-width:520px", `.waycraft-skills-source-path{display:none}`)}
.waycraft-skills-badge{white-space:nowrap;display:inline-flex;align-items:center;gap:4px;padding-inline:8px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xs,4px);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-weight:400}
.waycraft-skills-status{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400}
.waycraft-skills-source-body{display:flex;flex-direction:column;gap:12px;padding:12px 16px}
.waycraft-skills-source-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:space-between}
.waycraft-skills button.waycraft-skills-switch{box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:flex-start;flex:0 0 auto;inline-size:36px;min-inline-size:36px;block-size:20px;min-block-size:0;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);font-size:0;line-height:0;cursor:pointer}
.waycraft-skills button.waycraft-skills-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}
.waycraft-skills button.waycraft-skills-switch:hover:not(:disabled),.waycraft-skills button.waycraft-skills-switch:active:not(:disabled){background:var(--dsw-alias-border-l3)}
.waycraft-skills button.waycraft-skills-switch[aria-checked=true]:hover:not(:disabled),.waycraft-skills button.waycraft-skills-switch[aria-checked=true]:active:not(:disabled){background:var(--dsw-alias-brand-primary)}
.waycraft-skills button.waycraft-skills-switch:disabled{cursor:default;opacity:.5}
.waycraft-skills button.waycraft-skills-switch:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.waycraft-skills-switch-thumb{display:block;flex:none;inline-size:16px;block-size:16px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);transition:transform .12s ease}
.waycraft-skills-switch[aria-checked=false] .waycraft-skills-switch-thumb{background:var(--dsw-alias-switch-thumb)}
.waycraft-skills-switch[aria-checked=true] .waycraft-skills-switch-thumb{transform:translate(16px)}
.waycraft-skills-switch[aria-checked=true]:dir(rtl) .waycraft-skills-switch-thumb{transform:translate(-16px)}
@media (prefers-reduced-motion:reduce){.waycraft-skills-switch-thumb{transition:none}}
.waycraft-skills button.waycraft-skills-switch::after{content:"";position:absolute;inset:-6px -4px}
@media (pointer:coarse){.waycraft-skills button.waycraft-skills-icon-btn,.waycraft-skills-row-actions button:not(.waycraft-skills-switch){min-inline-size:40px;min-block-size:40px}.waycraft-skills button.waycraft-skills-switch::after{inset:-12px -8px}}
.waycraft-skills-form[hidden]{display:none}
.waycraft-skills .waycraft-skills-row[draggable=true]{grid-template-columns:16px minmax(0,1fr) auto;column-gap:8px}
.waycraft-skills-grip{flex:none;align-self:center;cursor:grab;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1;user-select:none;inline-size:16px;text-align:center}
.waycraft-skills-grip:active{cursor:grabbing}
.waycraft-skills .waycraft-skills-row.waycraft-skills-dragging{opacity:.4}
.waycraft-skills .waycraft-skills-catsec.waycraft-skills-drop-over{box-shadow:inset 0 0 0 1.5px var(--dsw-alias-brand-primary)}
.waycraft-skills [data-waycraft-repository]{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:12px 16px}
.waycraft-skills .waycraft-skills-repohead{flex:1 1 100%;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}
.waycraft-skills .waycraft-skills-repohead>strong{flex:1 1 160px;overflow-wrap:anywhere;direction:ltr;text-align:start}
.waycraft-skills .waycraft-skills-repohead .waycraft-skills-badge{flex:none}
.waycraft-skills .waycraft-skills-repohead .waycraft-skills-cathead-actions{min-inline-size:0;flex:none;margin-inline-start:0}
.waycraft-skills [data-waycraft-repository]>p{flex:1 1 100%;margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.waycraft-skills [data-waycraft-repository]>button{min-block-size:28px}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]{flex:1 1 100%;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding-block:12px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]>span:first-child{font-weight:600}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]>span+span{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]>p{flex:1 1 100%;margin:0;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]>button{margin-inline-start:auto;min-block-size:28px}
.waycraft-skills-filterrow>select.waycraft-skills-first{order:-1}
.waycraft-skills-caption{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.waycraft-skills-filterrow{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-skills-filterrow>select{flex:0 1 200px;min-inline-size:140px}
.waycraft-skills-filterrow>input,.waycraft-skills-filterrow>.waycraft-skills-searchform{flex:1 1 180px;min-inline-size:0}
.waycraft-skills-searchform{display:flex;align-items:center;gap:4px;margin:0;padding:0;border:0;background:transparent}
.waycraft-skills-searchform>input{flex:1 1 auto;min-inline-size:0}
.waycraft-skills-emptystate{padding:24px 12px;text-align:center;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-list{display:flex;flex-direction:column;margin:0;padding:0;list-style:none}
.waycraft-skills-listrow{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:4px 12px;padding:12px 16px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-listrow:first-child{border-block-start:0}
.waycraft-skills-listrow>ul{grid-column:1/-1}
.waycraft-skills .waycraft-skills-row.waycraft-skills-discover-row{align-items:start;padding:8px 0;background:transparent;transition:none}
.waycraft-skills-discover-row .waycraft-skills-row-title{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}
.waycraft-skills-discover-row .waycraft-skills-row-title strong{font-weight:600;overflow-wrap:anywhere}
.waycraft-skills-discover-row .waycraft-skills-row-desc{margin:0;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.waycraft-skills-meta-line{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-block-start:4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.waycraft-skills-origin{overflow-wrap:anywhere}
.waycraft-skills-stat-pill{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-tertiary)}
.waycraft-skills-stat-pill svg{inline-size:12px;block-size:12px}
.waycraft-skills-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.waycraft-skills button.waycraft-skills-install{display:inline-flex;align-items:center;gap:8px;min-block-size:28px;padding-inline:8px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.waycraft-skills button.waycraft-skills-install:hover:not(:disabled),.waycraft-skills button.waycraft-skills-install:active:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-label-primary)}
.waycraft-skills-badge-quiet{color:var(--dsw-alias-label-tertiary)}
.waycraft-skills-repolist{margin-block-start:8px}
.waycraft-skills-meta{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.waycraft-skills .waycraft-skills-listrow .waycraft-skills-row-actions{flex-wrap:nowrap;gap:4px}
.waycraft-skills .waycraft-skills-tabs button{min-block-size:32px;padding:0 16px;border-radius:999px}
${responsive("max-width:640px", `.waycraft-skills-filterrow>select{flex:1 1 100%}`)}
${responsive("max-width:420px", `.waycraft-skills-panel{padding:8px}.waycraft-skills-listrow{padding:12px 8px;column-gap:8px}`)}
.waycraft-skills-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:start;padding:8px 0;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-row-main{display:flex;flex-direction:column;gap:4px}
.waycraft-skills-row-title{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-skills-row-desc{margin:0;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
.waycraft-skills-row-actions{display:flex;flex-wrap:nowrap;align-items:center;gap:4px;justify-content:flex-end}
.waycraft-skills-row-note{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px}
.waycraft-skills-row-note input{flex:1 1 200px}
.waycraft-skills-diag{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);overflow:hidden;background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
.waycraft-skills-diag[data-tone=issue]{border-color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-diag>summary{display:flex;align-items:center;gap:8px;min-block-size:36px;padding:8px 12px;cursor:pointer}
.waycraft-skills-diag[data-tone=quiet]>summary{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills-diag ul{margin:0;padding:0 12px 8px;list-style:none;display:flex;flex-direction:column;gap:4px}
.waycraft-skills-diag li{display:flex;gap:8px;align-items:baseline;overflow-wrap:anywhere}
.waycraft-skills .waycraft-skills-diag li.waycraft-skills-diag-item{flex-direction:column;align-items:stretch;gap:4px;padding-block:8px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-diag-title{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}
.waycraft-skills-diag-source{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills-diag-chip{align-self:flex-start;max-inline-size:100%;overflow-wrap:anywhere}
.waycraft-skills-diag-detail{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills-diag-more{display:flex;flex-direction:column;gap:4px}
.waycraft-skills-diag-more>summary{cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px;border-radius:var(--dsw-radius-sm,8px)}
.waycraft-skills-diagregion{border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);overflow:hidden;background:transparent}
.waycraft-skills-diagregion[data-tone=issue]{border-color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-diagregion[data-tone=warning]{border-color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diagregion>summary{display:flex;align-items:center;gap:8px;min-block-size:32px;padding:4px 12px;cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary);border-radius:inherit}
.waycraft-skills-diagregion>summary:hover{background:var(--dsw-alias-interactive-bg-hover)}
.waycraft-skills-diagregion[data-tone=issue] .waycraft-skills-icon{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-diagregion[data-tone=warning] .waycraft-skills-icon{color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diagregion-text{flex:1 1 auto;min-inline-size:0}
.waycraft-skills-diagregion[open]>summary .waycraft-skills-chev{transform:rotate(45deg)}
.waycraft-skills-diagregion:dir(rtl)>summary .waycraft-skills-chev{transform:rotate(135deg)}
.waycraft-skills-diagregion:dir(rtl)[open]>summary .waycraft-skills-chev{transform:rotate(45deg)}
.waycraft-skills-diagregion-body{display:flex;flex-direction:column;gap:8px;padding:0 12px 8px}
.waycraft-skills-diaggroup{display:flex;flex-direction:column;gap:4px}
.waycraft-skills-diaggroup ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}
.waycraft-skills-diaggroup li{overflow-wrap:anywhere}
.waycraft-skills-diaggroup-head{display:flex;align-items:center;gap:8px;margin:0;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-diaggroup[data-tone=issue] .waycraft-skills-icon{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-diaggroup[data-tone=warning] .waycraft-skills-icon{color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diag-foot{padding:0 12px 12px;display:flex;justify-content:flex-start}
.waycraft-skills-diag-hint{margin:0;padding:0 12px 4px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.waycraft-skills-icon{flex:none;inline-size:16px;block-size:16px}
.waycraft-skills-diag[data-tone=warning]{border-color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diag[data-tone=warning] .waycraft-skills-icon{color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diag[data-tone=note]>summary{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills-linked{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.waycraft-skills-badge-warn{border-color:var(--dsw-alias-state-warn-label);color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diag[data-tone=issue] .waycraft-skills-icon{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-empty,.waycraft-skills-loading{margin:0;padding:16px;text-align:center;color:var(--dsw-alias-label-secondary);border:0.5px dashed var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px)}
.waycraft-skills-alert{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;border:0.5px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-lg,16px);color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-notice{margin:0;color:var(--dsw-alias-label-secondary)}
.waycraft-skills [aria-busy=true]{cursor:progress}
.waycraft-skills-inline{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-skills-member{display:flex;align-items:center;gap:8px;min-block-size:28px;cursor:pointer}
.waycraft-skills-member-name{flex:1 1 auto;overflow-wrap:anywhere}
.waycraft-skills input[type=checkbox]{appearance:none;-webkit-appearance:none;position:relative;inline-size:16px;block-size:16px;min-block-size:0;padding:0;border:1px solid var(--dsw-alias-label-tertiary);border-radius:var(--dsw-radius-xs,4px);background:var(--dsw-alias-bg-layer-1);flex:none;cursor:pointer}
.waycraft-skills input[type=checkbox]:checked{background:var(--dsw-alias-brand-primary);border-color:transparent}
.waycraft-skills input[type=checkbox]:checked::after{content:"";position:absolute;inset-inline-start:5px;inset-block-start:2px;inline-size:4px;block-size:8px;border:solid var(--dsw-alias-label-primary-foreground);border-width:0 1.5px 1.5px 0;transform:rotate(45deg)}
.waycraft-skills-panel{display:flex;flex-direction:column;gap:8px;padding:12px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
.waycraft-skills-panel h3,.waycraft-skills-panel h4{margin:0;font-size:14px;line-height:22px;font-weight:600}
.waycraft-skills-panel p{margin:0}
.waycraft-skills-panel>button,.waycraft-skills-panel>select,.waycraft-skills-panel>input{align-self:flex-start;max-inline-size:100%}
.waycraft-skills-panel>input:not([type=file]),.waycraft-skills-panel>select{align-self:stretch}
.waycraft-skills-card{padding:8px 12px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-layer-1);list-style:none}
.waycraft-skills-tabs{display:inline-flex;flex-wrap:wrap;gap:4px;padding:4px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);align-self:flex-start}
.waycraft-skills-tabs button{min-block-size:28px;border-color:transparent;background:transparent;border-radius:var(--dsw-radius-sm,8px)}
.waycraft-skills-tabs button[aria-selected=true],.waycraft-skills-tabs button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2))}
.waycraft-skills-form{display:flex;flex-direction:column;gap:8px;padding:12px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
.waycraft-skills-form p{margin:0;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-form button{align-self:flex-start}
.waycraft-skills-textarea{min-block-size:120px;padding:8px 12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);resize:vertical}
.waycraft-skills textarea:focus-visible,.waycraft-skills [tabindex="-1"]:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.waycraft-skills-dialog{display:flex;flex-direction:column;gap:8px;max-inline-size:min(600px,100%);padding:16px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-soft,var(--dsw-shadow-lv3))}
.waycraft-skills-dialog{padding:0;gap:0;overflow:hidden}
.waycraft-skills-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:16px 24px;border-block-end:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-dialog-head h3{font-size:16px;line-height:24px;font-weight:600}
.waycraft-skills-dialog-body{display:flex;flex-direction:column;gap:16px;padding:24px;overflow:auto;min-block-size:0}
.waycraft-skills-dialog-footer{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:16px 24px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-dialog .waycraft-skills-form,.waycraft-skills-dialog .waycraft-skills-panel{padding:0;border:0;background:transparent;gap:8px}
.waycraft-skills-dialog-body .waycraft-skills-dialog-footer{margin:12px -24px -24px;inline-size:auto}
.waycraft-skills-dialog-body .waycraft-skills-form .waycraft-skills-dialog-footer button{align-self:auto}
.waycraft-skills-dialog-footer button{min-block-size:36px;border-radius:var(--dsw-radius-md,12px)}
.waycraft-skills-drop{display:flex;flex-direction:column;align-items:center;gap:4px;padding:24px 16px;text-align:center;cursor:pointer;border:1px dashed var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);transition:background-color .2s cubic-bezier(.4,0,.2,1),border-color .2s cubic-bezier(.4,0,.2,1)}
.waycraft-skills-drop strong{color:var(--dsw-alias-label-primary);font-weight:600}
.waycraft-skills-drop:hover,.waycraft-skills-drop[data-drag=over]{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3));border-color:var(--dsw-alias-brand-primary)}
.waycraft-skills-drop:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.waycraft-skills-customlist{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.waycraft-skills-customlist li{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px}
.waycraft-skills-reqs{margin:0;padding-inline-start:24px;color:var(--dsw-alias-label-secondary);font-size:12px;display:flex;flex-direction:column;gap:4px}
.waycraft-skills-divider{margin:0;border:0;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-pathrow{display:flex;gap:8px;align-items:flex-end}
.waycraft-skills-pathrow .waycraft-skills-labeled{flex:1 1 auto;min-inline-size:0}
.waycraft-skills-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.waycraft-skills-grid>*{min-inline-size:0}
.waycraft-skills-panel>.waycraft-skills-form{border:0;padding:0;background:transparent}
.waycraft-skills-labeled{display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-labeled input{inline-size:100%;font-size:14px;color:var(--dsw-alias-label-primary)}
.waycraft-skills-helper{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills button.waycraft-skills-link{min-block-size:0;padding:0;border:0;background:transparent;color:var(--dsw-alias-brand-primary);text-decoration:underline;cursor:pointer}
.waycraft-skills button.waycraft-skills-link:hover:not(:disabled),.waycraft-skills button.waycraft-skills-link:active:not(:disabled){background:transparent;color:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary))}
.waycraft-skills summary:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-1))}
.waycraft-skills input[type=file]::file-selector-button:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3))}
.waycraft-skills input[type=file]::file-selector-button:active{background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-bg-layer-3))}
.waycraft-skills-field-error{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-dialog p,.waycraft-skills-dialog h3{margin:0;overflow-wrap:anywhere}
.waycraft-skills-dialog pre{margin:0;padding:8px 12px;max-block-size:320px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);font-family:var(--ds-font-family-code)}
.waycraft-skills button.waycraft-skills-danger:hover:not(:disabled){border-color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-form button,.waycraft-skills-panel>button,.waycraft-skills-header button{min-block-size:36px;border-radius:var(--dsw-radius-md,12px)}
@media (min-width:561px){.waycraft-skills-dialog-head,.waycraft-skills-dialog-footer{padding-inline:24px}.waycraft-skills-dialog-body{padding:24px 24px}.waycraft-skills-dialog-body .waycraft-skills-dialog-footer{margin:12px -24px -24px}}
${responsive("max-width:520px", `.waycraft-skills .waycraft-skills-row,.waycraft-skills .waycraft-skills-row[draggable=true]{grid-template-columns:minmax(0,1fr) auto}.waycraft-skills .waycraft-skills-row[draggable=true]{grid-template-columns:16px minmax(0,1fr) auto}.waycraft-skills-toolbar select,.waycraft-skills-toolbar input{flex:1 1 100%}`)}
@media (prefers-reduced-motion:reduce){.waycraft-skills *,.waycraft-skills *::before{transition:none!important;animation:none!important}}
.waycraft-skills input[type=file]::file-selector-button{min-block-size:28px;margin-inline-end:8px;padding-inline:12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer}
.waycraft-skills-row-actions button{min-block-size:28px}
.waycraft-skills-row{grid-template-columns:minmax(0,1fr) auto;align-items:center}
.waycraft-skills-ico{flex:none}
.waycraft-skills button.waycraft-skills-icon-btn{display:inline-flex;align-items:center;justify-content:center;inline-size:28px;block-size:28px;min-block-size:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-tertiary)}
.waycraft-skills button.waycraft-skills-icon-btn:hover:not(:disabled),.waycraft-skills button.waycraft-skills-icon-btn:active:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-label-primary)}
.waycraft-skills button.waycraft-skills-icon-btn:disabled{opacity:.4}
.waycraft-skills button.waycraft-skills-icon-btn.waycraft-skills-icon-btn--danger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,var(--dsw-alias-interactive-bg-hover));color:var(--dsw-alias-state-error-primary)}
.waycraft-skills button.waycraft-skills-icon-btn.waycraft-skills-icon-btn--primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-skills button.waycraft-skills-icon-btn.waycraft-skills-icon-btn--primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-skills-icon-btn svg{inline-size:16px;block-size:16px}
.waycraft-skills-seg{display:inline-flex;flex-wrap:wrap;max-inline-size:100%;gap:4px;padding:4px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);min-block-size:32px;flex:0 0 auto}
.waycraft-skills-seg button{display:inline-flex;align-items:center;gap:8px;min-block-size:28px;padding-inline:8px;border-color:transparent;background:transparent;border-radius:var(--dsw-radius-sm,8px)}
.waycraft-skills-seg button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2))}
.waycraft-skills-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);opacity:0;pointer-events:none;padding:0;border:0}
.waycraft-skills-iconbar{display:inline-flex;flex:none;align-items:stretch;block-size:32px;border:0.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.waycraft-skills .waycraft-skills-iconbar button.waycraft-skills-icon-btn{inline-size:32px;block-size:100%;min-block-size:0;border-radius:0;color:var(--dsw-alias-label-secondary)}
.waycraft-skills .waycraft-skills-iconbar button.waycraft-skills-icon-btn+button.waycraft-skills-icon-btn{border-inline-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills .waycraft-skills-iconbar button.waycraft-skills-icon-btn:focus-visible{outline-offset:-2px}
.waycraft-skills-toolbar .waycraft-skills-iconbar{margin-inline-start:auto}
.waycraft-skills-source>summary .waycraft-skills-icon-btn,.waycraft-skills-source>summary .waycraft-skills-switch{flex:none}
${responsive("max-width:520px", `.waycraft-skills-source>summary{flex-wrap:wrap}.waycraft-skills-source-name{flex:1 1 auto;min-inline-size:4ch}.waycraft-skills-source>summary .waycraft-skills-switch{font-size:0}.waycraft-skills-source>summary .waycraft-skills-status{display:none}.waycraft-skills-source>summary>:first-child+*{white-space:nowrap}`)}
.waycraft-skills-pop{position:fixed;inset:auto;z-index:1000;inline-size:auto;max-inline-size:calc(100vw - 16px);display:block}
.waycraft-skills-overlay{position:fixed;inset:0;z-index:1000;inline-size:auto;max-inline-size:none;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--dsw-alias-bg-base);background:color-mix(in srgb,var(--dsw-alias-bg-base) 60%,transparent);overflow:auto}
.waycraft-skills-overlay .waycraft-skills-dialog{inline-size:min(var(--waycraft-skills-w,600px),100%);min-inline-size:0;max-block-size:calc(100vh - 32px);max-block-size:calc(100dvh - 32px);overflow:hidden;overflow-wrap:anywhere}
.waycraft-skills-menu{max-block-size:calc(100vh - 16px);max-block-size:calc(100dvh - 16px);overflow:auto;box-shadow:var(--dsw-elevation-soft,var(--dsw-shadow-lv3));display:flex;flex-direction:column;gap:4px;min-inline-size:160px;padding:8px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-layer-2)}
.waycraft-skills-menu button,.waycraft-skills-menu select{inline-size:100%;text-align:start}
.waycraft-skills-diag,.waycraft-skills-catsec{overflow:hidden}
.waycraft-skills-diag>summary,.waycraft-skills-catsec>summary{border-radius:inherit}
.waycraft-skills button.waycraft-skills-link.waycraft-skills-danger,.waycraft-skills button.waycraft-skills-link.waycraft-skills-danger:hover:not(:disabled){color:var(--dsw-alias-state-error-primary)}
${responsive("max-width:520px", `.waycraft-skills-stats{grid-template-columns:repeat(2,minmax(0,1fr))}`)}
${responsive("max-width:520px", `.waycraft-skills .waycraft-skills-row.waycraft-skills-discover-row{grid-template-columns:minmax(0,1fr);align-items:start}.waycraft-skills .waycraft-skills-discover-row .waycraft-skills-row-actions{justify-content:flex-end}`)}
.waycraft-skills-catempty{margin:0;padding-inline:32px 8px;padding-block-end:8px}
.waycraft-skills-pathrow>button{white-space:nowrap;flex:none}
.waycraft-skills-cathead{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;min-block-size:40px;padding-inline:8px;font-weight:600;font-size:13px}
.waycraft-skills-cathead>.waycraft-skills-source-name{flex:0 1 auto;min-inline-size:max-content;max-inline-size:100%;overflow-wrap:normal}
.waycraft-skills-cathead-actions{display:flex;align-items:center;justify-content:flex-end;gap:4px;flex:1 0 auto;margin-inline-start:auto}
.waycraft-skills-footnote{margin:0;padding:8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.waycraft-skills-catico{display:inline-flex;color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-catbody>summary{display:flex;align-items:center;gap:8px;min-block-size:28px;padding-inline:8px;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px;list-style:none}
.waycraft-skills-catbody>summary::-webkit-details-marker{display:none}
.waycraft-skills .waycraft-skills-catbody>summary .waycraft-skills-chev{transform:rotate(-45deg)}
.waycraft-skills .waycraft-skills-catbody>summary:dir(rtl) .waycraft-skills-chev{transform:rotate(135deg)}
.waycraft-skills .waycraft-skills-catbody[open]>summary .waycraft-skills-chev,.waycraft-skills .waycraft-skills-catbody[open]>summary:dir(rtl) .waycraft-skills-chev{transform:rotate(45deg)}
.waycraft-skills-picklist{display:flex;flex-direction:column;gap:4px;max-block-size:260px;overflow:auto}
.waycraft-skills-catsec{border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-catsec>summary{display:flex;align-items:center;gap:8px;min-block-size:32px;cursor:pointer;font-weight:600;font-size:13px}
.waycraft-skills-catsec>summary .waycraft-skills-source-name{flex:1 1 auto}
.waycraft-skills-catsec>summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
${responsive("max-width:520px", `.waycraft-skills-seg span:not(.waycraft-skills-badge){display:none}.waycraft-skills-toolbar .waycraft-skills-iconbar{margin-inline-start:0}`)}

`;
		const diagnosticText = (item) => {
			const label = dictionaries.en[`diag.${item.code}`] ? t(`diag.${item.code}`) : item.message ?? item.code;
			const where = item.params?.path ?? item.params?.source;
			return where ? `${label} — ${where}` : label;
		};
		const isAbsentDefault = (item, sources, items) => {
			const id = item.params?.source;
			if (!sources.find((x) => x.id === id && !x.custom)) return false;
			if (item.code === "source-unavailable") return true;
			return item.code === "unreadable-entries" && item.params?.count === "1" && items.some((x) => x.code === "source-unavailable" && x.params?.source === id);
		};
		const NOTE_CODES = ["linked-outside-root"];
		const WARNING_CODES = [
			"discovery-truncated",
			"oversized-skill",
			"empty-skill",
			"invalid-frontmatter",
			"invalid-yaml",
			"invalid-metadata",
			"invalid-policy",
			"project-source-outside",
			"project-source-overlap",
			"root-override-ignored",
			"unreadable-entries"
		];
		const severityOf = (item) => item.severity === "error" || item.severity === "warning" || item.severity === "note" ? item.severity : NOTE_CODES.includes(item.code) ? "note" : WARNING_CODES.includes(item.code) ? "warning" : "error";
		const DIAG_CAP = 8;
		const ROW_CAP = 100;
		const SEVERITY_PATHS = {
			error: "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 5v3.5M8 10.5v.01",
			warning: "M8 2.5l6 10.5H2zM8 6.5v3M8 11.5v.01",
			note: "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 7.5V11M8 5v.01"
		};
		const severityIcon = (level, extra) => h("svg", {
			viewBox: "0 0 16 16",
			width: 16,
			height: 16,
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": true,
			...extra
		}, h("path", { d: SEVERITY_PATHS[level] ?? SEVERITY_PATHS.note }));
		function DiagGroup(props) {
			const [all, setAll] = React.useState(false);
			const shown = all ? props.rows : props.rows.slice(0, DIAG_CAP);
			const key = props.level === "error" ? props.count === 1 ? "diagProblem" : "diagProblems" : props.level === "warning" ? props.count === 1 ? "diagWarning" : "diagWarnings" : props.count === 1 ? "diagNote" : "diagNotes";
			return h("div", {
				className: "waycraft-skills-diaggroup",
				"data-tone": props.level === "error" ? "issue" : props.level,
				[`data-waycraft-skills-diag-${props.level}`]: true,
				...props.level === "error" ? { "data-waycraft-skills-diag-issues": true } : {},
				dir: isArabic() ? "rtl" : void 0
			}, props.head ? h("p", { className: "waycraft-skills-diaggroup-head" }, severityIcon(props.level, {
				className: "waycraft-skills-icon",
				"data-waycraft-skills-icon": props.level
			}), h("bdi", null, String(props.count)), " ", t(key)) : null, props.hint ? h("p", { className: "waycraft-skills-diag-hint" }, props.hint) : null, h("ul", null, ...shown), props.rows.length > DIAG_CAP ? h("div", { className: "waycraft-skills-diag-foot" }, h("button", {
				type: "button",
				className: "waycraft-skills-link",
				onClick: () => setAll(!all)
			}, all ? t("showLess") : t("showMoreCount").replace("{count}", String(props.rows.length - DIAG_CAP)))) : null);
		}
		const diagnosticsRegion = (items, sources, id, ctl) => {
			const rest = items.filter((x) => (x.params?.source ?? "") === id && !isAbsentDefault(x, sources, items));
			const pathOf = (x) => x.params?.path ?? sources.find((y) => y.id === x.params?.source)?.path ?? "";
			const chip = (value, key) => h("code", {
				key,
				className: "waycraft-skills-path waycraft-skills-diag-chip"
			}, h("bdi", { dir: "ltr" }, value));
			const titleOf = (x) => {
				if (x.code === "unreadable-entries") {
					const n = Number(x.params?.count ?? "0");
					return n === 1 ? t("diagEntriesOne") : t("diagEntriesCount").replace("{count}", String(n));
				}
				return dictionaries.en[`diag.${x.code}`] ? t(`diag.${x.code}`) : x.message ?? x.code;
			};
			const hasKey = (key) => !!dictionaries.en[key];
			const line = (x, i) => {
				const paths = String(x.params?.paths ?? "").split("\n").filter(Boolean);
				const total = Number(x.params?.count ?? paths.length);
				const reason = x.params?.reason;
				const next = hasKey(`diagNext.${x.code}`) ? t(`diagNext.${x.code}`) : "";
				const where = x.params?.path ?? (paths.length ? "" : pathOf(x));
				return h("li", {
					key: `${x.code}:${i}`,
					className: "waycraft-skills-diag-item"
				}, h("div", { className: "waycraft-skills-diag-title" }, h("strong", null, titleOf(x))), where ? chip(where, "path") : null, reason && hasKey(`diagReason.${reason}`) ? h("p", { className: "waycraft-skills-diag-detail" }, t(`diagReason.${reason}`)) : null, next ? h("p", { className: "waycraft-skills-diag-detail" }, next) : null, paths.length ? h("details", { className: "waycraft-skills-diag-more" }, h("summary", null, t("diagDetails")), ...paths.map((path) => chip(path, path)), total > paths.length ? h("span", {
					key: "more",
					className: "waycraft-skills-diag-detail"
				}, t("diagMore").replace("{count}", String(total - paths.length))) : null) : null);
			};
			const seen = /* @__PURE__ */ new Set();
			const dedupe = (list) => list.filter((x) => {
				const key = `${x.code}|${x.params?.source ?? ""}|${x.params?.path ?? ""}`;
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
			const groups = [];
			const counts = {};
			const mixed = new Set(rest.map((x) => severityOf(x))).size > 1;
			for (const level of [
				"error",
				"warning",
				"note"
			]) {
				const rows = dedupe(rest.filter((x) => severityOf(x) === level));
				counts[level] = rows.length;
				if (rows.length) groups.push(h(DiagGroup, {
					key: level,
					level,
					count: rows.length,
					rows: rows.map((x, i) => line(x, i)),
					head: mixed
				}));
			}
			if (!groups.length) return null;
			const worst = counts.error ? "error" : counts.warning ? "warning" : "note";
			const label = (level, n) => `${n} ${t(level === "error" ? n === 1 ? "diagProblem" : "diagProblems" : level === "warning" ? n === 1 ? "diagWarning" : "diagWarnings" : n === 1 ? "diagNote" : "diagNotes")}`;
			const summary = [
				"error",
				"warning",
				"note"
			].filter((level) => counts[level]).map((level) => label(level, counts[level])).join(" · ");
			return h("details", {
				key: `diag:${id}`,
				id: `waycraft-diag-${id || "general"}`,
				className: "waycraft-skills-diagregion",
				"data-tone": worst === "error" ? "issue" : worst,
				"data-waycraft-diag-source": id,
				open: ctl.open,
				onToggle: (event) => {
					const open = !!event.currentTarget?.open;
					if (open !== ctl.open) ctl.onToggle(open);
				},
				dir: isArabic() ? "rtl" : void 0
			}, h("summary", null, severityIcon(worst, {
				className: "waycraft-skills-icon",
				"data-waycraft-skills-icon": worst
			}), h("span", { className: "waycraft-skills-diagregion-text" }, id ? summary : `${t("diagGeneral")} · ${summary}`), h("span", {
				className: "waycraft-skills-chev",
				"aria-hidden": true
			})), h("div", { className: "waycraft-skills-diagregion-body" }, ...groups));
		};
		const call = async (body, signal) => {
			const base = new URL(document.baseURI);
			if (!base.pathname.endsWith("/")) base.pathname += "/";
			const response = await fetch(new URL("api/waycraft-skills.catalog", base), {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-waycraft-skills": "1"
				},
				body: JSON.stringify(body),
				signal
			});
			if (!response.ok) {
				const failure = new Error(String(response.status));
				const body$1 = await response.json().catch(() => ({}));
				failure.params = body$1.params;
				failure.code = body$1.code ?? {
					403: "forbidden",
					415: "unsupported",
					503: "stopping"
				}[response.status] ?? (response.status === 409 ? "state-invalid" : void 0);
				throw failure;
			}
			return response.json();
		};
		const copyText = (text) => {
			const clipboard = typeof navigator === "undefined" ? void 0 : navigator.clipboard;
			if (!clipboard || typeof clipboard.writeText !== "function") return Promise.reject(/* @__PURE__ */ new Error("clipboard-unavailable"));
			return Promise.resolve().then(() => clipboard.writeText(text));
		};
		const errorText = (failure) => failure?.code && dictionaries.en[`code.${failure.code}`] ? t(`code.${failure.code}`).replace("{limit}", String(failure.params?.limit ?? "")).replace("{recovery}", String(failure.params?.recovery ?? "")) : t("error");
		const icon = (d, extra) => h("svg", {
			viewBox: "0 0 16 16",
			width: 16,
			height: 16,
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": true,
			className: "waycraft-skills-ico",
			...extra
		}, h("path", { d }));
		const ICONS = {
			refresh: "M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3",
			plus: "M8 3v10M3 8h10",
			filePlus: "M4 2h5l3 3v9H4zM9 2v3h3M8 8v4M6 10h4",
			folderPlus: "M2 4.5h4l1.5 1.5H14v7H2zM8 8v3M6.5 9.5h3",
			pencil: "M3 13l.5-3L10.5 3l2.5 2.5L6 12.5zM9 4.5L11.5 7",
			importIcon: "M8 2v8M5 7l3 3 3-3M3 13h10",
			folder: "M2 4.5h4l1.5 1.5H14v7H2z",
			global: "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM2 8h12M8 2c2.5 2.5 2.5 9.5 0 12M8 2c-2.5 2.5-2.5 9.5 0 12",
			search: "M7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10 10l3.5 3.5",
			trash: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 9h6l.5-9",
			more: "M3.5 8h.01M8 8h.01M12.5 8h.01",
			file: "M4 2h5l3 3v9H4zM9 2v3h3M6 9h4M6 11.5h4",
			download: "M8 2v8M5 7l3 3 3-3M3 13h10",
			check: "M3 8.5l3.5 3.5L13 4.5",
			star: "M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4 4.4 13.3l.7-4L2.2 6.5l4-.6z"
		};
		const CATALOG_CAP = 100;
		const discoverRow = (p) => h(p.tag ?? "li", {
			key: p.key,
			className: "waycraft-skills-row waycraft-skills-listrow waycraft-skills-discover-row",
			...p.attrs
		}, h("div", { className: "waycraft-skills-row-main" }, h("span", { className: "waycraft-skills-row-title" }, h("strong", null, p.name), ...p.badges ?? []), p.description ? h("p", { className: "waycraft-skills-row-desc" }, p.description) : null, p.meta?.length ? h("div", { className: "waycraft-skills-meta-line" }, ...p.meta) : null, ...p.notes ?? []), h("span", { className: "waycraft-skills-row-actions" }, p.details ? h("button", {
			type: "button",
			className: "waycraft-skills-icon-btn",
			"aria-label": p.details.label,
			title: p.details.label.split(":")[0],
			onClick: p.details.onClick
		}, icon(ICONS.file)) : null, p.install ? h("button", {
			type: "button",
			className: "waycraft-skills-install",
			"aria-label": p.install.aria,
			title: p.install.title ?? p.install.aria.split(":")[0],
			...p.install.haspopup ? { "aria-haspopup": "dialog" } : {},
			disabled: p.install.disabled,
			onClick: p.install.onClick
		}, icon(ICONS.download), h("span", null, p.install.label)) : null), ...p.after ?? []);
		const statPill = (iconPath, value, words) => h("span", {
			className: "waycraft-skills-stat-pill",
			title: `${value} ${words}`
		}, icon(iconPath), h("span", null, value), h("span", { className: "waycraft-skills-sr" }, ` ${words}`));
		/** Body portal target; null without a DOM (unit tests), where overlays render inline. */
		const portalTarget = () => {
			try {
				const body = document.body;
				return body ? {
					body,
					dom: require("react-dom")
				} : null;
			} catch {
				return null;
			}
		};
		/** On/off switch. Always our own role=switch button: the host's native Switch could not be verified to
		*  render correctly inside plugin-scoped styles (it depends on host CSS-module scope), so it is not used. */
		const switchControl = (p) => h("button", {
			type: "button",
			role: "switch",
			"aria-checked": p.checked,
			className: `waycraft-skills-switch${p.bare ? " waycraft-skills-switch-bare" : ""}`,
			disabled: p.disabled,
			"aria-label": p.label,
			title: p.title,
			onClick: p.onToggle
		}, h("span", {
			className: "waycraft-skills-switch-thumb",
			"aria-hidden": true
		}), p.text);
		const FOCUSABLE = "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex=\"-1\"])";
		function CatalogDialog(props) {
			const ref = React.useRef(null);
			React.useEffect(() => {
				const previous = document.activeElement;
				(ref.current?.querySelector?.(".waycraft-skills-dialog-body input:not([type=file]):not([type=checkbox]):not([disabled]),.waycraft-skills-dialog-body textarea:not([disabled]),.waycraft-skills-dialog-body select:not([disabled])") ?? ref.current)?.focus?.();
				return () => previous?.focus?.();
			}, []);
			const parts = React.Children.toArray(props.children);
			const lead = parts[0];
			const heading = lead && (lead.type === "h3" || lead.type === "h4") ? lead : null;
			const rest = heading ? parts.slice(1) : parts;
			const isButton = (x) => x?.type === "button";
			const strong = (x) => /waycraft-skills-(primary|danger)/.test(String(x.props?.className ?? ""));
			const actions$2 = rest.filter(isButton).sort((a, b) => Number(strong(a)) - Number(strong(b)));
			const body = rest.filter((x) => !isButton(x));
			const footer = actions$2.length ? [h("div", { className: "waycraft-skills-dialog-footer" }, ...actions$2)] : [];
			const title = heading ? heading.props.children : props.title ?? props.label;
			const dialog = h("div", {
				role: "dialog",
				className: "waycraft-skills-dialog",
				style: { "--waycraft-skills-w": `${{
					sm: 400,
					md: 520,
					lg: 600,
					xl: 760
				}[props.size ?? (props.wide ? "xl" : "lg")]}px` },
				"aria-modal": true,
				"aria-label": props.label,
				dir: isArabic() ? "rtl" : void 0,
				ref,
				tabIndex: -1,
				onKeyDown: (event) => {
					if (event.key === "Escape") {
						event.stopPropagation?.();
						props.onClose();
						return;
					}
					if (event.key === "Enter" && event.target?.tagName === "INPUT" && ![
						"file",
						"checkbox",
						"button"
					].includes(event.target.type)) {
						const primary = ref.current?.querySelector?.(".waycraft-skills-dialog-footer .waycraft-skills-primary:not([disabled]),.waycraft-skills-dialog-footer .waycraft-skills-danger:not([disabled])");
						if (primary) {
							event.preventDefault?.();
							primary.click();
						}
						return;
					}
					if (event.key !== "Tab") return;
					const items = Array.from(ref.current?.querySelectorAll?.(FOCUSABLE) ?? []);
					if (!items.length) return;
					const first = items[0];
					const last = items[items.length - 1];
					const active = document.activeElement;
					if (event.shiftKey && (active === first || active === ref.current)) {
						event.preventDefault?.();
						last.focus();
					} else if (!event.shiftKey && active === last) {
						event.preventDefault?.();
						first.focus();
					}
				}
			}, h("div", { className: "waycraft-skills-dialog-head" }, h("h3", null, title), h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn waycraft-skills-dialog-x",
				"aria-label": t("close"),
				title: t("close"),
				onClick: props.onClose
			}, h("svg", {
				viewBox: "0 0 16 16",
				width: 16,
				height: 16,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				"aria-hidden": true
			}, h("path", { d: "M4 4l8 8M12 4l-8 8" })))), h("div", { className: "waycraft-skills-dialog-body" }, ...body), ...footer);
			const host = portalTarget();
			return host ? host.dom.createPortal(h("div", {
				className: "waycraft-skills waycraft-skills-overlay",
				dir: isArabic() ? "rtl" : void 0
			}, dialog), host.body) : dialog;
		}
		/** Row action menu: an anchored popover (never pushes layout) that flips, stays in the viewport,
		*  closes after an action, on Escape and outside press, and returns focus to its trigger. */
		function MoreMenu(props) {
			const trigger = React.useRef(null);
			const menu = React.useRef(null);
			const [open, setOpen] = React.useState(false);
			const [pos, setPos] = React.useState(null);
			const close = (focus) => {
				setOpen(false);
				setPos(null);
				if (focus) trigger.current?.focus?.();
			};
			React.useEffect(() => {
				if (!open) return void 0;
				const place = () => {
					const rect = trigger.current?.getBoundingClientRect?.();
					const box = menu.current;
					if (!rect || !box) return;
					const root = document.documentElement;
					const vh = globalThis.innerHeight || root?.clientHeight || 0;
					const vw = globalThis.innerWidth || root?.clientWidth || 0;
					const mh = box.offsetHeight || 0;
					const mw = box.offsetWidth || 0;
					let top = rect.bottom + 4;
					if (top + mh > vh - 8 && rect.top - 4 - mh >= 8) top = rect.top - 4 - mh;
					top = Math.max(8, Math.min(top, vh - mh - 8));
					let left = isArabic() ? rect.left : rect.right - mw;
					left = Math.max(8, Math.min(left, vw - mw - 8));
					setPos((old) => old && old.top === top && old.left === left ? old : {
						top,
						left
					});
				};
				place();
				const items = Array.from(menu.current?.querySelectorAll?.("button") ?? []);
				for (const item of items) item.setAttribute?.("role", "menuitem");
				(items.find((item) => !item.disabled) ?? menu.current?.querySelector?.(FOCUSABLE))?.focus?.();
				const away = (event) => {
					if (!trigger.current?.contains?.(event.target) && !menu.current?.contains?.(event.target)) close(false);
				};
				document.addEventListener?.("pointerdown", away, true);
				document.addEventListener?.("scroll", place, true);
				globalThis.addEventListener?.("resize", place);
				return () => {
					document.removeEventListener?.("pointerdown", away, true);
					document.removeEventListener?.("scroll", place, true);
					globalThis.removeEventListener?.("resize", place);
				};
			}, [open]);
			const host = portalTarget();
			const list = open || !host ? h("div", {
				ref: menu,
				role: "menu",
				hidden: !open,
				className: "waycraft-skills-menu",
				dir: isArabic() ? "rtl" : void 0,
				onClick: (event) => {
					if (event.target?.closest?.("button")) close(true);
				},
				onChange: () => close(true),
				onBlur: (event) => {
					const next = event.relatedTarget;
					if (next && !menu.current?.contains?.(next) && !trigger.current?.contains?.(next)) close(false);
				},
				onKeyDown: (event) => {
					if (event.key === "Escape") {
						event.stopPropagation?.();
						close(true);
					} else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
						const items = Array.from(menu.current?.querySelectorAll?.(FOCUSABLE) ?? []);
						const next = items[(items.indexOf(document.activeElement) + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
						if (next) {
							event.preventDefault?.();
							next.focus();
						}
					}
				}
			}, props.children) : null;
			return h(React.Fragment, null, h("button", {
				type: "button",
				ref: trigger,
				className: "waycraft-skills-icon-btn",
				"aria-label": props.label,
				title: props.title,
				"aria-haspopup": "menu",
				"aria-expanded": open,
				onClick: () => open ? close(false) : setOpen(true),
				onKeyDown: (event) => {
					if (event.key === "Escape" && open) {
						event.stopPropagation?.();
						close(true);
					} else if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
						event.preventDefault?.();
						setOpen(true);
					}
				}
			}, props.trigger), list && host ? host.dom.createPortal(h("div", {
				className: "waycraft-skills waycraft-skills-pop",
				style: {
					top: pos?.top ?? 0,
					left: pos?.left ?? 0,
					visibility: pos ? "visible" : "hidden"
				}
			}, list), host.body) : list);
		}
		function CatalogPanel(props) {
			const { kind, data, setData, setNotice } = props;
			const [typed, setTyped] = React.useState(""), [committed, setCommitted] = React.useState(""), [items, setItems] = React.useState([]), [cursor, setCursor] = React.useState(null), [phase, setPhase] = React.useState("loading"), [more, setMore] = React.useState(false), [attempt, setAttempt] = React.useState(0), [sort, setSort] = React.useState("downloads"), [status, setStatus] = React.useState(""), [detail, setDetail] = React.useState(null), [copy, setCopy] = React.useState(""), [installing, setInstalling] = React.useState(null), [target, setTarget] = React.useState("user-dsh"), [conflict, setConflict] = React.useState(false), [confirming, setConfirming] = React.useState(null), [working, setWorking] = React.useState(""), [message, setMessage] = React.useState("");
			const request = React.useRef(null);
			React.useEffect(() => {
				if (data && !validDestination(data, target)) setTarget("user-dsh");
			}, [data]);
			const sending = React.useRef(false);
			const searching = committed !== "";
			const recordsOf = (item) => (data?.catalogInstalls ?? []).filter((entry) => entry.catalogId === item.id);
			const copiesOf = (item) => recordsOf(item).filter((entry) => entry.status === "installed" || entry.status === "modified");
			const bodyFor = (item) => item.catalog === "clawhub" ? {
				catalog: "clawhub",
				owner: item.owner,
				slug: item.slug
			} : {
				catalog: "skillsh",
				source: item.source,
				skillId: item.skillId
			};
			const load = (after) => {
				request.current?.abort();
				const current = request.current = new AbortController();
				if (after) setMore(true);
				else {
					setPhase("loading");
					setItems([]);
					setCursor(null);
				}
				return call(kind === "skillsh" ? {
					action: "catalog-skillsh-search",
					q: committed
				} : searching ? {
					action: "catalog-clawhub-search",
					q: committed
				} : {
					action: "catalog-clawhub-list",
					...after ? { cursor: after } : {}
				}, current.signal).then((value) => {
					if (request.current !== current) return;
					setItems((all) => after ? [...all, ...value.items].slice(0, CATALOG_CAP) : value.items);
					setCursor(value.nextCursor ?? null);
					setPhase("ready");
					setMore(false);
				}).catch((failure) => {
					if (failure?.name === "AbortError" || request.current !== current) return;
					setPhase("error");
					setMore(false);
				});
			};
			React.useEffect(() => {
				if (kind === "skillsh" && !committed) {
					request.current?.abort();
					setItems([]);
					setPhase("idle");
					return;
				}
				load();
				return () => request.current?.abort();
			}, [
				kind,
				committed,
				attempt
			]);
			React.useEffect(() => {
				const handle = setTimeout(() => setCommitted(typed.trim()), 300);
				return () => clearTimeout(handle);
			}, [typed]);
			const shown = items.filter((item) => {
				const copies = copiesOf(item).length;
				return !status || (status === "installed" ? copies > 0 : copies === 0);
			}).slice().sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "installs" ? (b.installs ?? 0) - (a.installs ?? 0) : 0);
			const send = async (busyKey, body, done) => {
				if (working || sending.current) return;
				sending.current = true;
				setWorking(busyKey);
				setNotice("");
				setMessage("");
				try {
					const value = await call(body);
					setData(value);
					done?.(value);
				} catch (failure) {
					setNotice(errorText(failure));
					if (failure?.code === "repo-conflict") setConflict(true);
				} finally {
					sending.current = false;
					setWorking("");
				}
			};
			const openDetail = async (item) => {
				setCopy("");
				setDetail({
					item,
					loading: true
				});
				try {
					setDetail({
						item,
						value: await call({
							action: "catalog-detail",
							skill: bodyFor(item)
						})
					});
				} catch (failure) {
					setDetail(null);
					setNotice(errorText(failure));
				}
			};
			const confirmInstall = (reassociate) => send(`install:${installing.id}`, {
				action: "catalog-install",
				skill: bodyFor(installing),
				destination: target,
				...projectOfDest(target) ? { project: projectOfDest(target) } : {},
				confirm: true,
				...reassociate ? { reassociate: true } : {}
			}, () => {
				setInstalling(null);
				setConflict(false);
				setMessage(t("catInstallDone"));
			});
			const num = (n) => Number(n).toLocaleString("en-US");
			const metadata = (item) => [
				h("bdi", {
					key: "origin",
					dir: "ltr",
					className: "waycraft-skills-origin"
				}, item.catalog === "clawhub" ? `${item.owner}/${item.slug}` : `${item.source}/${item.skillId}`),
				item.downloads !== void 0 ? statPill(ICONS.download, num(item.downloads), t("catDownloads")) : null,
				item.installs !== void 0 ? statPill(ICONS.check, num(item.installs), t("catInstalls")) : null,
				item.stars !== void 0 ? statPill(ICONS.star, num(item.stars), t("catStars")) : null
			].filter(Boolean);
			const shared = (entry) => entry.source === "user-agents";
			const confirmAction = () => send(`${confirming.action}:${confirming.entry.id}`, {
				action: confirming.action === "uninstall" ? "catalog-uninstall" : "catalog-forget",
				installId: confirming.entry.id,
				...confirming.entry.project ? { project: confirming.entry.project } : {}
			}, () => setConfirming(null));
			return h("div", {
				"data-waycraft-catalogs": true,
				className: "waycraft-skills-panel"
			}, h("div", { className: "waycraft-skills-filterrow" }, kind === "clawhub" && !searching ? h("select", {
				"aria-label": t("catSort"),
				value: sort,
				onChange: (event) => setSort(event.target.value)
			}, h("option", { value: "downloads" }, t("catSortDownloads")), h("option", { value: "installs" }, t("catSortInstalls")), h("option", { value: "name" }, t("catSortName"))) : null, !searching || kind === "skillsh" ? h("select", {
				"aria-label": t("catStatusFilter"),
				value: status,
				onChange: (event) => setStatus(event.target.value)
			}, h("option", { value: "" }, t("catStatusAll")), h("option", { value: "available" }, t("catStatusAvailable")), h("option", { value: "installed" }, t("catStatusInstalled"))) : null, h("form", {
				className: "waycraft-skills-searchform",
				onSubmit: (event) => {
					event.preventDefault();
					setCommitted(typed.trim());
					setAttempt((n) => n + 1);
				}
			}, h("input", {
				"aria-label": kind === "clawhub" ? t("catSearchClawhub") : t("catSearchSkillsh"),
				placeholder: kind === "clawhub" ? t("catSearchClawhub") : t("catSearchSkillsh"),
				maxLength: 100,
				value: typed,
				onChange: (event) => setTyped(event.target.value)
			}), h("button", {
				type: "submit",
				className: "waycraft-skills-icon-btn",
				"aria-label": t("catSearch"),
				title: t("catSearch")
			}, icon(ICONS.search)))), kind === "clawhub" && !searching ? h("p", { className: "waycraft-skills-caption" }, t("catPopularNote")) : null, kind === "skillsh" && !searching ? h("p", { className: "waycraft-skills-caption" }, t("catSkillshHint")) : null, message ? h("p", { role: "status" }, message) : null, phase === "loading" ? h("p", { role: "status" }, t("catLoading")) : null, phase === "error" ? h("div", { role: "alert" }, h("p", null, t("catLoadError")), h("button", { onClick: () => setAttempt((n) => n + 1) }, t("catRetry"))) : null, phase === "ready" && !shown.length ? h("p", null, searching ? t("catSearchEmpty") : t("catEmpty")) : null, h("ul", { className: "waycraft-skills-list" }, ...shown.map((item) => {
				const copies = copiesOf(item);
				return discoverRow({
					key: item.id,
					attrs: { "data-waycraft-catalog-item": item.id },
					name: item.name,
					badges: copies.length ? [h("span", {
						key: "installed",
						className: "waycraft-skills-badge"
					}, t("catInstalled"))] : [],
					description: item.summary,
					meta: metadata(item),
					notes: !copies.length && recordsOf(item).length ? [h("p", {
						key: "hint",
						role: "note",
						className: "waycraft-skills-meta"
					}, t(`catHint.${recordsOf(item)[0].status}`))] : [],
					details: {
						label: `${t("catDetails")}: ${item.name}`,
						onClick: () => void openDetail(item)
					},
					install: {
						aria: `${copies.length ? t("catInstallElsewhere") : t("catInstall")}: ${item.name}`,
						label: t("repoInstall"),
						title: copies.length ? t("catInstallElsewhere") : t("catInstall"),
						disabled: !!working,
						onClick: () => {
							setInstalling(item);
							setConflict(false);
							setTarget("user-dsh");
						}
					},
					after: [recordsOf(item).length ? h("ul", { "aria-label": `${t("catCopies")}: ${item.name}` }, ...recordsOf(item).map((entry) => h("li", {
						key: entry.id,
						"data-waycraft-catalog-copy": entry.id
					}, placeNode(data, entry), " · ", h("bdi", { dir: "ltr" }, `${entry.root}/${entry.name}`), ` · ${t(`catStatus.${entry.status}`)}`, entry.status === "invalid-root" || entry.status === "missing" ? h("button", {
						className: "waycraft-skills-danger",
						"aria-label": `${t("catForget")}: ${item.name} — ${placeName(data, entry)}`,
						disabled: !!working,
						onClick: () => setConfirming({
							action: "forget",
							entry,
							item
						})
					}, t("catForget")) : entry.status === "trashed" ? null : h("button", {
						className: "waycraft-skills-danger",
						"aria-label": `${t("catUninstall")}: ${item.name} — ${placeName(data, entry)}`,
						disabled: !!working,
						onClick: () => setConfirming({
							action: "uninstall",
							entry,
							item
						})
					}, t("catUninstall"))))) : null]
				});
			})), kind === "clawhub" && !searching && cursor && items.length < CATALOG_CAP ? h("button", {
				disabled: more,
				"aria-live": "polite",
				"aria-busy": more,
				onClick: () => void load(cursor)
			}, more ? t("catLoadingMore") : t("catLoadMore")) : null, detail ? h(CatalogDialog, {
				label: t("catDetails"),
				onClose: () => setDetail(null)
			}, h("h4", null, detail.item.name), detail.loading ? h("p", { role: "status" }, t("catDetailLoading")) : h("div", null, h("p", null, detail.value.description), h("p", null, `${t("catOrigin")}: `, h("bdi", { dir: "ltr" }, detail.value.origin)), h("textarea", {
				readOnly: true,
				"aria-label": "SKILL.md",
				value: detail.value.body
			}), h("button", { onClick: () => copyText(detail.value.body).then(() => setCopy(t("catCopied")), () => setCopy(t("catCopyFailed"))) }, t("catCopy")), copy ? h("span", { role: "status" }, copy) : null), h("button", {
				className: "waycraft-skills-primary",
				onClick: () => setDetail(null)
			}, t("catClose"))) : null, installing ? h(CatalogDialog, {
				label: t("catInstallTitle"),
				onClose: () => setInstalling(null)
			}, h("h4", null, `${t("catInstallTitle")}: ${installing.name}`), h("p", { className: "waycraft-skills-meta-line" }, ...metadata(installing)), h("select", {
				"aria-label": t("repoDestination"),
				value: target,
				onChange: (event) => setTarget(event.target.value)
			}, ...destinationsOf(data).map((item) => destinationOption(item))), ...destinationInfo(data, validDestination(data, target)), h("button", {
				className: "waycraft-skills-primary",
				disabled: !!working || !validDestination(data, target),
				onClick: () => void confirmInstall(false)
			}, t("catInstallConfirm")), conflict ? h("button", {
				disabled: !!working || !validDestination(data, target),
				onClick: () => void confirmInstall(true)
			}, t("catReassociate")) : null, h("button", { onClick: () => setInstalling(null) }, t("cancel"))) : null, confirming ? h(CatalogDialog, {
				label: confirming.action === "uninstall" ? t("catUninstallTitle") : t("catForgetTitle"),
				onClose: () => setConfirming(null)
			}, h("h4", null, confirming.action === "uninstall" ? t("catUninstallTitle") : t("catForgetTitle")), h("p", null, ...(confirming.action === "uninstall" ? t("catUninstallBody") : t("catForgetBody")).replace("{name}", confirming.item.name).split("{where}").flatMap((part, index) => index ? [
				placeNode(data, confirming.entry),
				" (",
				h("bdi", { dir: "ltr" }, `${confirming.entry.root}/${confirming.entry.name}`),
				")",
				part
			] : [part])), confirming.action === "uninstall" && shared(confirming.entry) ? h("p", { role: "alert" }, t("catSharedWarning")) : null, h("button", {
				disabled: !!working,
				onClick: () => void confirmAction()
			}, confirming.action === "uninstall" ? t("catConfirmUninstall") : t("catConfirmForget")), h("button", { onClick: () => setConfirming(null) }, t("cancel"))) : null);
		}
		function Section() {
			const [data, setData] = React.useState(null), [error, setError] = React.useState(false), [query, setQuery] = React.useState(""), [source, setSource] = React.useState(""), [status, setStatus] = React.useState(""), [detail, setDetail] = React.useState(null), [detailError, setDetailError] = React.useState(false), [copiedDetail, setCopiedDetail] = React.useState(false), [scope, setScope] = React.useState("global"), [tab, setTab] = React.useState("git"), [project, setProject] = React.useState(""), [folderPath, setFolderPath] = React.useState(""), [candidates, setCandidates] = React.useState(null), [editing, setEditing] = React.useState(null), [removing, setRemoving] = React.useState(""), [rootEdit, setRootEdit] = React.useState(null), [pendingScan, setPendingScan] = React.useState(false), [loaded, setLoaded] = React.useState(""), [notice, setNotice] = React.useState(""), [managing, setManaging] = React.useState(false), [addOpen, setAddOpen] = React.useState(false), [catDialog, setCatDialog] = React.useState(null), [addTo, setAddTo] = React.useState(null), [addPick, setAddPick] = React.useState([]), [addQuery, setAddQuery] = React.useState(""), [catName, setCatName] = React.useState({}), [catEdit, setCatEdit] = React.useState(null), [catRemoving, setCatRemoving] = React.useState(""), [catFilter, setCatFilter] = React.useState(""), [noteDrafts, setNoteDrafts] = React.useState({}), [noteDialog, setNoteDialog] = React.useState(null), [orgOpen, setOrgOpen] = React.useState({}), [rowsOpen, setRowsOpen] = React.useState({}), [importing, setImporting] = React.useState(false), [importPath, setImportPath] = React.useState(""), [importFiles, setImportFiles] = React.useState([]), [importConflict, setImportConflict] = React.useState(""), [importResult, setImportResult] = React.useState(null), [importBusy, setImportBusy] = React.useState(false), [importDrag, setImportDrag] = React.useState(false), [importMsg, setImportMsg] = React.useState(""), [trashDeleting, setTrashDeleting] = React.useState(""), [repoFormOpen, setRepoFormOpen] = React.useState(false), dragRef = React.useRef(null), copiedTimer = React.useRef(null), [repoInstalling, setRepoInstalling] = React.useState(""), [repoForm, setRepoForm] = React.useState({
				url: "",
				ref: "",
				subdirectory: ""
			}), [repoFilter, setRepoFilter] = React.useState(""), [repoStatusFilter, setRepoStatusFilter] = React.useState(""), [repoRepoFilter, setRepoRepoFilter] = React.useState(""), [repoUnsubscribing, setRepoUnsubscribing] = React.useState(""), [repoForgetting, setRepoForgetting] = React.useState(""), [repoTarget, setRepoTarget] = React.useState("user-dsh"), [repoBusy, setRepoBusy] = React.useState(""), [repoSummary, setRepoSummary] = React.useState(""), [repoPreviews, setRepoPreviews] = React.useState({}), [repoOverwrites, setRepoOverwrites] = React.useState({}), [refreshing, setRefreshing] = React.useState(false), [creating, setCreating] = React.useState(false), [createName, setCreateName] = React.useState(""), [createDescription, setCreateDescription] = React.useState(""), [createBody, setCreateBody] = React.useState(""), [createSource, setCreateSource] = React.useState("user-dsh");
			React.useEffect(() => {
				if (!creating && !importing) return;
				setCreateSource((prev) => scope === "project" && project ? `${PROJECT_DEST}${project}` : projectOfDest(prev) !== void 0 ? "user-dsh" : prev);
			}, [
				creating,
				importing,
				scope,
				project
			]);
			const fileInput = React.useRef(null);
			const dirInput = React.useRef(null);
			React.useEffect(() => () => {
				if (copiedTimer.current) clearTimeout(copiedTimer.current);
			}, []);
			const repoDestination = validDestination(data, repoTarget);
			React.useEffect(() => {
				if (data && !validDestination(data, repoTarget)) setRepoTarget("user-dsh");
			}, [data]);
			const lifetime = React.useRef(new AbortController());
			const busy = React.useRef(false);
			const controller = React.useRef(null);
			const selected = scope === "project" && project ? { project } : {};
			const key = scope === "project" && project ? project : "";
			const keyRef = React.useRef(key);
			keyRef.current = key;
			const switching = loaded !== key;
			const load = () => {
				const requested = key;
				controller.current?.abort();
				const current = controller.current = new AbortController();
				setError(false);
				return call({
					action: "list",
					...selected
				}, current.signal).then((value) => {
					if (keyRef.current !== requested) return;
					setData(value);
					setLoaded(requested);
				}).catch((error$1) => {
					if (error$1.name !== "AbortError" && keyRef.current === requested) setError(true);
				});
			};
			React.useEffect(() => () => {
				controller.current?.abort();
				lifetime.current.abort();
			}, []);
			React.useEffect(() => {
				setNotice("");
				setCandidates(null);
				setCatFilter("");
				setNoteDrafts({});
				setCatEdit(null);
				setCatRemoving("");
				load();
			}, [scope, project]);
			React.useEffect(() => {
				setCatFilter("");
			}, [source]);
			const toggle = async (kind, id, enabled) => {
				if (busy.current || switching || lifetime.current.signal.aborted) return;
				busy.current = true;
				try {
					const requested = key;
					await call({
						action: "toggle",
						kind,
						id,
						enabled,
						...selected
					}, lifetime.current.signal);
					if (!lifetime.current.signal.aborted && keyRef.current === requested) await load();
				} catch {
					if (!lifetime.current.signal.aborted && keyRef.current === key) setError(true);
				} finally {
					busy.current = false;
				}
			};
			const mutate = async (body, done) => {
				if (busy.current || lifetime.current.signal.aborted) return;
				busy.current = true;
				setNotice("");
				const requested = key;
				try {
					const value = await call(body, lifetime.current.signal);
					if (lifetime.current.signal.aborted || keyRef.current !== requested) return;
					setData(value);
					setError(false);
					done?.(value);
				} catch (failure) {
					if (!lifetime.current.signal.aborted && keyRef.current === requested) setNotice(errorText(failure));
				} finally {
					busy.current = false;
				}
			};
			const repoAction = async (busyKey, body, done) => {
				if (repoBusy || busy.current) return;
				setRepoBusy(busyKey);
				setRepoSummary("");
				try {
					await mutate(body, done);
				} finally {
					setRepoBusy("");
				}
			};
			const repoWarning = (value) => {
				const result = value?.result;
				const lines = [];
				if (result?.warning) lines.push(`${t(`code.${result.warning}`)} ${result.path ?? ""}`.trim());
				for (const item of result?.warnings ?? []) lines.push(`${item.name}: ${t(`code.${item.code}`)} ${(item.recovery ?? []).join(" ")}`.trim());
				if (lines.length) setNotice(lines.join(" · "));
			};
			const repoPreview = (record, kind) => void repoAction(record.id, {
				action: `repo-${kind}-preview`,
				installId: record.id,
				...record.project ? { project: record.project } : {}
			}, (value) => {
				setRepoPreviews((all) => ({
					...all,
					[record.id]: {
						kind,
						...value.result
					}
				}));
				setRepoOverwrites((all) => ({
					...all,
					[record.id]: false
				}));
			});
			const repoApply = (record) => {
				const preview = repoPreviews[record.id];
				if (!preview) return;
				const clear = () => setRepoPreviews(({ [record.id]: _gone,...rest }) => rest);
				repoAction(`apply:${record.id}`, {
					action: `repo-${preview.kind}`,
					installId: record.id,
					current: preview.current,
					target: preview.target.digest,
					snapshot: preview.snapshot,
					overwrite: !!repoOverwrites[record.id],
					...record.project ? { project: record.project } : {}
				}, (value) => {
					clear();
					setNotice(t(preview.kind === "update" ? "repoUpdated" : "repoRolledBack").replace("{name}", record.name));
					repoWarning(value);
				});
			};
			const MAX_DROP = 600;
			const readAll = (reader) => new Promise((resolve, reject) => {
				const out = [];
				const next = () => reader.readEntries((batch) => {
					if (!batch.length) return resolve(out);
					out.push(...batch);
					next();
				}, reject);
				next();
			});
			const entryFiles = async (entry, out) => {
				if (out.length > MAX_DROP) return;
				if (entry.isFile) {
					const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
					out.push({
						name: file.name,
						size: file.size,
						webkitRelativePath: String(entry.fullPath ?? file.name).replace(/^\/+/, ""),
						arrayBuffer: () => file.arrayBuffer()
					});
				} else if (entry.isDirectory) for (const child of await readAll(entry.createReader())) await entryFiles(child, out);
			};
			const dropItems = async (transfer) => {
				setImportDrag(false);
				const taken = Array.from(transfer?.items ?? []).filter((item) => item.kind !== "string").map((item) => ({
					entry: item.webkitGetAsEntry?.() ?? void 0,
					file: item.getAsFile?.() ?? void 0
				}));
				if (!taken.length) for (const file of Array.from(transfer?.files ?? [])) taken.push({ file });
				const out = [];
				let skipped = 0;
				try {
					for (const item of taken) if (item.entry?.isDirectory) await entryFiles(item.entry, out);
					else {
						const name = String(item.entry?.name ?? item.file?.name ?? "");
						if (!/\.(zip|md)$/i.test(name)) {
							skipped++;
							continue;
						}
						if (item.entry) await entryFiles(item.entry, out);
						else out.push(item.file);
					}
				} catch {
					setImportMsg(t("importDropFailed"));
					return;
				}
				setImportPath("");
				setImportResult(null);
				setImportFiles(out);
				setImportMsg(skipped ? t("importDropUnsupported") : "");
			};
			const runImport = async (dryRun) => {
				if (busy.current || switching || importBusy || !importConflict) return;
				setImportBusy(true);
				const requested = key;
				try {
					const body = {
						action: "import",
						path: importPath,
						dryRun,
						conflict: importConflict,
						...destRequest()
					};
					if (!dryRun && importFiles.length) {
						body.action = "upload";
						if (importFiles.length > 512 || importFiles.reduce((sum, file) => sum + file.size, 0) > 1048576) throw new Error(t("code.import-limit"));
						const entries = [];
						for (const file of importFiles) {
							if (lifetime.current.signal.aborted) return;
							const bytes = new Uint8Array(await file.arrayBuffer());
							let binary = "";
							for (const byte of bytes) binary += String.fromCharCode(byte);
							entries.push({
								path: file.webkitRelativePath || file.name,
								data: btoa(binary)
							});
						}
						body.archives = entries.filter((entry) => !entry.path.includes("/") && /\.zip$/i.test(entry.path));
						body.entries = entries.filter((entry) => entry.path.includes("/") || !/\.zip$/i.test(entry.path));
					}
					await destMutate(body, (value) => setImportResult(value.result));
				} catch (error$1) {
					if (keyRef.current === requested) setNotice(error$1.message);
				} finally {
					setImportBusy(false);
				}
			};
			const addFolders = (items) => mutate({
				action: "custom-add",
				items
			}, (value) => {
				const result = value.results?.[0];
				setCandidates(null);
				setNotice(result?.status === "rejected" ? errorText(result) : result?.status === "registered" ? t("registered") : t("added"));
			});
			const scanFolder = async () => {
				if (pendingScan) return;
				setPendingScan(true);
				setNotice("");
				const requested = key;
				try {
					const found = await call({
						action: "custom-scan",
						path: folderPath
					}, lifetime.current.signal);
					if (!lifetime.current.signal.aborted && keyRef.current === requested) setCandidates(found.candidates);
				} catch (failure) {
					if (!lifetime.current.signal.aborted && keyRef.current === requested) {
						setCandidates(null);
						setNotice(errorText(failure));
					}
				} finally {
					setPendingScan(false);
				}
			};
			const copyStatus = (copy) => copy.metadataValid === false || !copy.policyValid ? "invalid" : !copy.eligible ? "disabled" : copy.shadowedBy ? "shadowed" : copy.author && !copy.author.modelInvocable && !copy.author.userInvocable ? "blocked" : "enabled";
			const inProject = scope === "project";
			const view = scope === "trash" || scope === "discover" ? {
				sources: [],
				copies: [],
				diagnostics: []
			} : inProject ? data?.project ?? {
				sources: [],
				copies: [],
				diagnostics: []
			} : data;
			const visibleSources = (view?.sources ?? []).filter((x) => x.id === "user-dsh" || x.id === "user-agents" || x.kind === "dsh" || x.custom || (view?.copies ?? []).some((c) => c.source === x.id) || (view?.diagnostics ?? []).some((d) => d.params?.source === x.id && !isAbsentDefault(d, view?.sources ?? [], view?.diagnostics ?? [])));
			const totals = {
				total: 0,
				enabled: 0,
				disabled: 0,
				invalid: 0
			};
			for (const copy of view?.copies ?? []) {
				const state = copyStatus(copy);
				totals.total++;
				if (state === "enabled") totals.enabled++;
				else if (state === "disabled") totals.disabled++;
				else if (state === "invalid") totals.invalid++;
			}
			const refresh = async () => {
				if (refreshing || switching || busy.current) return;
				setRefreshing(true);
				try {
					await mutate({
						action: "reload",
						...selected
					});
				} finally {
					setRefreshing(false);
				}
			};
			const stat = (count, one, other) => h("div", {
				key: other,
				className: "waycraft-skills-stat"
			}, h("strong", null, h("bdi", null, String(count))), " ", t(count === 1 ? one : other));
			const orgOf = (sourceId) => ({
				categories: [],
				members: {},
				notes: {},
				...view?.organization?.[sourceId] ?? {}
			});
			const filterCategories = source ? orgOf(source).categories : [];
			const activeCat = catFilter === "__none" || filterCategories.some((c) => c.id === catFilter) ? catFilter : "";
			const copies = React.useMemo(() => (view?.copies ?? []).filter((copy) => {
				const organization = orgOf(copy.source);
				return (!source || copy.source === source) && (!query || `${copy.name} ${copy.description} ${copy.path} ${organization.notes[copy.name] ?? ""} ${t(copyStatus(copy))} ${sourceLabel((view?.sources ?? []).find((x) => x.id === copy.source) ?? { id: copy.source })}`.toLowerCase().includes(query.toLowerCase())) && (!status || copyStatus(copy) === status) && (!activeCat || (activeCat === "__none" ? !organization.members[copy.name] : organization.members[copy.name] === activeCat));
			}), [
				view,
				query,
				source,
				status,
				activeCat,
				t
			]);
			const mineBySource = React.useMemo(() => {
				const map = Object.create(null);
				for (const copy of copies) (map[copy.source] ??= []).push(copy);
				return map;
			}, [copies]);
			const projects = data?.projects ?? [];
			const projectName = (id) => projects.find((x) => x.id === id)?.name ?? id;
			const destRequest = () => {
				const p = projectOfDest(createSource);
				return {
					source: createSource,
					...p ? { project: p } : {}
				};
			};
			const destMutate = async (body, done) => {
				if ((projectOfDest(createSource) ?? "") === key) return mutate(body, done);
				if (busy.current || lifetime.current.signal.aborted) return;
				busy.current = true;
				setNotice("");
				try {
					const value = await call(body, lifetime.current.signal);
					if (lifetime.current.signal.aborted) return;
					done?.(value);
					await load();
				} catch (failure) {
					if (!lifetime.current.signal.aborted) setNotice(errorText(failure));
				} finally {
					busy.current = false;
				}
			};
			/** Scope + Location selects, project hints and the resolved folder chip (path comes from the payload). */
			const destPick = () => {
				const list = destinationsOf(data);
				const isProject = projectOfDest(createSource) !== void 0;
				const users = list.filter((x) => !x.project);
				const projects$1 = list.filter((x) => x.project);
				const chosen = validDestination(data, createSource);
				const shown = isProject ? projects$1 : users;
				return [
					h("div", { className: "waycraft-skills-grid" }, labeled(t("destScope"), h("select", {
						"aria-label": t("destScope"),
						value: isProject ? "project" : "user",
						disabled: switching,
						onChange: (event) => setCreateSource(event.target.value === "project" ? projects$1.find((x) => !x.disabled)?.id ?? projects$1[0]?.id ?? PROJECT_DEST : users[0]?.id ?? "user-dsh")
					}, h("option", { value: "user" }, t("destScopeUser")), h("option", { value: "project" }, t("destScopeProject")))), labeled(t("destLocation"), h("select", {
						"aria-label": t("destination"),
						value: createSource,
						onChange: (event) => setCreateSource(event.target.value)
					}, ...shown.map((item) => destinationOption(item, item.id === "user-dsh" ? "DSH" : item.id === "user-agents" ? "Shared Agents" : item.label))))),
					isProject && !projects$1.length ? h("p", { className: "waycraft-skills-helper" }, t("destNoProjects")) : null,
					isProject && !chosen && projects$1.length ? h("p", { className: "waycraft-skills-helper" }, t("destInvalid")) : null,
					chosen?.path ? h("p", { className: "waycraft-skills-helper" }, `${t("pathChip")}: `, h("bdi", {
						dir: "ltr",
						className: "waycraft-skills-path"
					}, chosen.path)) : null,
					isProject && chosen ? h("p", { className: "waycraft-skills-helper" }, t("destProjectNote")) : null
				];
			};
			const projectOption = (x) => h("option", {
				key: x.id,
				value: x.id,
				disabled: !x.available
			}, x.available ? x.name : `${x.name} · ${t(`code.${x.code}`)}`);
			const field = (label, value, set) => h("input", {
				"aria-label": label,
				placeholder: label,
				value,
				onChange: (e) => set(e.target.value)
			});
			/** A field with a visible caption (dialog forms); the input keeps its aria-label. */
			const labeled = (caption, input) => h("label", { className: "waycraft-skills-labeled" }, h("span", null, caption), input);
			const organize = (body, done) => mutate({
				...body,
				...selected
			}, done);
			const skillNames = (sourceId) => [...new Set((view?.copies ?? []).filter((c) => c.source === sourceId && c.metadataValid !== false).map((c) => c.name))];
			const browse = (set, label) => pickDirectory ? h("button", {
				type: "button",
				"data-waycraft-browse": true,
				"aria-label": `${t("browseAria")}: ${label}`,
				onClick: () => void Promise.resolve().then(() => pickDirectory?.()).then((value) => {
					if (typeof value === "string" && value) set(value);
				}).catch(() => {})
			}, t("browse")) : null;
			const rootControls = (x) => !x.overridable ? null : h("div", { className: "waycraft-skills-inline" }, x.overridden ? h("span", {
				className: "waycraft-skills-badge",
				"data-waycraft-overridden": true
			}, t("folderRedirected"), " ", h("bdi", { dir: "ltr" }, x.defaultPath)) : null);
			const manager = () => h("div", { className: "waycraft-skills-form waycraft-skills-manager" }, h("div", { className: "waycraft-skills-pathrow" }, labeled(t("folderPath"), field(t("folderPath"), folderPath, setFolderPath)), browse(setFolderPath, t("folderPath"))), h("div", { className: "waycraft-skills-actions" }, h("button", {
				disabled: pendingScan,
				onClick: () => void scanFolder()
			}, t("scanFolder")), h("button", {
				className: "waycraft-skills-primary",
				disabled: !folderPath.trim(),
				onClick: () => void addFolders([{ path: folderPath }])
			}, t("addFolder"))), notice ? h("p", { role: "status" }, notice) : null, candidates ? h("div", null, h("h4", null, t("candidates")), candidates.length ? null : h("p", null, t("noCandidates")), ...candidates.map((c) => h("div", { key: c.path }, h("strong", null, c.label), h("p", null, h("bdi", { dir: "ltr" }, c.path), ` · ${c.skillCount} ${t("skillCount")}`), c.registered ? h("span", null, t("candidateRegistered")) : c.conflict ? h("span", null, t("candidateConflict")) : h("button", {
				className: "waycraft-skills-primary",
				"aria-label": `${t("addSourceNamed")}: ${c.label}`,
				onClick: () => void addFolders([{
					path: c.path,
					label: c.label,
					group: c.group
				}])
			}, t("addSource"))))) : null);
			const customControls = (x) => removing === x.id ? h(CatalogDialog, {
				label: `${t("confirmRemove")}: ${sourceLabel(x)}`,
				size: "sm",
				onClose: () => setRemoving("")
			}, h("p", null, t("removeNote")), h("button", {
				className: "waycraft-skills-danger",
				"aria-label": `${t("confirmNamed")}: ${x.label ?? x.id}`,
				onClick: () => void mutate({
					action: "custom-remove",
					id: x.id
				}, () => setRemoving(""))
			}, t("confirmRemove")), h("button", {
				"aria-label": `${t("cancel")}: ${x.label ?? x.id}`,
				onClick: () => setRemoving("")
			}, t("cancel"))) : h("div", null, h("span", null, t("customBadge")), h("button", {
				"aria-label": `${t("editNamed")}: ${x.label ?? x.id}`,
				onClick: () => setEditing({
					id: x.id,
					label: x.label ?? "",
					group: x.group ?? "",
					path: x.path
				})
			}, t("edit")), h("button", {
				className: "waycraft-skills-danger",
				"aria-label": `${t("removeNamed")}: ${x.label ?? x.id}`,
				onClick: () => setRemoving(x.id)
			}, t("remove")));
			const foldersOpen = !inProject && (managing || !!rootEdit || !!editing);
			const closeFolders = () => {
				setManaging(false);
				setRootEdit(null);
				setEditing(null);
				setAddOpen(false);
			};
			const foldersDialog = () => {
				const list = (data?.sources ?? []).filter((x) => x.custom || x.overridable);
				const picked = rootEdit?.id ?? editing?.id ?? "";
				const cur = list.find((x) => x.id === picked);
				const pick = (id) => {
					const x = list.find((y) => y.id === id);
					setRootEdit(null);
					setEditing(null);
					if (!x) return;
					if (x.custom) setEditing({
						id: x.id,
						label: x.label ?? "",
						group: x.group ?? "",
						path: x.path
					});
					else setRootEdit({
						id: x.id,
						path: x.path
					});
				};
				const rootDirty = cur && rootEdit ? String(rootEdit.path ?? "").trim() !== "" && rootEdit.path !== cur.path : false;
				const customDirty = cur && editing ? String(editing.path ?? "").trim() !== "" && (editing.path !== cur.path || editing.label !== (cur.label ?? "") || editing.group !== (cur.group ?? "")) : false;
				const name = cur ? sourceLabel(cur) : "";
				const customs = list.filter((x) => x.custom);
				return h(CatalogDialog, {
					label: t("folders"),
					size: "md",
					onClose: closeFolders
				}, h("h3", null, t("folders")), h("p", { className: "waycraft-skills-notice" }, t("folderHelp")), labeled(t("skillSource"), h("select", {
					"aria-label": t("skillSource"),
					value: picked,
					onChange: (event) => pick(event.target.value)
				}, h("option", { value: "" }, t("skillSourcePick")), ...list.map((x) => h("option", {
					key: x.id,
					value: x.id
				}, sourceLabel(x))))), cur && rootEdit ? h("div", { className: "waycraft-skills-form" }, h("div", {
					"data-waycraft-root-edit": cur.id,
					className: "waycraft-skills-pathrow"
				}, labeled(t("folderPath"), field(`${t("changeFolder")}: ${name}`, rootEdit.path, (v) => setRootEdit({
					...rootEdit,
					path: v
				}))), browse((v) => setRootEdit((prev) => prev ? {
					...prev,
					path: v
				} : prev), name)), h("p", { className: "waycraft-skills-helper" }, `${t("folderDefault")}: `, h("bdi", { dir: "ltr" }, cur.defaultPath ?? cur.path), cur.overridden ? h("button", {
					type: "button",
					className: "waycraft-skills-link",
					"aria-label": `${t("resetFolder")}: ${name}`,
					onClick: () => void mutate({
						action: "root-set",
						id: cur.id,
						path: ""
					}, () => setRootEdit(null))
				}, t("resetFolder")) : null), h("div", { className: "waycraft-skills-actions" }, h("button", {
					type: "button",
					"aria-label": `${t("cancel")}: ${name}`,
					onClick: () => setRootEdit(null)
				}, t("cancel")), h("button", {
					type: "button",
					className: "waycraft-skills-primary",
					"aria-label": `${t("saveFolder")}: ${name}`,
					disabled: !rootDirty,
					onClick: () => void mutate({
						action: "root-set",
						id: cur.id,
						path: rootEdit.path
					}, () => setRootEdit(null))
				}, t("saveFolder")))) : null, cur && editing ? h("div", { className: "waycraft-skills-form" }, labeled(t("label"), field(t("label"), editing.label, (v) => setEditing({
					...editing,
					label: v
				}))), labeled(t("group"), field(t("group"), editing.group, (v) => setEditing({
					...editing,
					group: v
				}))), h("div", { className: "waycraft-skills-pathrow" }, labeled(t("folderPath"), field(`${t("edit")}: ${t("folderPath")}`, editing.path, (v) => setEditing({
					...editing,
					path: v
				}))), browse((v) => setEditing((prev) => prev ? {
					...prev,
					path: v
				} : prev), `${t("edit")}: ${t("folderPath")}`)), h("div", { className: "waycraft-skills-actions" }, h("button", {
					type: "button",
					"aria-label": `${t("cancel")}: ${name}`,
					onClick: () => setEditing(null)
				}, t("cancel")), h("button", {
					type: "button",
					className: "waycraft-skills-primary",
					disabled: !customDirty,
					"aria-label": `${t("save")}: ${name}`,
					onClick: () => void mutate({
						action: "custom-update",
						id: cur.id,
						label: editing.label,
						group: editing.group,
						path: editing.path
					}, () => setEditing(null))
				}, t("save")))) : null, h("hr", { className: "waycraft-skills-divider" }), h("div", { className: "waycraft-skills-pathrow" }, h("div", { className: "waycraft-skills-labeled" }, h("strong", null, t("customSources")), h("span", null, t("foldersHint"))), h("button", {
					type: "button",
					"aria-expanded": addOpen,
					onClick: () => setAddOpen(!addOpen)
				}, addOpen ? t("hideForm") : t("addSource"))), addOpen ? manager() : null, notice && !addOpen ? h("p", {
					role: "status",
					className: "waycraft-skills-notice"
				}, notice) : null, customs.length ? h("ul", { className: "waycraft-skills-customlist" }, ...customs.map((x) => h("li", { key: x.id }, h("strong", null, sourceLabel(x)), h("bdi", {
					dir: "ltr",
					className: "waycraft-skills-path"
				}, x.path), h("button", {
					type: "button",
					className: "waycraft-skills-link",
					"aria-label": `${t("editNamed")}: ${sourceLabel(x)}`,
					onClick: () => pick(x.id)
				}, t("edit")), h("button", {
					type: "button",
					className: "waycraft-skills-link waycraft-skills-danger",
					"aria-label": `${t("removeNamed")}: ${sourceLabel(x)}`,
					onClick: () => setRemoving(x.id)
				}, t("remove"))))) : null);
			};
			const changeScope = (value) => {
				setScope(value);
				setSource("");
				setNotice("");
			};
			const openDetail = (copy) => call({
				action: "detail",
				id: copy.path,
				...selected
			}, lifetime.current.signal).then((value) => {
				if (!lifetime.current.signal.aborted) {
					setDetailError(false);
					setDetail(value);
				}
			}).catch(() => {
				if (!lifetime.current.signal.aborted) setDetailError(true);
			});
			const clearDrop = (root) => root?.querySelectorAll?.(".waycraft-skills-drop-over").forEach((n) => n.classList.remove("waycraft-skills-drop-over"));
			const dragDone = (info) => setNotice(`${t("dragMoved")} ${info.name}`);
			const organizationOf = (id) => orgOf(id);
			const rowDrag = (copy, movable) => {
				if (!movable || !orgOf(copy.source).categories.length) return {};
				const cat = orgOf(copy.source).members[copy.name] ?? "";
				return {
					draggable: true,
					onDragStart: (e) => {
						const info = {
							source: copy.source,
							name: copy.name,
							category: cat
						};
						dragRef.current = info;
						if (e.dataTransfer) {
							e.dataTransfer.effectAllowed = "move";
							e.dataTransfer.setData("text/plain", JSON.stringify(info));
						}
						e.currentTarget.classList.add("waycraft-skills-dragging");
					},
					onDragEnd: (e) => {
						dragRef.current = null;
						e.currentTarget.classList.remove("waycraft-skills-dragging");
						clearDrop(e.currentTarget.closest?.("[data-waycraft-skills]"));
					}
				};
			};
			const catDrop = (sourceId, categoryId) => ({
				onDragOver: (e) => {
					const d = dragRef.current;
					if (!d || d.source !== sourceId || d.category === categoryId) return;
					e.preventDefault();
					if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
					e.currentTarget.classList.add("waycraft-skills-drop-over");
				},
				onDragLeave: (e) => e.currentTarget.classList.remove("waycraft-skills-drop-over"),
				onDrop: (e) => {
					const d = dragRef.current;
					e.currentTarget.classList.remove("waycraft-skills-drop-over");
					dragRef.current = null;
					if (!d || d.source !== sourceId || d.category === categoryId) return;
					e.preventDefault();
					organize({
						action: "category-assign",
						source: sourceId,
						names: [d.name],
						category: categoryId
					}, () => dragDone(d));
				}
			});
			const skillRow = (x, copy) => {
				const organization = orgOf(copy.source);
				const note = organization.notes[copy.name];
				const status$1 = copyStatus(copy);
				const movable = copy.metadataValid !== false && !data.corrupt;
				const linked = (view?.diagnostics ?? []).some((d) => d.code === "linked-outside-root" && d.params?.source === copy.source && d.params?.path === copy.path);
				const canTrash = ["user-dsh", "user-agents"].includes(copy.source) || copy.source === `project-dsh:${project}`;
				return h("article", {
					key: copy.path,
					className: "waycraft-skills-row",
					"data-waycraft-skill": copy.name,
					...rowDrag(copy, movable)
				}, movable && organizationOf(copy.source).categories.length ? h("span", {
					className: "waycraft-skills-grip",
					"aria-hidden": true,
					title: t("dragTip")
				}, "⋮⋮") : null, h("div", { className: "waycraft-skills-row-main" }, h("div", { className: "waycraft-skills-row-title" }, h("strong", null, copy.name), status$1 === "invalid" || status$1 === "shadowed" || status$1 === "blocked" ? h("span", {
					className: "waycraft-skills-badge waycraft-skills-badge-warn",
					"data-waycraft-skills-status": status$1
				}, t(status$1)) : null, organization.members[copy.name] ? h("span", { className: "waycraft-skills-badge" }, organization.categories.find((c) => c.id === organization.members[copy.name])?.name) : null), h("p", {
					className: "waycraft-skills-row-desc",
					"data-note": note ? true : void 0,
					title: note ? `${t("note")}: ${note}\n${copy.description}` : copy.description
				}, note ?? copy.description), linked ? h("span", {
					className: "waycraft-skills-linked",
					"data-waycraft-linked": true
				}, severityIcon("note", {
					className: "waycraft-skills-icon",
					"data-waycraft-skills-icon": "note"
				}), t("linkedReadOnly")) : null), h("div", { className: "waycraft-skills-row-actions" }, h(MoreMenu, {
					label: `${t("more")}: ${copy.name}`,
					title: t("more"),
					trigger: icon(ICONS.more)
				}, h("button", {
					type: "button",
					onClick: () => void openDetail(copy)
				}, t("details")), h("button", {
					type: "button",
					"aria-label": `${t("note")}: ${copy.name}`,
					disabled: data.corrupt,
					onClick: () => setNoteDialog({
						source: copy.source,
						name: copy.name
					})
				}, t("editNote")), organization.categories.length && movable ? h("select", {
					"aria-label": `${t("assignTo")}: ${copy.name}`,
					value: organization.members[copy.name] ?? "",
					onChange: (e) => void organize({
						action: "category-assign",
						source: copy.source,
						names: [copy.name],
						category: e.target.value
					})
				}, h("option", { value: "" }, t("uncategorized")), ...organization.categories.map((c) => h("option", {
					key: c.id,
					value: c.id
				}, c.name))) : null, canTrash ? h("button", {
					className: "waycraft-skills-danger",
					"aria-label": `${t("moveTrash")}: ${copy.name}`,
					disabled: switching || data.corrupt,
					onClick: () => void mutate({
						action: "trash",
						id: copy.path,
						source: copy.source,
						...selected
					}, (value) => {
						if (value.result?.warning) setNotice(`${t(`code.${value.result.warning}`)} ${value.result.path ?? ""}`);
					})
				}, t("moveTrash")) : null), switchControl({
					checked: !!copy.eligible,
					bare: true,
					disabled: x.enabled === false || data.corrupt,
					label: `${t("copyCopy")}: ${copy.name} — ${copy.path}`,
					text: t("toggle"),
					onToggle: () => toggle("copy", copy.path, !copy.eligible)
				})));
			};
			const sourceProblems = (id) => (view?.diagnostics ?? []).filter((d) => d.params?.source === id && severityOf(d) !== "note" && !isAbsentDefault(d, view?.sources ?? [], view?.diagnostics ?? [])).length;
			const regionOf = (id) => diagnosticsRegion(view?.diagnostics ?? [], view?.sources ?? [], id, {
				open: !!orgOpen["diag:" + id],
				onToggle: (open) => setOrgOpen((prev) => ({
					...prev,
					["diag:" + id]: open
				}))
			});
			const revealProblems = (id) => {
				setOrgOpen((prev) => ({
					...prev,
					["src:" + id]: true,
					["diag:" + id]: true
				}));
				setTimeout(() => document.getElementById(`waycraft-diag-${id}`)?.scrollIntoView?.({ block: "nearest" }), 0);
			};
			const filtering = !!(query || source || status || activeCat);
			const groupName = (sourceId, id) => orgOf(sourceId).categories.find((c) => c.id === id)?.name ?? id;
			const catIconBtn = (label, pathD, onClick, extra = "", disabled = false) => h("button", {
				type: "button",
				className: `waycraft-skills-icon-btn${extra}`,
				"aria-label": label,
				title: label,
				disabled,
				onClick
			}, icon(pathD));
			const windowed = (key$1, rows, render) => {
				if (rows.length <= ROW_CAP) return rows.map(render);
				const all = !!rowsOpen[key$1];
				return [...(all ? rows : rows.slice(0, ROW_CAP)).map(render), h("div", {
					key: `more:${key$1}`,
					className: "waycraft-skills-diag-foot"
				}, h("button", {
					type: "button",
					className: "waycraft-skills-link",
					"data-waycraft-rows-toggle": key$1,
					onClick: () => setRowsOpen({
						...rowsOpen,
						[key$1]: !all
					})
				}, all ? t("showLess") : t("showMoreCount").replace("{count}", String(rows.length - ROW_CAP))))];
			};
			const sourceRows = (x) => {
				const mine = mineBySource[x.id] ?? [];
				const organization = orgOf(x.id);
				if (!organization.categories.length || data.corrupt) return windowed(x.id, mine, (copy) => skillRow(x, copy));
				return [...[...organization.categories, {
					id: "",
					name: t("uncategorized")
				}].map((group) => {
					const rows = mine.filter((c) => (organization.members[c.name] ?? "") === group.id);
					const allRows = (view?.copies ?? []).filter((c) => c.source === x.id && (organization.members[c.name] ?? "") === group.id);
					const usable = allRows.filter((c) => c.metadataValid !== false);
					const on = usable.filter((c) => c.eligible).length;
					const editKey = `${x.id}/${group.id}`;
					return h("div", {
						key: `cat:${group.id}`,
						className: "waycraft-skills-catsec",
						"data-waycraft-cat-section": editKey,
						...catDrop(x.id, group.id)
					}, h("div", { className: "waycraft-skills-cathead" }, h("span", {
						className: "waycraft-skills-catico",
						"aria-hidden": true
					}, icon(ICONS.folder)), h("span", { className: "waycraft-skills-source-name" }, group.name), h("span", { className: "waycraft-skills-count" }, h("bdi", null, `${usable.length} · ${on} ${t("enabledCount")}`)), h("span", { className: "waycraft-skills-cathead-actions" }, group.id ? [
						catIconBtn(`${t("addSkillsTo")}: ${group.name}`, ICONS.plus, () => {
							setAddPick([]);
							setAddQuery("");
							setAddTo({
								source: x.id,
								id: group.id
							});
						}),
						catIconBtn(`${t("renameCategory")}: ${group.name}`, ICONS.pencil, () => setCatEdit({
							key: editKey,
							id: group.id,
							name: group.name
						})),
						catIconBtn(`${t("deleteCategory")}: ${group.name}`, ICONS.trash, () => setCatRemoving(editKey), " waycraft-skills-icon-btn--danger")
					] : null, switchControl({
						checked: usable.length > 0 && on === usable.length,
						bare: true,
						label: `${t("toggleCategory")}: ${group.name}`,
						disabled: !usable.length || x.enabled === false,
						onToggle: () => void organize({
							action: "category-toggle",
							source: x.id,
							category: group.id,
							enabled: !(usable.length > 0 && on === usable.length)
						})
					}))), !allRows.length ? h("p", { className: "waycraft-skills-helper waycraft-skills-catempty" }, t("catEmptyHere")) : h("details", {
						className: "waycraft-skills-catbody",
						open: filtering && rows.length > 0
					}, h("summary", null, h("span", {
						className: "waycraft-skills-chev",
						"aria-hidden": true
					}), h("bdi", null, `${allRows.length} ${t(allRows.length === 1 ? "statSkill" : "statSkills")}`)), windowed(editKey, rows, (copy) => skillRow(x, copy))));
				}), h("p", {
					key: "cat-help",
					className: "waycraft-skills-footnote"
				}, t("catHelp"))];
			};
			const categoryRowDialogs = () => {
				const out = [];
				const ed = catEdit;
				if (ed) {
					const [sid, cid] = [ed.key.slice(0, ed.key.lastIndexOf("/")), ed.id];
					const orig = groupName(sid, cid);
					out.push(h(CatalogDialog, {
						key: "cat-rename",
						label: `${t("renameCategory")}: ${orig}`,
						size: "sm",
						onClose: () => setCatEdit(null)
					}, h("h3", null, t("renameCategory")), labeled(t("categoryName"), field(t("renameCategory"), ed.name, (v) => setCatEdit({
						...ed,
						name: v
					}))), h("button", {
						"aria-label": `${t("cancel")}: ${orig}`,
						onClick: () => setCatEdit(null)
					}, t("cancel")), h("button", {
						className: "waycraft-skills-primary",
						"aria-label": `${t("save")}: ${orig}`,
						disabled: !ed.name.trim() || ed.name.trim() === orig,
						onClick: () => void organize({
							action: "category-rename",
							source: sid,
							category: cid,
							name: ed.name
						}, () => setCatEdit(null))
					}, t("save"))));
				}
				if (catRemoving) {
					const k = catRemoving;
					const sid = k.slice(0, k.lastIndexOf("/"));
					const cid = k.slice(k.lastIndexOf("/") + 1);
					const nm = groupName(sid, cid);
					out.push(h(CatalogDialog, {
						key: "cat-delete",
						label: `${t("deleteCategory")}: ${nm}`,
						size: "sm",
						onClose: () => setCatRemoving("")
					}, h("h3", null, `${t("deleteCategory")}: ${nm}`), h("p", null, t("deleteCategoryNote")), h("button", {
						"aria-label": `${t("cancel")}: ${nm}`,
						onClick: () => setCatRemoving("")
					}, t("cancel")), h("button", {
						className: "waycraft-skills-danger",
						"aria-label": `${t("confirmDeleteCategory")}: ${nm}`,
						onClick: () => void organize({
							action: "category-delete",
							source: sid,
							category: cid
						}, () => setCatRemoving(""))
					}, t("confirmDeleteCategory"))));
				}
				const at = addTo;
				if (at) {
					const nm = groupName(at.source, at.id);
					const members = orgOf(at.source).members;
					const q = addQuery.trim().toLowerCase();
					const candidates$1 = skillNames(at.source).filter((n) => (members[n] ?? "") !== at.id && (!q || n.toLowerCase().includes(q)));
					const close = () => setAddTo(null);
					out.push(h(CatalogDialog, {
						key: "cat-add",
						label: `${t("addSkillsTo")}: ${nm}`,
						size: "md",
						onClose: close
					}, h("h3", null, `${t("addSkillsTo")}: ${nm}`), field(t("search"), addQuery, setAddQuery), h("div", {
						className: "waycraft-skills-picklist",
						role: "group",
						"aria-label": t("addSkillsTo")
					}, candidates$1.length ? candidates$1.map((n) => h("label", {
						key: n,
						className: "waycraft-skills-member"
					}, h("input", {
						type: "checkbox",
						"aria-label": `${t("selectSkill")}: ${n}`,
						checked: addPick.includes(n),
						onChange: (e) => setAddPick(e.target.checked ? [...addPick, n] : addPick.filter((y) => y !== n))
					}), h("span", { className: "waycraft-skills-member-name" }, n))) : h("p", { className: "waycraft-skills-helper" }, t("addSkillsNone"))), h("button", { onClick: close }, t("cancel")), h("button", {
						className: "waycraft-skills-primary",
						disabled: !addPick.length,
						onClick: () => void organize({
							action: "category-assign",
							source: at.source,
							names: addPick,
							category: at.id
						}, close)
					}, `${t("addSkillsCount")} (${addPick.length})`)));
				}
				return out;
			};
			const categoryDialogView = (sourceId) => {
				const src = (view?.sources ?? data?.sources ?? []).find((y) => y.id === sourceId);
				const label = src ? sourceLabel(src) : sourceId;
				const name = catName[sourceId] ?? "";
				const taken = orgOf(sourceId).categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
				const close = () => {
					setCatName({
						...catName,
						[sourceId]: ""
					});
					setCatDialog(null);
				};
				return h(CatalogDialog, {
					label: `${t("newCategory")}: ${label}`,
					size: "sm",
					onClose: close
				}, h("h3", null, t("newCategory")), h("p", { className: "waycraft-skills-notice" }, `${t("categoryHint")} ${label}`), labeled(t("categoryName"), h("input", {
					"aria-label": `${t("categoryName")}: ${label}`,
					placeholder: t("categoryName"),
					value: name,
					onChange: (e) => setCatName({
						...catName,
						[sourceId]: e.target.value
					})
				})), taken ? h("p", {
					role: "alert",
					className: "waycraft-skills-field-error"
				}, t("categoryTaken")) : null, h("button", {
					type: "button",
					onClick: close
				}, t("cancel")), h("button", {
					type: "button",
					className: "waycraft-skills-primary",
					"aria-label": `${t("addCategory")}: ${label}`,
					disabled: !name.trim() || taken,
					onClick: () => void organize({
						action: "category-create",
						source: sourceId,
						name
					}, close)
				}, t("addCategory")));
			};
			const noteDialogView = () => {
				if (!noteDialog) return null;
				const nd = noteDialog;
				const key$1 = `${nd.source}/${nd.name}`;
				const stored = orgOf(nd.source).notes[nd.name] ?? "";
				const value = noteDrafts[key$1] ?? stored;
				const close = () => {
					const next = { ...noteDrafts };
					delete next[key$1];
					setNoteDrafts(next);
					setNoteDialog(null);
				};
				return h(CatalogDialog, {
					label: `${t("note")}: ${nd.name}`,
					size: "sm",
					onClose: close
				}, h("h3", null, `${t("note")} — ${nd.name}`), labeled(t("note"), h("textarea", {
					className: "waycraft-skills-textarea",
					"aria-label": `${t("note")}: ${nd.name}`,
					placeholder: t("noteHint"),
					maxLength: 500,
					title: t("noteLimit"),
					value,
					onChange: (e) => setNoteDrafts({
						...noteDrafts,
						[key$1]: e.target.value
					})
				})), h("p", { className: "waycraft-skills-helper" }, t("noteSavedHint")), h("button", {
					type: "button",
					onClick: close
				}, t("cancel")), h("button", {
					type: "button",
					className: "waycraft-skills-primary",
					"aria-label": `${t("saveNote")}: ${nd.name}`,
					disabled: value === stored,
					onClick: () => void organize({
						action: "note",
						source: nd.source,
						name: nd.name,
						note: value
					}, close)
				}, t("confirmNote")));
			};
			return h("section", {
				"data-waycraft-skills": true,
				className: "waycraft-skills",
				dir: isArabic() ? "rtl" : void 0
			}, h("style", null, SKILLS_STYLE), h("div", { className: "waycraft-skills-header" }, h("h2", { className: "waycraft-skills-title" }, t("title"))), h("div", { className: "waycraft-skills-toolbar" }, h("div", {
				role: "group",
				className: "waycraft-skills-seg",
				"data-waycraft-scope-tabs": true
			}, ...[
				[
					"global",
					"scopeGlobal",
					ICONS.global
				],
				[
					"project",
					"scopeProject",
					ICONS.folder
				],
				[
					"discover",
					"scopeDiscover",
					ICONS.search
				],
				[
					"trash",
					"trash",
					ICONS.trash
				]
			].map(([value, label, path]) => h("button", {
				key: value,
				type: "button",
				"aria-pressed": scope === value,
				"data-scope": value,
				onClick: () => changeScope(value)
			}, icon(path), h("span", null, t(label)), value === "trash" && data?.trash?.length ? h("span", { className: "waycraft-skills-badge" }, h("bdi", null, String(data.trash.length))) : null))), h("select", {
				"aria-label": t("scope"),
				"aria-hidden": true,
				tabIndex: -1,
				className: "waycraft-skills-sr",
				value: scope,
				onChange: (e) => changeScope(e.target.value)
			}, h("option", { value: "global" }, t("scopeGlobal")), h("option", { value: "project" }, t("scopeProject")), h("option", { value: "discover" }, t("scopeDiscover")), h("option", { value: "trash" }, t("trash"))), inProject ? h("select", {
				"aria-label": t("project"),
				value: project,
				onChange: (e) => {
					setProject(e.target.value);
					setSource("");
					setNotice("");
				}
			}, h("option", { value: "" }, projects.length ? t("projectNone") : t("projectEmpty")), ...projects.map(projectOption)) : null), scope === "global" || scope === "project" ? h("div", { className: "waycraft-skills-toolbar waycraft-skills-filters" }, h("input", {
				"aria-label": t("search"),
				placeholder: t("search"),
				value: query,
				onChange: (e) => setQuery(e.target.value)
			}), h("select", {
				"aria-label": t("source"),
				value: source,
				onChange: (e) => setSource(e.target.value)
			}, h("option", { value: "" }, t("all")), ...visibleSources.map((x) => h("option", {
				key: x.id,
				value: x.id
			}, `${sourceLabel(x)} (${(view?.copies ?? []).filter((c) => c.source === x.id).length})`))), h("select", {
				"aria-label": t("any"),
				value: status,
				onChange: (e) => setStatus(e.target.value)
			}, ...[
				"",
				"enabled",
				"disabled",
				"invalid",
				"shadowed",
				"blocked"
			].map((x) => h("option", {
				key: x,
				value: x
			}, t(x || "any")))), h("select", {
				"aria-label": t("filterCategory"),
				value: activeCat,
				onChange: (e) => setCatFilter(e.target.value)
			}, h("option", { value: "" }, t("allCategories")), h("option", { value: "__none" }, t("uncategorized")), ...filterCategories.map((c) => h("option", {
				key: c.id,
				value: c.id
			}, c.name))), scope === "global" || scope === "project" ? h("div", {
				className: "waycraft-skills-iconbar",
				role: "group",
				"aria-label": t("actionsAria")
			}, h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn",
				"data-waycraft-skills-refresh": true,
				"aria-label": t("refreshAria"),
				title: t(refreshing ? "refreshing" : "refresh"),
				"aria-busy": refreshing,
				disabled: refreshing || switching || inProject && !project,
				onClick: () => void refresh()
			}, icon(ICONS.refresh)), h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn",
				"aria-label": t("create"),
				title: t("create"),
				"aria-expanded": creating,
				disabled: switching || data?.corrupt || scope === "project" && !project,
				onClick: () => setCreating(!creating)
			}, icon(ICONS.plus)), h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn",
				"aria-label": t("importSkills"),
				title: t("importSkills"),
				"aria-expanded": importing,
				disabled: switching || data?.corrupt || scope === "project" && !project,
				onClick: () => setImporting(!importing)
			}, icon(ICONS.importIcon)), inProject ? null : h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn",
				"aria-label": t("folders"),
				title: t("folders"),
				"aria-expanded": foldersOpen,
				onClick: () => {
					if (managing || rootEdit || editing) closeFolders();
					else {
						setManaging(true);
						setAddOpen(true);
						const first = (data?.sources ?? []).find((y) => y.custom || y.overridable);
						if (first && !first.custom) setRootEdit({
							id: first.id,
							path: first.path
						});
						else if (first) setEditing({
							id: first.id,
							label: first.label ?? "",
							group: first.group ?? "",
							path: first.path
						});
					}
				}
			}, icon(ICONS.folder))) : null) : null, data?.trashError ? h("p", { role: "alert" }, t(`code.${data.trashError}`)) : null, scope === "trash" ? h("div", {
				"data-waycraft-trash": true,
				className: "waycraft-skills-panel"
			}, h("h3", null, t("trash")), !data?.trashError && !data?.trash?.length ? h("p", null, t("trashEmpty")) : null, ...(data?.trash ?? []).map((item) => h("article", {
				key: item.id,
				className: "waycraft-skills-card"
			}, h("strong", null, item.name), h("p", null, `${t("trashOrigin")}: ${item.origin}`), item.scope !== "global" ? h("p", null, `${t("project")}: ${projectName(item.scope)}`) : null, h("p", null, `${item.source} — ${item.deletedAt}`), h("button", {
				"aria-label": `${t("restoreTrash")}: ${item.name}`,
				onClick: () => void mutate({
					action: "trash-restore",
					id: item.id
				}, (value) => {
					if (value.result?.warning) setNotice(`${t(`code.${value.result.warning}`)} ${value.result.path ?? ""}`);
				})
			}, t("restoreTrash")), h("button", {
				className: "waycraft-skills-danger",
				"aria-label": `${t("deleteTrash")}: ${item.name}`,
				onClick: () => setTrashDeleting(item.id)
			}, t("deleteTrash")), trashDeleting === item.id ? h(CatalogDialog, {
				label: `${t("deleteTrash")}: ${item.name}`,
				size: "sm",
				onClose: () => setTrashDeleting("")
			}, h("p", null, item.scope !== "global" ? `${t("trashWarning")} (${projectName(item.scope)})` : t("trashWarning")), h("button", {
				className: "waycraft-skills-danger",
				onClick: () => void mutate({
					action: "trash-delete",
					id: item.id,
					confirm: true
				}, (value) => {
					setTrashDeleting("");
					if (value.result?.warning) setNotice(t(`code.${value.result.warning}`));
				})
			}, t("confirmTrash")), h("button", { onClick: () => setTrashDeleting("") }, t("cancel"))) : null))) : null, scope === "discover" ? h("div", {
				role: "tablist",
				"aria-label": t("scopeDiscover"),
				"data-waycraft-discover-tabs": true,
				className: "waycraft-skills-tabs"
			}, ...[
				["git", t("tabGit")],
				["clawhub", t("catSourceClawhub")],
				["skillsh", t("catSourceSkillsh")]
			].map(([id, label], index, all) => h("button", {
				key: id,
				type: "button",
				role: "tab",
				id: `waycraft-discover-tab-${id}`,
				...id === "git" ? { "aria-label": label } : {},
				"aria-selected": tab === id,
				...tab === id ? { "aria-controls": "waycraft-discover-panel" } : {},
				tabIndex: tab === id ? 0 : -1,
				onClick: () => setTab(id),
				onKeyDown: (event) => {
					const step = event.key === "ArrowRight" ? isArabic() ? -1 : 1 : event.key === "ArrowLeft" ? isArabic() ? 1 : -1 : 0;
					const next = (event.key === "Home" ? 0 : event.key === "End" ? all.length - 1 : void 0) ?? (step ? (index + step + all.length) % all.length : void 0);
					if (next === void 0) return;
					event.preventDefault?.();
					setTab(all[next][0]);
					(document.getElementById?.(`waycraft-discover-tab-${all[next][0]}`))?.focus?.();
				}
			}, id === "git" ? `${label} (${(data?.repositories ?? []).length})` : label))) : null, scope === "discover" && tab === "git" ? h("div", {
				id: "waycraft-discover-panel",
				role: "tabpanel",
				"aria-labelledby": "waycraft-discover-tab-git",
				"data-waycraft-repositories": true,
				className: "waycraft-skills-panel"
			}, repoFormOpen ? h(CatalogDialog, {
				label: t("repoAddTitle"),
				size: "md",
				onClose: () => setRepoFormOpen(false)
			}, h("h3", null, t("repoAddTitle")), h("form", {
				className: "waycraft-skills-form",
				onSubmit: (event) => {
					event.preventDefault();
					repoAction("add", {
						action: "repo-add",
						repository: { ...repoForm }
					}, () => {
						setRepoForm({
							url: "",
							ref: "",
							subdirectory: ""
						});
						setRepoFormOpen(false);
					});
				}
			}, labeled(t("repoUrl"), field(t("repoUrl"), repoForm.url, (value) => setRepoForm({
				...repoForm,
				url: value
			}))), h("div", { className: "waycraft-skills-grid" }, labeled(t("repoRef"), field(t("repoRef"), repoForm.ref, (value) => setRepoForm({
				...repoForm,
				ref: value
			}))), labeled(t("repoSubdirectory"), field(t("repoSubdirectory"), repoForm.subdirectory, (value) => setRepoForm({
				...repoForm,
				subdirectory: value
			})))), data?.repoError ? h("p", {
				role: "alert",
				className: "waycraft-skills-field-error"
			}, t(`code.${data.repoError}`)) : null), h("button", {
				type: "button",
				onClick: () => setRepoFormOpen(false)
			}, t("cancel")), h("button", {
				type: "button",
				className: "waycraft-skills-primary",
				disabled: !repoForm.url.trim() || !!repoBusy || switching,
				onClick: () => {
					repoAction("add", {
						action: "repo-add",
						repository: { ...repoForm }
					}, () => {
						setRepoForm({
							url: "",
							ref: "",
							subdirectory: ""
						});
						setRepoFormOpen(false);
					});
				}
			}, t("repoAdd"))) : null, repoBusy ? h("p", { role: "status" }, t(repoBusy.startsWith("apply:") ? "repoApplying" : "repoRefreshing")) : null, repoSummary ? h("p", { role: "status" }, repoSummary) : null, data?.repoError && !repoFormOpen ? h("p", { role: "alert" }, t(`code.${data.repoError}`)) : null, h("div", { className: "waycraft-skills-filterrow" }, h("select", {
				"aria-label": t("repoStatusFilter"),
				value: repoStatusFilter,
				onChange: (event) => setRepoStatusFilter(event.target.value)
			}, h("option", {
				key: "",
				value: ""
			}, t("repoAllStatuses")), ...[
				"available",
				"installed",
				"update",
				"conflict",
				"invalid"
			].map((id) => h("option", {
				key: id,
				value: id
			}, t(`repoStatus.${id}`)))), h("select", {
				className: "waycraft-skills-first",
				"aria-label": t("repoRepoFilter"),
				value: repoRepoFilter,
				onChange: (event) => setRepoRepoFilter(event.target.value)
			}, h("option", {
				key: "",
				value: ""
			}, t("repoAllRepositories")), ...(data?.repositories ?? []).map((repo) => h("option", {
				key: repo.id,
				value: repo.id
			}, repo.label))), field(t("repoFilter"), repoFilter, setRepoFilter), h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn",
				"aria-label": t("repoRefreshAll"),
				title: t("repoRefreshAll"),
				disabled: !data?.repositories?.length || !!repoBusy || switching,
				onClick: () => void repoAction("all", { action: "repo-refresh-all" }, (value) => setRepoSummary(t("repoBulk").replace("{done}", String(value.result.refreshed.length)).replace("{total}", String(value.result.total)).replace("{failed}", String(value.result.failed.length))))
			}, icon(ICONS.refresh)), h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn",
				"aria-label": t("repoAddTitle"),
				title: t("repoAddTitle"),
				"aria-haspopup": "dialog",
				onClick: () => setRepoFormOpen(true)
			}, icon(ICONS.plus))), !data?.repoError && !data?.repositories?.length ? h("p", { className: "waycraft-skills-emptystate" }, t("repoEmpty")) : null, h("p", { className: "waycraft-skills-caption" }, t("repoFootnote")), ...(data?.repositories ?? []).map((repo) => {
				const needle = repoFilter.trim().toLowerCase();
				if (repoRepoFilter && repo.id !== repoRepoFilter) return null;
				const shown = repo.skills.filter((skill) => (!repoStatusFilter || skill.status === repoStatusFilter || repoStatusFilter === "update" && skill.updateAvailable) && (!needle || `${skill.name} ${skill.description} ${skill.path}`.toLowerCase().includes(needle)));
				if ((needle || repoStatusFilter) && !shown.length) return null;
				return h("article", {
					key: repo.id,
					"data-waycraft-repository": repo.id,
					className: "waycraft-skills-card"
				}, h("div", { className: "waycraft-skills-repohead" }, h("span", {
					className: "waycraft-skills-catico",
					"aria-hidden": true
				}, icon(ICONS.folder)), h("strong", null, repo.label), h("span", { className: "waycraft-skills-badge" }, h("bdi", { dir: "ltr" }, repo.fingerprint.slice(0, 7))), h("span", { className: "waycraft-skills-cathead-actions" }, h("button", {
					type: "button",
					className: "waycraft-skills-icon-btn",
					"aria-label": `${t("repoRefresh")}: ${repo.label}`,
					title: t("repoRefresh"),
					disabled: !!repoBusy || switching,
					onClick: () => void repoAction(repo.id, {
						action: "repo-refresh",
						id: repo.id
					})
				}, icon(ICONS.refresh)), h("button", {
					type: "button",
					className: "waycraft-skills-icon-btn waycraft-skills-icon-btn--danger",
					"aria-label": `${t("repoUnsubscribe")}: ${repo.label}`,
					title: t("repoUnsubscribe"),
					disabled: !!repoBusy || switching,
					onClick: () => setRepoUnsubscribing(repo.id)
				}, icon(ICONS.trash)))), h("p", null, h("bdi", { dir: "ltr" }, `${repo.kind}${repo.ref ? ` @ ${repo.ref}` : ""}${repo.subdirectory ? ` / ${repo.subdirectory}` : ""}`), ` · ${t(`repoKind.${repo.fingerprintKind}`)}`), repo.error ? h("p", { role: "alert" }, `${t("repoLastError")}: ${t(`code.${repo.error.code}`)}`) : null, repoUnsubscribing === repo.id ? h(CatalogDialog, {
					label: `${t("repoUnsubscribe")}: ${repo.label}`,
					size: "sm",
					onClose: () => setRepoUnsubscribing("")
				}, h("p", null, t("repoConfirmUnsubscribe")), h("button", {
					className: "waycraft-skills-danger",
					"aria-label": `${t("repoConfirmUnsubscribeYes")}: ${repo.label}`,
					disabled: !!repoBusy || switching,
					onClick: () => {
						setRepoUnsubscribing("");
						repoAction(repo.id, {
							action: "repo-remove",
							id: repo.id
						});
					}
				}, t("repoConfirmUnsubscribeYes")), h("button", {
					"aria-label": `${t("cancel")}: ${repo.label}`,
					onClick: () => setRepoUnsubscribing("")
				}, t("cancel"))) : null, repoBusy === repo.id ? h("p", { role: "status" }, t("repoRefreshing")) : null, !repo.skills.length ? h("p", null, t("repoNoSkills")) : null, h("ul", { className: "waycraft-skills-list waycraft-skills-repolist" }, ...shown.map((skill) => discoverRow({
					key: skill.path,
					attrs: { "data-waycraft-repo-skill": skill.path },
					name: skill.name,
					badges: [h("span", {
						key: "status",
						className: skill.status === "installed" || skill.status === "tracked" ? "waycraft-skills-badge" : "waycraft-skills-badge waycraft-skills-badge-quiet"
					}, t(`repoStatus.${skill.status}`)), skill.code ? h("span", {
						key: "code",
						className: "waycraft-skills-badge waycraft-skills-badge-warn"
					}, t(`code.${skill.code}`)) : null],
					description: skill.description,
					notes: skill.conflicts?.length ? [h("p", {
						key: "conflict",
						className: "waycraft-skills-meta"
					}, `${t("repoConflictIn")}: ${skill.conflicts.map((id) => id === "user-dsh" ? "DSH" : "Shared Agents").join(", ")}`)] : [],
					install: skill.valid !== false ? {
						aria: `${t("repoInstall")}: ${skill.name}`,
						label: t("repoInstall"),
						title: t("repoInstall"),
						haspopup: true,
						disabled: !!repoBusy || switching,
						onClick: () => setRepoInstalling(`${repo.id}/${skill.path}`)
					} : void 0,
					after: [repoInstalling === `${repo.id}/${skill.path}` ? h(CatalogDialog, {
						label: `${t("repoInstall")}: ${skill.name}`,
						size: "md",
						onClose: () => setRepoInstalling("")
					}, h("h3", null, `${t("repoInstall")}: ${skill.name}`), labeled(t("repoDestination"), h("select", {
						"aria-label": t("repoDestination"),
						value: repoTarget,
						onChange: (event) => setRepoTarget(event.target.value)
					}, ...destinationsOf(data).map((item) => destinationOption(item, item.id === "user-dsh" ? "DSH" : item.id === "user-agents" ? "Shared Agents" : item.label)))), ...destinationInfo(data, repoDestination), skill.installedIn?.includes(repoTarget) ? h("p", { className: "waycraft-skills-helper" }, t("repoStatus.installed")) : null, h("button", { onClick: () => setRepoInstalling("") }, t("cancel")), h("button", {
						className: "waycraft-skills-primary",
						disabled: !!repoBusy || switching || !repoDestination || !!skill.conflicts?.includes(repoTarget) || !!skill.installedIn?.includes(repoTarget),
						onClick: () => {
							setRepoInstalling("");
							repoAction(repo.id, {
								action: "repo-install",
								id: repo.id,
								path: skill.path,
								snapshot: repo.fingerprint,
								source: repoTarget,
								...projectOfDest(repoTarget) ? { project: projectOfDest(repoTarget) } : {}
							}, repoWarning);
						}
					}, t("catInstallConfirm"))) : null]
				}))));
			}), h("h4", null, t("repoTracked")), !(data?.repoInstalls ?? []).length ? h("p", null, t("repoNoInstalls")) : null, ...(data?.repoInstalls ?? []).map((record) => h("article", {
				key: record.id,
				"data-waycraft-repo-install": record.id,
				className: "waycraft-skills-card"
			}, h("strong", null, record.name), h("span", null, ` — ${t(`repoStatus.${record.status}`)}`), record.updateAvailable && record.status !== "update" ? h("span", null, ` — ${t("repoStatus.update")}`) : null, record.upstream ? h("p", null, `${t("repoUpstream")}: ${t(`code.${record.upstream}`)}`) : null, h("p", null, `${t("repoFromSource")}: ${record.origin.label}${record.origin.ref ? ` @ ${record.origin.ref}` : ""}${record.origin.subdirectory ? ` / ${record.origin.subdirectory}` : ""}`), h("p", null, `${t("repoSnapshot")}: ${record.fingerprint.slice(0, 12)} — ${t(`repoKind.${record.fingerprintKind}`)}`), h("p", null, `${t("repoInstalledAt")}: `, h("bdi", { dir: "ltr" }, placeName(data, record))), h("p", null, h("bdi", { dir: "ltr" }, record.path)), record.status === "installed" || record.status === "modified" ? h("button", {
				className: "waycraft-skills-danger",
				"aria-label": `${t("repoUninstall")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => void repoAction(record.id, {
					action: "repo-uninstall",
					installId: record.id,
					...record.project ? { project: record.project } : {}
				}, repoWarning)
			}, t("repoUninstall")) : null, (record.status === "installed" || record.status === "modified") && record.updateAvailable ? h("button", {
				"aria-label": `${t("repoUpdatePreview")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => repoPreview(record, "update")
			}, t("repoUpdatePreview")) : null, record.canRollback && (record.status === "installed" || record.status === "modified") ? h("button", {
				"aria-label": `${t("repoRollbackPreview")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => repoPreview(record, "rollback")
			}, t("repoRollbackPreview")) : null, repoPreviews[record.id] && (record.status === "installed" || record.status === "modified") ? h("div", {
				role: "group",
				"aria-labelledby": `waycraft-repo-preview-${record.id}`,
				"data-waycraft-repo-preview": record.id
			}, h("h5", { id: `waycraft-repo-preview-${record.id}` }, `${t("repoPreviewTitle")}: ${record.name}`), !repoPreviews[record.id].changes.length ? h("p", null, t("repoNoChanges")) : h("ul", null, ...repoPreviews[record.id].changes.map((change) => h("li", { key: change.path }, `${t(`repoChange.${change.kind}`)}: `, h("bdi", { dir: "ltr" }, change.path)))), h("p", null, t("repoTrackedHint")), repoPreviews[record.id].localModified ? h("div", { role: "alert" }, h("p", null, t("repoLocalModified")), h("label", null, h("input", {
				type: "checkbox",
				"aria-label": `${t("repoOverwrite")}: ${record.name}`,
				checked: !!repoOverwrites[record.id],
				onChange: (event) => setRepoOverwrites((all) => ({
					...all,
					[record.id]: !!event.target.checked
				}))
			}), t("repoOverwrite"))) : null, h("button", {
				"aria-label": `${t(repoPreviews[record.id].kind === "update" ? "repoApplyUpdate" : "repoApplyRollback")}: ${record.name}`,
				disabled: !!repoBusy || switching || repoPreviews[record.id].localModified && !repoOverwrites[record.id],
				onClick: () => repoApply(record)
			}, t(repoPreviews[record.id].kind === "update" ? "repoApplyUpdate" : "repoApplyRollback")), h("button", {
				"aria-label": `${t("cancel")}: ${record.name}`,
				onClick: () => setRepoPreviews(({ [record.id]: _gone,...rest }) => rest)
			}, t("cancel"))) : null, record.status === "invalid-root" ? h("button", {
				className: "waycraft-skills-danger",
				"aria-label": `${t("repoForget")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => setRepoForgetting(record.id)
			}, t("repoForget")) : null, record.status === "invalid-root" && repoForgetting === record.id ? h(CatalogDialog, {
				label: `${t("repoForget")}: ${record.name}`,
				size: "sm",
				onClose: () => setRepoForgetting("")
			}, h("p", null, t("repoConfirmForget")), h("button", {
				className: "waycraft-skills-danger",
				"aria-label": `${t("repoConfirmForgetYes")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => {
					setRepoForgetting("");
					repoAction(record.id, {
						action: "repo-forget",
						installId: record.id,
						...record.project ? { project: record.project } : {}
					});
				}
			}, t("repoConfirmForgetYes")), h("button", {
				"aria-label": `${t("cancel")}: ${record.name}`,
				onClick: () => setRepoForgetting("")
			}, t("cancel"))) : null))) : null, scope === "discover" && tab !== "git" && data && data.corrupt ? h("div", {
				id: "waycraft-discover-panel",
				role: "tabpanel",
				"aria-labelledby": `waycraft-discover-tab-${tab}`
			}) : null, scope === "discover" && tab !== "git" && data && !data.corrupt ? h("div", {
				id: "waycraft-discover-panel",
				role: "tabpanel",
				"aria-labelledby": `waycraft-discover-tab-${tab}`
			}, h(CatalogPanel, {
				key: tab,
				kind: tab,
				data,
				setData,
				setNotice
			})) : null, importing ? h(CatalogDialog, {
				label: t("importSkills"),
				onClose: () => setImporting(false)
			}, h("div", {
				"data-waycraft-import": true,
				className: "waycraft-skills-panel"
			}, h("p", null, t("importHint")), h("ul", {
				className: "waycraft-skills-reqs",
				"aria-label": t("importReqTitle")
			}, ...[
				"importReq1",
				"importReq2",
				"importReq3"
			].map((k) => h("li", { key: k }, t(k)))), ...destPick(), field(t("importPath"), importPath, (value) => {
				setImportPath(value);
				setImportFiles([]);
				setImportResult(null);
			}), h("div", {
				className: "waycraft-skills-drop",
				"data-drag": importDrag ? "over" : void 0,
				role: "button",
				tabIndex: 0,
				"aria-label": `${t("importDropTitle")}. ${t("importDropHint")}`,
				onClick: () => fileInput.current?.click?.(),
				onKeyDown: (event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault?.();
						fileInput.current?.click?.();
					}
				},
				onDragEnter: (event) => {
					event.preventDefault?.();
					setImportDrag(true);
				},
				onDragOver: (event) => {
					event.preventDefault?.();
					setImportDrag(true);
				},
				onDragLeave: () => setImportDrag(false),
				onDrop: (event) => {
					event.preventDefault?.();
					dropItems(event.dataTransfer);
				}
			}, h("strong", null, t("importDropTitle")), h("span", null, t("importDropHint"))), h("div", { className: "waycraft-skills-actions" }, h("button", {
				type: "button",
				className: "waycraft-skills-link",
				onClick: () => dirInput.current?.click?.()
			}, t("importChooseFolder")), h("button", {
				type: "button",
				className: "waycraft-skills-link",
				onClick: () => fileInput.current?.click?.()
			}, t("importChooseFile"))), h("input", {
				type: "file",
				ref: fileInput,
				multiple: true,
				accept: ".zip,.md",
				className: "waycraft-skills-sr",
				"aria-label": t("uploadFiles"),
				onChange: (event) => {
					setImportFiles(Array.from(event.target.files ?? []));
					setImportMsg("");
					setImportResult(null);
				}
			}), h("input", {
				type: "file",
				ref: dirInput,
				multiple: true,
				webkitdirectory: "",
				className: "waycraft-skills-sr",
				"aria-label": t("uploadFolder"),
				onChange: (event) => {
					setImportFiles(Array.from(event.target.files ?? []));
					setImportMsg("");
					setImportResult(null);
				}
			}), importMsg ? h("p", {
				role: "status",
				className: "waycraft-skills-helper"
			}, importMsg) : null, importFiles.length ? h("p", {
				role: "status",
				className: "waycraft-skills-helper",
				"data-waycraft-import-chosen": importFiles.length
			}, t("importChosen").replace("{count}", String(importFiles.length)), " ", h("button", {
				type: "button",
				className: "waycraft-skills-link",
				onClick: () => {
					setImportFiles([]);
					setImportMsg("");
					if (fileInput.current) fileInput.current.value = "";
					if (dirInput.current) dirInput.current.value = "";
				}
			}, t("importClear"))) : null, h("select", {
				"aria-label": t("importConflict"),
				value: importConflict,
				onChange: (event) => setImportConflict(event.target.value)
			}, h("option", { value: "" }, t("importConflict")), h("option", { value: "skip" }, t("skipImport")), h("option", { value: "overwrite" }, t("overwriteImport"))), h("div", { className: "waycraft-skills-dialog-footer" }, h("button", {
				disabled: importBusy || !importPath || !importConflict,
				"aria-busy": importBusy,
				onClick: () => runImport(true)
			}, t("previewImport")), h("button", {
				className: "waycraft-skills-primary",
				disabled: importBusy || !importConflict || !importPath && !importFiles.length,
				"aria-busy": importBusy,
				onClick: () => runImport(false)
			}, t("importNow"))), importResult ? h("div", {
				"aria-label": t("importResult"),
				role: "status"
			}, ...[
				"pending",
				"conflicts",
				"imported",
				"skipped",
				"failed",
				"warnings",
				"inputs"
			].map((kind) => h("div", { key: kind }, t(`${kind}Import`), ": ", (importResult[kind] ?? []).map((entry) => `${entry.name}${entry.code ? ` (${errorText(entry)})` : ""}${entry.recovery?.length ? `: ${entry.recovery.join(", ")}` : ""}${entry.names?.length ? `: ${entry.names.join(", ")}` : ""}`).join(", ")))) : null)) : null, creating ? h(CatalogDialog, {
				label: t("create"),
				onClose: () => setCreating(false)
			}, h("form", {
				className: "waycraft-skills-form",
				onSubmit: (event) => {
					event.preventDefault();
					if (switching || data?.corrupt || scope === "project" && !project || !validDestination(data, createSource)) return;
					destMutate({
						action: "create",
						...destRequest(),
						name: createName,
						description: createDescription,
						body: createBody
					}, () => {
						setCreating(false);
						setCreateName("");
						setCreateDescription("");
						setCreateBody("");
						setNotice(t("created"));
					});
				}
			}, ...destPick(), labeled(t("skillName"), field(t("skillName"), createName, setCreateName)), labeled(t("skillDescription"), field(t("skillDescription"), createDescription, setCreateDescription)), labeled(t("skillBody"), h("textarea", {
				className: "waycraft-skills-textarea",
				"aria-label": t("skillBody"),
				value: createBody,
				maxLength: 262144,
				onChange: (event) => setCreateBody(event.target.value)
			})), h("p", { className: "waycraft-skills-helper" }, t("createFootnote")), h("div", { className: "waycraft-skills-dialog-footer" }, h("button", {
				type: "button",
				onClick: () => setCreating(false)
			}, t("cancel")), h("button", {
				type: "submit",
				className: "waycraft-skills-primary",
				disabled: !createName.trim() || !createDescription.trim()
			}, t("create"))))) : null, inProject ? h("p", { className: "waycraft-skills-notice" }, t("projectHint")) : null, notice && !foldersOpen ? h("p", {
				role: "status",
				className: "waycraft-skills-notice"
			}, notice) : null, error ? h("div", {
				role: "alert",
				className: "waycraft-skills-alert"
			}, t("error"), h("button", { onClick: () => call({ action: "reload" }).then((value) => {
				setData(value);
				setError(false);
			}, load) }, t("retry"))) : !data || switching ? h("p", {
				role: "status",
				className: "waycraft-skills-loading"
			}, t("loading")) : h(React.Fragment, null, scope === "global" || inProject && data.project?.available ? h("div", {
				"data-waycraft-skills-stats": true,
				className: "waycraft-skills-stats",
				role: "group",
				"aria-label": t("statsAria")
			}, stat(totals.total, "statSkill", "statSkills"), stat(totals.enabled, "statEnabled", "statEnabled"), stat(totals.disabled, "statDisabled", "statDisabled"), stat(totals.invalid, "statDiagnostic", "statDiagnostics")) : null, regionOf(""), foldersOpen ? foldersDialog() : null, inProject && data.project && !data.project.available ? h("p", { role: "alert" }, `${data.project.name}: ${t(`code.${data.project.code}`)}`) : null, ...visibleSources.filter((x) => !source || x.id === source).map((x) => h("details", {
				key: x.id,
				open: filtering || inProject || !!orgOpen["src:" + x.id],
				onToggle: (e) => {
					const open = !!e.currentTarget?.open;
					if (!!orgOpen["src:" + x.id] !== open) setOrgOpen({
						...orgOpen,
						["src:" + x.id]: open
					});
				},
				className: "waycraft-skills-source",
				"data-off": x.enabled === false ? true : void 0,
				dir: isArabic() ? "rtl" : void 0
			}, h("summary", null, h(SkillsNavIcon, {
				size: 16,
				className: "waycraft-skills-source-icon"
			}), h("span", { className: "waycraft-skills-source-name" }, sourceLabel(x)), h("span", { className: "waycraft-skills-count" }, h("bdi", null, String(view.copies.filter((c) => c.source === x.id).length)), " ", t(view.copies.filter((c) => c.source === x.id).length === 1 ? "statSkill" : "statSkills")), sourceProblems(x.id) ? h("span", {
				className: "waycraft-skills-badge waycraft-skills-badge-warn",
				"data-waycraft-source-problems": true,
				title: t("sourceProblems"),
				onClick: (event) => {
					event.preventDefault?.();
					revealProblems(x.id);
				}
			}, severityIcon("error", {
				className: "waycraft-skills-icon",
				"data-waycraft-skills-icon": "error"
			}), h("bdi", null, String(sourceProblems(x.id))), " ", t("sourceProblems")) : null, h("span", { className: "waycraft-skills-path waycraft-skills-source-path" }, h("bdi", { dir: "ltr" }, x.path)), x.custom ? h("span", { className: "waycraft-skills-badge" }, t("customTag")) : null, data.corrupt || inProject ? null : (() => {
				const writable = !x.readonly && !!validDestination(data, x.id);
				const blockedKey = writable ? null : x.custom ? "createBlockedCustom" : x.readonly ? "createHereBlocked" : "createBlockedTool";
				const label = `${t("createHere")}: ${sourceLabel(x)}`;
				return h("button", {
					type: "button",
					className: "waycraft-skills-icon-btn",
					"aria-label": label,
					title: blockedKey ? t(blockedKey) : t("createHere"),
					disabled: !writable,
					onClick: () => {
						setCreateSource(x.id);
						setCreating(true);
					}
				}, icon(ICONS.filePlus));
			})(), data.corrupt ? null : h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn",
				"aria-label": `${t("addCategoryHere")}: ${sourceLabel(x)}`,
				title: t("newCategory"),
				onClick: () => setCatDialog(x.id)
			}, icon(ICONS.folderPlus)), x.custom || x.overridable ? h("button", {
				type: "button",
				className: "waycraft-skills-icon-btn",
				"aria-label": `${t("editFolder")}: ${sourceLabel(x)}`,
				title: t("editFolder"),
				disabled: data.corrupt,
				onClick: () => {
					setOrgOpen({
						...orgOpen,
						["src:" + x.id]: true
					});
					if (x.custom) setEditing({
						id: x.id,
						label: x.label ?? "",
						group: x.group ?? "",
						path: x.path
					});
					else setRootEdit({
						id: x.id,
						path: x.path
					});
				}
			}, icon(ICONS.folder)) : null, x.readonly ? null : switchControl({
				checked: x.enabled !== false,
				label: `${t("toggleSource")} ${sourceLabel(x)}`,
				title: `${t("toggleSource")} ${sourceLabel(x)}`,
				onToggle: () => toggle("source", x.id, x.enabled === false)
			}), h("span", {
				className: "waycraft-skills-chev",
				"aria-hidden": true
			})), h("div", { className: "waycraft-skills-source-body" }, regionOf(x.id), h("div", { className: "waycraft-skills-source-meta" }, h("p", { className: "waycraft-skills-path" }, x.group ? `${x.group} · ` : null, h("bdi", { dir: "ltr" }, x.path)), x.readonly ? h("p", { className: "waycraft-skills-notice" }, t("readOnlySource")) : null), !inProject && !data.corrupt && !(!x.readonly && validDestination(data, x.id)) ? h("p", {
				className: "waycraft-skills-notice",
				"data-waycraft-create-blocked": x.id
			}, t(x.custom ? "createBlockedCustom" : x.readonly ? "createHereBlocked" : "createBlockedTool")) : null, x.custom ? customControls(x) : rootControls(x), ...sourceRows(x)))), data.corrupt ? h("div", {
				role: "alert",
				className: "waycraft-skills-alert"
			}, t("stateLocked"), h("button", { onClick: () => call({ action: "reload" }).then(setData, load) }, t("reloadState"))) : null, copies.length || scope !== "global" && scope !== "project" ? null : h("p", { className: "waycraft-skills-empty" }, t("empty"))), catDialog ? categoryDialogView(catDialog) : null, ...categoryRowDialogs(), noteDialogView(), detailError && !detail ? h("p", { role: "alert" }, t("error")) : null, detail ? h(CatalogDialog, {
				label: t("details"),
				wide: true,
				onClose: () => setDetail(null)
			}, h("h3", null, detail.name), h("p", null, h("bdi", { dir: "ltr" }, detail.path)), detailError ? h("p", {
				role: "alert",
				className: "waycraft-skills-field-error"
			}, t("error")) : null, h("p", {
				role: "status",
				"aria-live": "polite",
				className: "waycraft-skills-helper"
			}, copiedDetail ? t("copied") : ""), h("button", { onClick: () => copyText(detail.content).then(() => {
				setDetailError(false);
				setCopiedDetail(true);
				if (copiedTimer.current) clearTimeout(copiedTimer.current);
				copiedTimer.current = setTimeout(() => setCopiedDetail(false), 2e3);
			}, () => setDetailError(true)) }, t("copyText")), h("button", {
				className: "waycraft-skills-primary waycraft-skills-dialog-close",
				onClick: () => setDetail(null)
			}, t("close")), h("p", null, `${t("modelInvocation")}: ${detail.author?.modelInvocable ? t("allowed") : t("denied")} · ${t("userInvocation")}: ${detail.author?.userInvocable ? t("allowed") : t("denied")}`), detail.shadowedBy ? h("p", null, `${t("shadowedBy")}: ${detail.shadowedBy}`) : null, detail.description ? h("p", { className: "waycraft-skills-row-desc-full" }, detail.description) : null, ...(detail.diagnostics ?? []).map((x, i) => h("p", {
				key: `${x.code}:${i}`,
				"data-waycraft-diag-level": severityOf(x)
			}, severityOf(x) === "note" && x.code === "linked-outside-root" ? t("linkedReadOnly") : diagnosticText(x))), h("pre", null, detail.content)) : null);
		}
		let placement = "settings";
		let changePlacement = async () => {};
		const placementListeners = /* @__PURE__ */ new Set();
		let layout;
		const notifyPlacement = () => {
			for (const listener of placementListeners) listener();
		};
		function PlacementControl() {
			const [, rerender] = React.useState(0);
			const [problem, setProblem] = React.useState("");
			React.useEffect(() => {
				const listener = () => rerender((n) => n + 1);
				placementListeners.add(listener);
				return () => void placementListeners.delete(listener);
			}, []);
			return h("div", {
				"data-waycraft-skills-placement": true,
				dir: isArabic() ? "rtl" : void 0
			}, h("strong", null, t("placement")), h("p", null, t("placementHint")), ...[
				"both",
				"sidebar",
				"settings"
			].map((value) => h("button", {
				key: value,
				"aria-pressed": placement === value,
				onClick: () => {
					setProblem("");
					changePlacement(value).catch((failure) => setProblem(errorText(failure)));
				}
			}, t(`placement${value[0].toUpperCase()}${value.slice(1)}`))), problem ? h("p", { role: "alert" }, problem) : null);
		}
		const SKILL_ICON_PATHS = ["M12.5113 15.4067C12.4395 15.6249 12.1308 15.6249 12.059 15.4067L11.643 14.1416C11.454 13.567 11.0033 13.1164 10.4288 12.9274L9.16369 12.5113C8.94544 12.4395 8.94544 12.1308 9.16369 12.059L10.4288 11.643C11.0033 11.454 11.454 11.0033 11.643 10.4288L12.059 9.16369C12.1308 8.94544 12.4395 8.94544 12.5113 9.16369L12.9274 10.4288C13.1164 11.0033 13.567 11.454 14.1416 11.643L15.4067 12.059C15.6249 12.1308 15.6249 12.4395 15.4067 12.5113L14.1416 12.9274C13.567 13.1164 13.1164 13.567 12.9274 14.1416L12.5113 15.4067Z", "M9.02246 0.546878C9.9822 0.546878 10.7564 0.545403 11.374 0.612307C12.0042 0.680586 12.5515 0.826244 13.0273 1.17188C13.3052 1.37376 13.5501 1.61868 13.752 1.89649C14.0975 2.37225 14.2432 2.91984 14.3115 3.54981C14.3784 4.16727 14.377 4.94206 14.377 5.90137V8.51367C13.9611 8.29533 13.5071 8.13985 13.0273 8.06055V5.90137C13.0273 4.9121 13.0259 4.22322 12.9688 3.69532C12.9129 3.18044 12.8098 2.89782 12.6592 2.69043C12.5406 2.52724 12.3966 2.38326 12.2334 2.26465C12.026 2.11404 11.7437 2.0109 11.2285 1.95508C10.7005 1.89789 10.0122 1.89649 9.02246 1.89649H6.55371C5.56395 1.89649 4.87569 1.89787 4.34766 1.95508C3.83242 2.01092 3.55022 2.11398 3.34278 2.26465C3.17953 2.38329 3.03564 2.52719 2.91699 2.69043C2.76642 2.89782 2.66325 3.18042 2.60742 3.69532C2.55027 4.22322 2.54883 4.9121 2.54883 5.90137V10.0986C2.54883 11.0878 2.55031 11.7768 2.60742 12.3047C2.66326 12.8196 2.76642 13.1032 2.91699 13.3105C3.03558 13.4736 3.17966 13.6178 3.34278 13.7363C3.5502 13.8869 3.83265 13.9901 4.34766 14.0459C4.87568 14.1031 5.56398 14.1035 6.55371 14.1035H8.08399C8.27443 14.6025 8.55077 15.0585 8.89551 15.4541H6.55371C5.59402 15.4541 4.81976 15.4546 4.20215 15.3877C3.57204 15.3194 3.02468 15.1738 2.54883 14.8281C2.27111 14.6263 2.02606 14.3813 1.82422 14.1035C1.47883 13.6278 1.33293 13.08 1.26465 12.4502C1.19783 11.8327 1.19922 11.0579 1.19922 10.0986V5.90137C1.19922 4.94206 1.1978 4.16727 1.26465 3.54981C1.33293 2.91984 1.47883 2.37225 1.82422 1.89649C2.02606 1.61868 2.27111 1.37376 2.54883 1.17188C3.02468 0.826244 3.57204 0.680586 4.20215 0.612307C4.81976 0.545403 5.59402 0.546878 6.55371 0.546878H9.02246Z"];
		const SkillsNavIcon = (props) => h("svg", {
			xmlns: "http://www.w3.org/2000/svg",
			viewBox: "0 0 16 16",
			width: props?.size ?? 16,
			height: props?.size ?? 16,
			fill: "currentColor",
			"aria-hidden": true,
			className: props?.className
		}, ...SKILL_ICON_PATHS.map((d) => h("path", {
			key: d.slice(0, 12),
			d
		})));
		const sidebarIcon = () => h(SkillsNavIcon);
		effect(() => {
			let offConfig, offSettings, offSettingsIcon, offMain, offSidebar, disposed = false;
			const controller = new AbortController();
			const inSettings = () => placement === "both" || placement === "settings";
			const inSidebar = () => placement === "both" || placement === "sidebar";
			const reconcile = () => {
				if (disposed) return;
				if (inSettings() && !offSettings) offSettings = ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: "waycraft-skills",
					order: 91,
					label: () => t("title")
				}, Section));
				else if (!inSettings() && offSettings) {
					offSettings();
					offSettings = void 0;
				}
				if (inSettings() && !offSettingsIcon) try {
					if (typeof ctx.slots?.inject === "function") offSettingsIcon = ctx.slots.inject("settings.section.icon", () => ctx.slots.register({
						name: "settings.section.icon",
						id: "waycraft-skills",
						locale: "waycraft.skills"
					}, SkillsNavIcon));
				} catch {}
				else if (!inSettings() && offSettingsIcon) {
					try {
						offSettingsIcon();
					} catch {}
					offSettingsIcon = void 0;
				}
				if (inSidebar() && !offSidebar) {
					offMain = ctx.slots.register({
						name: "main",
						key: "waycraft-skills",
						locale: "waycraft.skills",
						inject: () => ({})
					}, () => h(Section));
					offSidebar = ctx.slots.register({
						name: "sidebar.panellist",
						id: "waycraft-skills",
						order: 92,
						label: () => t("title"),
						locale: "waycraft.skills"
					}, sidebarIcon);
					mapLegacyPanel();
				} else if (!inSidebar() && offSidebar) {
					try {
						if (layout?.panelInfo?.getSnapshot?.().activePanelId === "waycraft-skills") layout.selectPanel?.(null);
					} catch {}
					offSidebar?.();
					offMain?.();
					offSidebar = offMain = void 0;
				}
			};
			const apply = (next) => {
				if (typeof next === "string" && [
					"both",
					"sidebar",
					"settings"
				].includes(next)) {
					if (next !== placement) {
						placement = next;
						notifyPlacement();
					}
				}
				reconcile();
			};
			changePlacement = async (value) => {
				const previous = placement;
				placement = value;
				notifyPlacement();
				reconcile();
				try {
					apply((await call({
						action: "placement",
						location: value
					})).placement);
				} catch (failure) {
					placement = previous;
					notifyPlacement();
					reconcile();
					throw failure;
				}
			};
			const mapLegacyPanel = () => {
				try {
					const active = layout?.panelInfo?.getSnapshot?.().activePanelId;
					const mapped = typeof active === "string" ? LEGACY_PANEL_IDS[active] : void 0;
					if (mapped !== void 0) layout.selectPanel?.(mapped);
				} catch {}
			};
			ctx.inject?.(["layout"], (injected) => {
				layout = injected?.layout ?? injected;
				mapLegacyPanel();
			});
			let delay = 3e3;
			let timer;
			const schedule = () => {
				if (!disposed) timer = setTimeout(() => void probe(), delay);
			};
			const probe = () => call({
				action: "ping",
				include: "placement"
			}, controller.signal).then((result) => {
				delay = 3e3;
				if (disposed) return;
				if (!offConfig) offConfig = ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
					name: "plugins.bundle.config",
					key: "waycraft-skills",
					locale: "waycraft.skills"
				}, (props) => props?.view === "summary" ? null : h(PlacementControl)));
				apply(result?.placement);
			}).catch(() => {
				delay = Math.min(delay * 2, 6e4);
			}).finally(schedule);
			probe();
			return () => {
				disposed = true;
				changePlacement = async () => {};
				controller.abort();
				clearTimeout(timer);
				offConfig?.();
				offSettings?.();
				try {
					offSettingsIcon?.();
				} catch {}
				offMain?.();
				offSidebar?.();
			};
		}, "waycraft-skills presence");
	}
}

//#endregion
//#region src/mcp-browser.ts
function applyMcp(root) {
	const fail = (error) => console.error("dsh-waycraft: MCP manager setup failed", error);
	try {
		Promise.resolve(root.inject([
			"slots",
			"locale",
			"connection"
		], (ctx) => {
			try {
				setupMcp(ctx, fail);
			} catch (error) {
				fail(error);
			}
		})).catch(fail);
	} catch (error) {
		fail(error);
	}
}
const MCP_ROUTE = "/api/waycraft-mcp.manage";
const MCP_HEADER = "x-waycraft-mcp";
const NS = "waycraft.mcp";
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const CREDENTIAL_REF = /\$\{credential:[^}]+\}/;
const SENSITIVE_KEY = /(token|secret|password|passwd|api.?key|apikey|auth|authorization|cookie|credential|bearer|private.?key|access.?key|client.?secret|session)/i;
const SECRET_VALUE = /(sk-[A-Za-z0-9]{12,}|gh[pousr]_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|AIza[0-9A-Za-z\-_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|Bearer\s+[A-Za-z0-9\-._~+/]+=*|Basic\s+[A-Za-z0-9+/]+=+)/;
const REDACTED = "[REDACTED]";
/** True when a value would be stored as plaintext: not a ${credential:REF} and sensitive by key or secret-shaped. */
function isPlainSecret(key, value) {
	return !CREDENTIAL_REF.test(value) && (SENSITIVE_KEY.test(key) || SECRET_VALUE.test(value));
}
function isHttpUrl(value) {
	return /^https?:\/\/[^\s/?#]+(?:[/?#]\S*)?$/i.test(value);
}
const SENSITIVE_QUERY = /^(token|key|secret|password|passwd|pwd|auth|api_key|apikey|access_token|client_secret|sig|signature)$/i;
const SENSITIVE_FLAG = /^--?(?:[a-z0-9]+[-_])*(token|secret|password|passwd|pwd|auth|api[-_]?key|access[-_]?key|client[-_]?secret)$/i;
const TECH_TOKEN = /(\$\{credential:[^}]*\}|\[REDACTED\]|KEY=VALUE|Name: value|مفتاح=قيمة|اسم: قيمة)/;
const IMMEDIATE_ERRORS = [
	"errSecretLiteral",
	"errSecretUrl",
	"errSecretArg",
	"errRedactedLiteral"
];
function safeDecode(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
/** Copy of a URL for display: userinfo and sensitive query values are masked; ${credential:REF} is kept. */
function maskUrl(url) {
	return url.replace(/^(https?:\/\/)([^\/?#]*)@/i, (m, scheme, userinfo) => CREDENTIAL_REF.test(safeDecode(userinfo)) ? m : `${scheme}${REDACTED}@`).replace(/([?&])([^=&#]+)=([^&#]*)/g, (m, sep, name, value) => SENSITIVE_QUERY.test(name) && value && !CREDENTIAL_REF.test(safeDecode(value)) ? `${sep}${name}=${REDACTED}` : m);
}
/** True when a URL would store a secret: userinfo, a sensitive query value, or a secret-shaped literal. */
function urlHasSecret(url) {
	return maskUrl(url) !== url || SECRET_VALUE.test(url) && !CREDENTIAL_REF.test(url);
}
/** Copy of args for display: secret-shaped literals and literal values after a sensitive flag are masked. */
function maskArgs(args) {
	const literal = (v) => v !== "" && !v.startsWith("-") && !CREDENTIAL_REF.test(v);
	return args.map((arg, i) => {
		const eq = arg.indexOf("=");
		if (arg.startsWith("-") && eq > 0 && SENSITIVE_FLAG.test(arg.slice(0, eq)) && literal(arg.slice(eq + 1))) return `${arg.slice(0, eq)}=${REDACTED}`;
		if (i > 0 && SENSITIVE_FLAG.test(args[i - 1]) && literal(arg)) return REDACTED;
		if (!CREDENTIAL_REF.test(arg) && SECRET_VALUE.test(arg)) return REDACTED;
		return arg;
	});
}
function argsHaveSecret(args) {
	return maskArgs(args).some((a, i) => a !== args[i]);
}
/** Saved values the host masked as [REDACTED], counted per config key. Host list output masks them. */
function keptSecrets(original) {
	const c = original?.config || {};
	const count = (values) => values.filter((v) => v === REDACTED).length;
	return {
		env: count(Object.values(c.env || {})),
		headers: count(Object.values(c.headers || {})),
		args: count(Array.isArray(c.args) ? c.args : []),
		url: c.url === REDACTED ? 1 : 0,
		command: c.command === REDACTED ? 1 : 0
	};
}
/** Copy of a config for display only: plaintext secrets in env, headers, args and the URL are masked. */
function redactForPreview(config) {
	const mask = (map) => map ? Object.fromEntries(Object.entries(map).map(([k, v]) => [k, isPlainSecret(k, v) ? REDACTED : v])) : map;
	return {
		...config,
		url: config.url === void 0 ? void 0 : maskUrl(config.url),
		args: config.args === void 0 ? void 0 : maskArgs(config.args),
		env: mask(config.env),
		headers: mask(config.headers)
	};
}
function setupMcp(ctx, fail) {
	const effect = (run, label) => {
		try {
			const r = ctx.effect(run, label);
			Promise.resolve(r).catch(fail);
			return r;
		} catch (error) {
			fail(error);
		}
	};
	const React = require("react");
	const h = React.createElement;
	let primitives$1 = {};
	try {
		primitives$1 = require("@deepseek-ai/dsh-client-ui-primitives") || {};
	} catch {}
	function tooltip(label, anchor) {
		if (!primitives$1.Tooltip) return anchor;
		return h(primitives$1.Tooltip, {
			label,
			side: "bottom",
			portal: true
		}, React.cloneElement(anchor, { title: void 0 }));
	}
	const en$1 = {
		title: "MCP servers",
		description: "Manage MCP servers for this DSH profile. Management actions require Owner authorization.",
		areaServers: "Servers",
		areaDiscoverImport: "Discover & Import",
		areaTrash: "Trash",
		search: "Search servers",
		filterAll: "All",
		filterConnected: "Connected (last test)",
		filterDisconnected: "Disconnected (last test)",
		filterNeedsTrust: "Needs trust review",
		filterAllTransports: "All transports",
		filterAllStatuses: "All statuses",
		filterAllTrust: "All trust states",
		filterEnabled: "Enabled",
		filterOff: "Configured off",
		filterTrusted: "Trusted",
		filterTrashed: "Trash",
		addServer: "Add server",
		refresh: "Refresh",
		empty: "No MCP servers configured.",
		emptyTrash: "Trash is empty.",
		loading: "Loading MCP servers…",
		error: "Unable to load MCP servers.",
		unauthorized: "Owner authorization required. Paired clients cannot manage MCP servers.",
		retry: "Retry",
		registryTitle: "Official MCP Registry",
		registrySearch: "Search Registry",
		registryQuery: "Search server names",
		registryNext: "Next page",
		registryDetails: "Details",
		registryReview: "Review configuration",
		registryNote: "Catalog metadata is not a trust guarantee. Review configuration before adding; nothing is installed or connected automatically.",
		registryEmpty: "No servers found. Try another search.",
		registryManual: "No supported HTTP remote. Configure this server manually; package commands are never guessed or installed.",
		registryHeaders: "Required headers need credential references in the configuration form. Replace all URL placeholders before saving.",
		registryTransport: "HTTP endpoint",
		discoverTitle: "Discover MCP configs",
		discoverNote: "Scans only Owner-approved folders for known MCP config files. Results are candidates only; no servers are executed or activated.",
		discoverRoots: "Approved search roots (one per line)",
		discoverScan: "Scan approved roots",
		discoverEmpty: "No discovery results yet.",
		discoverCandidate: "Candidate",
		discoverMalformed: "Malformed",
		discoverOversized: "Oversized",
		discoverUnreadable: "Unreadable",
		discoverSkipped: "Skipped",
		discoverCandidatesNote: "Candidates are presented for explicit review and registration. Discovery does not auto-activate servers.",
		importTitle: "Import MCP configuration",
		importNote: "Paste supported JSON. Preview is required before explicit registration approval. Import never executes servers and does not imply trust.",
		importJson: "Paste JSON (optional)",
		importFile: "Choose JSON file",
		importDrop: "Drop an MCP configuration JSON file here",
		importFormats: "Supported: .json files containing an mcpServers map or a Waycraft MCP v1 envelope. One file at a time; maximum 24 KiB. YAML, ZIP and server.json registry manifests are not supported.",
		importFileError: "Choose one valid JSON configuration file, no larger than 24 KiB.",
		importDiscard: "Discard this import preview and selected configuration?",
		toolsReadError: "Unable to read saved tools. Try again.",
		importPreview: "Preview import",
		importApproveRegister: "Register approved candidates",
		importNoPreview: "Preview the import before registration.",
		importSelect: "Approve",
		importConflictSkip: "Skip existing",
		importConflictReplace: "Replace existing (explicit)",
		importValid: "Valid",
		importInvalid: "Invalid",
		importConflict: "Conflict",
		importCredRefs: "Credential refs",
		importRegistered: "Registration result",
		trashNote: "Trash is operationally meaningful: trashed servers are inactive and removed from the active list. Restore revalidates trust; permanent delete requires explicit confirmation.",
		trashMoveAction: "Move selected to Trash",
		trashRestoreAction: "Restore selected",
		trashPermanentAction: "Permanently delete selected",
		overview: "Overview",
		tools: "Tools",
		configuration: "Configuration",
		security: "Security & activity",
		status: "Status",
		savedState: "Saved",
		runtimeState: "Runtime application",
		trustState: "Trust",
		ownership: "Ownership",
		transport: "Transport",
		actions: "Actions",
		testConnection: "Test connection",
		approveTrust: "Approve reviewed config",
		trustInvalidated: "Config changed; review and approve again before operational actions.",
		trustUntrusted: "Untrusted. Saving does not imply trust.",
		trustTrusted: "Trusted for reviewed config fingerprint.",
		moveToTrash: "Move to Trash",
		restore: "Restore",
		permanentDelete: "Permanently delete",
		confirmTrash: "Move this server to Trash? It becomes operationally inactive and can be restored.",
		confirmPermanent: "Permanently delete this server configuration? This cannot be undone. Shared credential references are not deleted.",
		cancel: "Cancel",
		confirm: "Confirm",
		configDesiredDisabled: "Config disabled (desired state)",
		configDesiredEnabled: "Config enabled (desired state)",
		runtimeNote: "V1 shows server configuration, trust, and observed test results. It does not claim runtime tool enforcement guarantees beyond verified host behavior.",
		readOnlyTools: "Read-only. No per-tool enable/disable controls in V1.",
		listTools: "List cached tools",
		refreshTools: "Refresh tools (explicit)",
		toolsNever: "No cached enumeration yet. Use explicit refresh/test.",
		toolsFresh: "Fresh",
		toolsStale: "Stale",
		toolsError: "Enumeration error",
		toolName: "Tool",
		toolDescription: "Description",
		schema: "Input schema",
		noTools: "No tools cached.",
		save: "Save",
		serverName: "Server name",
		command: "Command",
		args: "Arguments",
		url: "URL",
		cwd: "Working directory",
		limitation: "Limitation",
		trashedAt: "Moved to Trash",
		fingerprint: "Reviewed fingerprint",
		opSuccess: "Done.",
		opFailed: "Action failed.",
		ownershipWaycraft: "Waycraft-managed",
		ownershipPreexisting: "Pre-existing DSH config",
		ownershipOther: "Externally owned",
		ownershipUnknown: "Unknown",
		tabs: "Server details",
		filters: "Filters",
		serverList: "MCP server list",
		trashList: "Trashed MCP servers",
		refreshAria: "Refresh servers",
		more: "More actions",
		editServer: "Edit",
		addTitle: "Add MCP server",
		editTitle: "Edit MCP server",
		formNote: "Saving stores the configuration only. It does not trust, connect or start the server. Review and approve the saved config, then test the connection separately.",
		transportLabel: "Transport",
		transportStdio: "Local command (stdio)",
		transportHttp: "Remote URL (streamable HTTP)",
		nameHelp: "Letters, digits, dot, underscore or hyphen; starts with a letter or digit. Cannot be changed after creation.",
		nameLocked: "Server name is fixed after creation.",
		argsHelp: "One argument per line. Arguments containing spaces are kept as typed.",
		errCleared: "Removing a saved value is not supported yet. Enter a new value or keep the saved one.",
		noChanges: "No changes to save.",
		saveDone: "Configuration saved. Review and approve it, then test the connection separately.",
		envHelp: "One KEY=VALUE per line. Store secrets as ${credential:REF} references, not plain values.",
		headersHelp: "One Name: value per line. Store secrets as ${credential:REF} references, not plain values.",
		advanced: "Advanced",
		startupTimeoutMs: "Startup timeout (ms)",
		toolCallTimeoutMs: "Tool call timeout (ms)",
		preview: "Config preview",
		saveServer: "Save configuration",
		saving: "Saving…",
		errRequired: "Required.",
		errNameInvalid: "Use letters, digits, dot, underscore or hyphen; start with a letter or digit (max 128).",
		errUrlInvalid: "Enter a valid http:// or https:// URL.",
		errLineInvalid: "Use KEY=VALUE on each line.",
		errHeaderInvalid: "Use Name: value on each line.",
		errTimeoutInvalid: "Enter a whole number of milliseconds (0 or more).",
		errSecretLiteral: "This looks like a plaintext secret. Replace it with a ${credential:REF} reference before saving.",
		errSecretUrl: "The URL contains a password, token or other secret. Use a ${credential:REF} reference instead.",
		errSecretArg: "An argument looks like a plaintext secret. Replace it with a ${credential:REF} reference before saving.",
		errRedactedLiteral: "The placeholder [REDACTED] is not a value. Enter a ${credential:REF} reference instead.",
		keptNote: "saved secret value(s) kept as stored.",
		conflictReloaded: "Configuration changed on disk - reloaded; review and save again.",
		importPartialWarning: "Registration finished with issues: some candidates were skipped, rejected or failed. Review the result below.",
		errExists: "A server with this name already exists. Choose another name.",
		envLabel: "Environment (KEY=VALUE)",
		headersLabel: "Headers (Name: value)",
		errCommandRequired: "Command is required for local (stdio) servers.",
		errUrlRequired: "URL is required for remote (HTTP) servers.",
		formInvalid: "Fix the highlighted fields before saving.",
		dirtyCancel: "Discard unsaved changes?",
		discard: "Discard",
		keepEditing: "Keep editing",
		dirtyCancelBody: "Your changes to this server have not been saved.",
		dismiss: "Dismiss",
		toastTrashed: "Moved to Trash",
		toastRestored: "Restored (disabled until you re-approve)",
		toastDeleted: "Permanently deleted",
		statusSaved: "Saved to configuration",
		statusNotSaved: "Not saved",
		statusRestart: "Restart may be required — runtime application not verified",
		statusRestartNote: "Waycraft saves the config; it cannot confirm the running DSH runtime has picked it up.",
		connectionOff: "Configured off; runtime state not verified",
		connectionReview: "Trust review required; connection not verified",
		connectionPassed: "Last connection check succeeded; not a live monitor",
		connectionFailed: "Last connection check failed; not a live monitor",
		connectionUnknown: "Connection unknown; no saved connection check",
		checkedAt: "Last checked: {time}",
		testNever: "No saved connection check",
		testBadgeNever: "Not tested",
		testPassed: "Test passed",
		testFailed: "Test failed",
		testOutcome: "Test result",
		testPendingNote: "Run Test connection to check the server. A test does not approve trust.",
		configOff: "Configured off",
		configEnabled: "Enabled in config",
		trustBadgeTrusted: "Trusted",
		trustBadgeUntrusted: "Untrusted",
		statServers: "servers",
		statTrusted: "trusted",
		statNeedsReview: "need review",
		statOff: "configured off",
		configOffHelp: "This switch only records the config flag. DSH runtime enforcement is not verified, so the server may still run.",
		importResultRegistered: "Registered {n} server(s).",
		importResultReplaced: "Replaced {n} existing server(s).",
		importResultSkipped: "Skipped {n} because a server with that name already exists. Choose Replace to overwrite it.",
		importResultRejected: "Rejected {n} candidate(s) that failed validation.",
		importResultFailed: "Failed {n} candidate(s) with an error.",
		importResultNone: "Nothing was registered.",
		importResultNote: "Registration does not trust or start any server. Review and test them separately."
	};
	const ar = {
		title: "خوادم MCP",
		description: "إدارة خوادم MCP لملف DSH هذا. إجراءات الإدارة تتطلب تفويض المالك.",
		areaServers: "الخوادم",
		areaDiscoverImport: "الاكتشاف والاستيراد",
		areaTrash: "سلة المهملات",
		search: "بحث في الخوادم",
		filterAll: "الكل",
		filterConnected: "متصل (آخر اختبار)",
		filterDisconnected: "غير متصل (آخر اختبار)",
		filterNeedsTrust: "يحتاج مراجعة الثقة",
		filterAllTransports: "كل وسائل النقل",
		filterAllStatuses: "كل الحالات",
		filterAllTrust: "كل حالات الثقة",
		filterEnabled: "مفعّل",
		filterOff: "معطّل في الإعداد",
		filterTrusted: "موثوق",
		filterTrashed: "سلة المهملات",
		addServer: "إضافة خادم",
		refresh: "تحديث",
		empty: "لا توجد خوادم MCP مُهيأة.",
		emptyTrash: "سلة المهملات فارغة.",
		loading: "جارٍ تحميل خوادم MCP…",
		error: "تعذّر تحميل خوادم MCP.",
		unauthorized: "مطلوب تفويض المالك. لا يمكن للعملاء المقترنين إدارة خوادم MCP.",
		retry: "إعادة المحاولة",
		registryTitle: "سجل MCP الرسمي",
		registrySearch: "بحث في السجل",
		registryQuery: "ابحث باسم الخادم",
		registryNext: "الصفحة التالية",
		registryDetails: "التفاصيل",
		registryReview: "مراجعة الإعداد",
		registryNote: "بيانات السجل ليست ضمانًا للثقة. راجع الإعداد قبل الإضافة؛ لا يتم تثبيت أي شيء أو الاتصال تلقائيًا.",
		registryEmpty: "لم يتم العثور على خوادم. جرّب بحثًا آخر.",
		registryManual: "لا توجد نقطة HTTP مدعومة. أعدّ الخادم يدويًا؛ لا نخمن أو نثبت أوامر الحزم.",
		registryHeaders: "الترويسات المطلوبة تحتاج مراجع بيانات اعتماد في نموذج الإعداد. استبدل جميع متغيرات الرابط قبل الحفظ.",
		registryTransport: "نقطة HTTP",
		discoverTitle: "اكتشاف إعدادات MCP",
		discoverNote: "يفحص فقط المجلدات التي وافق عليها المالك بحثًا عن ملفات إعداد MCP المعروفة. النتائج مرشحة فقط؛ لا يتم تنفيذ أي خادم أو تفعيله.",
		discoverRoots: "جذور البحث المعتمدة (سطر لكل جذر)",
		discoverScan: "فحص الجذور المعتمدة",
		discoverEmpty: "لا توجد نتائج اكتشاف بعد.",
		discoverCandidate: "مرشح",
		discoverMalformed: "تالف",
		discoverOversized: "كبير جدًا",
		discoverUnreadable: "غير قابل للقراءة",
		discoverSkipped: "تم التخطي",
		discoverCandidatesNote: "تُعرض المرشحات للمراجعة والتسجيل الصريح. الاكتشاف لا يفعّل الخوادم تلقائيًا.",
		importTitle: "استيراد إعداد MCP",
		importNote: "ألصق JSON مدعومًا. المعاينة مطلوبة قبل موافقة التسجيل الصريحة. الاستيراد لا ينفّذ الخوادم ولا يعني الثقة.",
		importJson: "لصق JSON (اختياري)",
		importFile: "اختيار ملف JSON",
		importDrop: "أفلت ملف إعداد MCP بصيغة JSON هنا",
		importFormats: "المدعوم: ملفات .json تحتوي على خريطة mcpServers أو إعداد Waycraft MCP v1. ملف واحد بحد أقصى 24 KiB. لا ندعم YAML أو ZIP أو ملفات server.json الخاصة بالسجلات.",
		importFileError: "اختر ملف إعداد JSON واحدًا صالحًا بحجم لا يتجاوز 24 KiB.",
		importDiscard: "تجاهل معاينة الاستيراد والإعداد المحدد؟",
		toolsReadError: "تعذرت قراءة الأدوات المحفوظة. حاول مجددًا.",
		importPreview: "معاينة الاستيراد",
		importApproveRegister: "تسجيل المرشحين المعتمدين",
		importNoPreview: "عاين الاستيراد قبل التسجيل.",
		importSelect: "اعتماد",
		importConflictSkip: "تخطي الموجود",
		importConflictReplace: "استبدال الموجود (صريح)",
		importValid: "صالح",
		importInvalid: "غير صالح",
		importConflict: "تعارض",
		importCredRefs: "مراجع الاعتماد",
		importRegistered: "نتيجة التسجيل",
		trashNote: "سلة المهملات ذات معنى تشغيلي: الخوادم المنقولة إليها غير نشطة ومزالة من القائمة النشطة. الاستعادة تعيد التحقق من الثقة؛ الحذف النهائي يتطلب تأكيدًا صريحًا.",
		trashMoveAction: "نقل المحدد إلى سلة المهملات",
		trashRestoreAction: "استعادة المحدد",
		trashPermanentAction: "حذف المحدد نهائيًا",
		overview: "نظرة عامة",
		tools: "الأدوات",
		configuration: "الإعدادات",
		security: "الأمان والنشاط",
		status: "الحالة",
		savedState: "الحفظ",
		runtimeState: "تطبيق وقت التشغيل",
		trustState: "الثقة",
		ownership: "الملكية",
		transport: "النقل",
		actions: "الإجراءات",
		testConnection: "اختبار الاتصال",
		approveTrust: "اعتماد الإعداد المُراجع",
		trustInvalidated: "تغيّر الإعداد؛ راجع واعتمد مرة أخرى قبل الإجراءات التشغيلية.",
		trustUntrusted: "غير موثوق. الحفظ لا يعني الثقة.",
		trustTrusted: "موثوق لبصمة الإعداد المُراجَع.",
		moveToTrash: "نقل إلى سلة المهملات",
		restore: "استعادة",
		permanentDelete: "حذف نهائي",
		confirmTrash: "نقل هذا الخادم إلى سلة المهملات؟ سيصبح غير نشط تشغيليًا ويمكن استعادته.",
		confirmPermanent: "حذف إعداد هذا الخادم نهائيًا؟ لا يمكن التراجع. لن تُحذف مراجع بيانات الاعتماد المشتركة.",
		cancel: "إلغاء",
		confirm: "تأكيد",
		configDesiredDisabled: "الإعداد معطّل (حالة مرغوبة)",
		configDesiredEnabled: "الإعداد مفعّل (حالة مرغوبة)",
		runtimeNote: "يعرض V1 إعداد الخادم والثقة ونتائج الاختبار الملاحظة. ولا يدّعي ضمانات تنفيذ أدوات وقت التشغيل خارج السلوك المضيف المُتحقق منه.",
		readOnlyTools: "للقراءة فقط. لا توجد عناصر تحكم تفعيل/تعطيل لكل أداة في V1.",
		listTools: "عرض الأدوات المخزنة مؤقتًا",
		refreshTools: "تحديث الأدوات (صريح)",
		toolsNever: "لا يوجد تعداد مخزن مؤقتًا بعد. استخدم التحديث/الاختبار الصريح.",
		toolsFresh: "حديث",
		toolsStale: "قديم",
		toolsError: "خطأ في التعداد",
		toolName: "الأداة",
		toolDescription: "الوصف",
		schema: "مخطط الإدخال",
		noTools: "لا توجد أدوات مخزنة مؤقتًا.",
		save: "حفظ",
		serverName: "اسم الخادم",
		command: "الأمر",
		args: "المعاملات",
		url: "الرابط",
		cwd: "مجلد العمل",
		limitation: "قيد",
		trashedAt: "نُقل إلى سلة المهملات",
		fingerprint: "بصمة المراجعة",
		opSuccess: "تم.",
		opFailed: "فشل الإجراء.",
		ownershipWaycraft: "تُديره Waycraft",
		ownershipPreexisting: "إعداد DSH موجود مسبقًا",
		ownershipOther: "مملوك خارجيًا",
		ownershipUnknown: "غير معروف",
		tabs: "تفاصيل الخادم",
		filters: "عوامل التصفية",
		serverList: "قائمة خوادم MCP",
		trashList: "خوادم MCP في سلة المهملات",
		refreshAria: "تحديث الخوادم",
		more: "المزيد من الإجراءات",
		editServer: "تعديل",
		addTitle: "إضافة خادم MCP",
		editTitle: "تعديل خادم MCP",
		formNote: "الحفظ يخزّن الإعداد فقط ولا يمنح الثقة ولا يتصل بالخادم ولا يشغّله. راجع الإعداد المحفوظ واعتمده، ثم اختبر الاتصال بشكل منفصل.",
		transportLabel: "النقل",
		transportStdio: "أمر محلي (stdio)",
		transportHttp: "رابط بعيد (HTTP متدفق)",
		nameHelp: "أحرف وأرقام ونقطة وشرطة سفلية أو شرطة. يبدأ بحرف أو رقم. لا يمكن تغييره بعد الإنشاء.",
		nameLocked: "اسم الخادم ثابت بعد الإنشاء.",
		argsHelp: "معامل واحد في كل سطر. تُحفظ المعاملات التي تحتوي مسافات كما كُتبت.",
		errCleared: "إزالة قيمة محفوظة غير مدعومة حاليًا. أدخل قيمة جديدة أو أبقِ القيمة المحفوظة.",
		noChanges: "لا توجد تغييرات للحفظ.",
		saveDone: "تم حفظ الإعداد. راجعه واعتمده، ثم اختبر الاتصال بشكل منفصل.",
		envHelp: "مفتاح=قيمة واحد في كل سطر. خزّن الأسرار كمراجع ${credential:REF} وليس كقيم نصية.",
		headersHelp: "اسم: قيمة واحدة في كل سطر. خزّن الأسرار كمراجع ${credential:REF} وليس كقيم نصية.",
		advanced: "خيارات متقدمة",
		startupTimeoutMs: "مهلة البدء (ms)",
		toolCallTimeoutMs: "مهلة استدعاء الأداة (ms)",
		preview: "معاينة الإعداد",
		saveServer: "حفظ الإعداد",
		saving: "جارٍ الحفظ…",
		errRequired: "مطلوب.",
		errNameInvalid: "استخدم أحرفًا وأرقامًا ونقطة وشرطة سفلية أو شرطة؛ ابدأ بحرف أو رقم (128 كحد أقصى).",
		errUrlInvalid: "أدخل رابطًا صالحًا يبدأ بـ http:// أو https://.",
		errLineInvalid: "استخدم مفتاح=قيمة في كل سطر.",
		errHeaderInvalid: "استخدم اسم: قيمة في كل سطر.",
		errTimeoutInvalid: "أدخل عددًا صحيحًا من المللي ثانية (0 أو أكثر).",
		errSecretLiteral: "يبدو هذا سرًا نصيًا. استبدله بمرجع ${credential:REF} قبل الحفظ.",
		errSecretUrl: "يحتوي الرابط على كلمة مرور أو رمز أو سر آخر. استخدم مرجع ${credential:REF} بدلًا من ذلك.",
		errSecretArg: "يبدو أحد المعاملات سرًا نصيًا. استبدله بمرجع ${credential:REF} قبل الحفظ.",
		errRedactedLiteral: "العنصر [REDACTED] ليس قيمة. أدخل مرجع ${credential:REF} بدلًا منه.",
		keptNote: "قيمة أو قيم سرية محفوظة كما هي.",
		conflictReloaded: "تغيّر الإعداد على القرص — أُعيد التحميل. راجعه ثم احفظ مرة أخرى.",
		importPartialWarning: "انتهى التسجيل مع مشكلات: تم تخطي بعض المرشحين أو رفضهم أو فشلهم. راجع النتيجة أدناه.",
		errExists: "يوجد خادم بهذا الاسم بالفعل. اختر اسمًا آخر.",
		envLabel: "متغيرات البيئة (مفتاح=قيمة)",
		headersLabel: "الترويسات (اسم: قيمة)",
		errCommandRequired: "الأمر مطلوب للخوادم المحلية (stdio).",
		errUrlRequired: "الرابط مطلوب للخوادم البعيدة (HTTP).",
		formInvalid: "صحّح الحقول المعلَّمة قبل الحفظ.",
		dirtyCancel: "تجاهل التغييرات غير المحفوظة؟",
		discard: "تجاهل",
		keepEditing: "متابعة التحرير",
		dirtyCancelBody: "لم يتم حفظ تغييراتك على هذا الخادم.",
		dismiss: "إغلاق",
		toastTrashed: "نُقل إلى سلة المهملات",
		toastRestored: "تمت الاستعادة (معطّل حتى تعتمده من جديد)",
		toastDeleted: "تم الحذف نهائيًا",
		statusSaved: "محفوظ في الإعداد",
		statusNotSaved: "غير محفوظ",
		statusRestart: "قد يلزم إعادة التشغيل — لم يتم التحقق من تطبيقه على وقت التشغيل",
		statusRestartNote: "تحفظ Waycraft الإعداد؛ ولا تستطيع التأكد من أن وقت تشغيل DSH الجاري قد التقطه.",
		connectionOff: "معطّل في الإعداد؛ لم يتم التحقق من حالة التشغيل",
		connectionReview: "مراجعة الثقة مطلوبة؛ لم يتم التحقق من الاتصال",
		connectionPassed: "نجح آخر فحص اتصال؛ ليست مراقبة مباشرة",
		connectionFailed: "فشل آخر فحص اتصال؛ ليست مراقبة مباشرة",
		connectionUnknown: "حالة الاتصال غير معروفة؛ لا يوجد فحص اتصال محفوظ",
		checkedAt: "آخر فحص: {time}",
		testNever: "لا يوجد فحص اتصال محفوظ",
		testBadgeNever: "غير مُختبر",
		testPassed: "نجح الاختبار",
		testFailed: "فشل الاختبار",
		testOutcome: "نتيجة الاختبار",
		testPendingNote: "شغّل اختبار الاتصال للتحقق من الخادم. الاختبار لا يعتمد الثقة.",
		configOff: "مُعطّل في الإعداد",
		configEnabled: "مفعّل في الإعداد",
		trustBadgeTrusted: "موثوق",
		trustBadgeUntrusted: "غير موثوق",
		statServers: "خوادم",
		statTrusted: "موثوقة",
		statNeedsReview: "تحتاج مراجعة",
		statOff: "مُعطّلة في الإعداد",
		configOffHelp: "هذا المفتاح يسجّل علامة الإعداد فقط. فرض التشغيل في DSH غير متحقق منه، لذا قد يظل الخادم يعمل.",
		importResultRegistered: "تم تسجيل {n} خادم.",
		importResultReplaced: "تم استبدال {n} خادم موجود.",
		importResultSkipped: "تم تخطي {n} لأن خادمًا بهذا الاسم موجود. اختر «استبدال» لكتابته فوقه.",
		importResultRejected: "تم رفض {n} مرشح فشل في التحقق.",
		importResultFailed: "فشل {n} مرشح بسبب خطأ.",
		importResultNone: "لم يتم تسجيل أي شيء.",
		importResultNote: "التسجيل لا يعتمد الثقة ولا يشغّل أي خادم. راجعها واختبرها بشكل منفصل."
	};
	effect(() => ctx.locale.register(NS, {
		en: en$1,
		ar
	}), "dsh-waycraft: mcp dictionaries");
	const t = ctx.locale.bind(NS);
	const isArabic = () => ctx.locale.language?.getSnapshot?.() === "ar";
	async function rpc(action, body = {}, signal) {
		const response = await fetch(MCP_ROUTE, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				[MCP_HEADER]: "1"
			},
			body: JSON.stringify({
				action,
				...body
			}),
			signal
		});
		const data = await response.json().catch(() => ({}));
		if (response.status === 401 || response.status === 403) {
			const err = new Error(data?.error || "unauthorized");
			err.code = data?.code || "unauthorized";
			err.status = response.status;
			err.data = data;
			throw err;
		}
		if (!response.ok || data?.ok === false) {
			const err = new Error(data?.error || data?.message || `HTTP ${response.status}`);
			err.code = data?.code;
			err.status = response.status;
			err.data = data;
			throw err;
		}
		return data;
	}
	const emptyForm = (overrides = {}) => ({
		mode: "create",
		originalName: "",
		transport: "stdio",
		serverName: "",
		command: "",
		args: "",
		cwd: "",
		env: "",
		url: "",
		headers: "",
		startupTimeoutMs: "",
		toolCallTimeoutMs: "",
		advanced: false,
		...overrides
	});
	const parseArgs = (text) => text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
	const parseKv = (text, sep) => {
		const map = {};
		let bad = false;
		for (const raw of text.split(/\n+/)) {
			const line = raw.trim();
			if (!line) continue;
			const i = line.indexOf(sep);
			if (i <= 0) {
				bad = true;
				continue;
			}
			map[line.slice(0, i).trim()] = line.slice(i + sep.length).trim();
		}
		return {
			map,
			bad
		};
	};
	function validateForm(f, original) {
		const errors = {};
		const kept = original ? keptSecrets(original) : {};
		if (original) {
			const saved = formFromServer(original);
			for (const key of [
				"cwd",
				"env",
				"headers",
				"args",
				"startupTimeoutMs",
				"toolCallTimeoutMs"
			]) if (saved[key].trim() && !f[key].trim()) errors[key] = "errCleared";
		}
		const name = f.serverName.trim();
		if (!name) errors.serverName = "errRequired";
		else if (!NAME_RE.test(name)) errors.serverName = "errNameInvalid";
		if (f.transport === "stdio") {
			if (!f.command.trim()) errors.command = "errCommandRequired";
			else if (f.command.trim() === REDACTED && !kept.command) errors.command = "errRedactedLiteral";
		} else if (!kept.url) {
			const url = f.url.trim();
			if (!url) errors.url = "errUrlRequired";
			else if (url === REDACTED) errors.url = "errRedactedLiteral";
			else if (!isHttpUrl(url)) errors.url = "errUrlInvalid";
			else if (urlHasSecret(url)) errors.url = "errSecretUrl";
		}
		if (f.transport === "stdio") {
			if (!kept.args) {
				const args = parseArgs(f.args);
				if (args.includes(REDACTED)) errors.args = "errRedactedLiteral";
				else if (argsHaveSecret(args)) errors.args = "errSecretArg";
			}
			if (!kept.env) {
				const env = parseKv(f.env, "=");
				if (env.bad) errors.env = "errLineInvalid";
				else if (Object.values(env.map).includes(REDACTED)) errors.env = "errRedactedLiteral";
				else if (Object.entries(env.map).some(([k, v]) => v && isPlainSecret(k, v))) errors.env = "errSecretLiteral";
			}
		} else if (!kept.headers) {
			const headers = parseKv(f.headers, ":");
			if (headers.bad) errors.headers = "errHeaderInvalid";
			else if (Object.values(headers.map).includes(REDACTED)) errors.headers = "errRedactedLiteral";
			else if (Object.entries(headers.map).some(([k, v]) => v && isPlainSecret(k, v))) errors.headers = "errSecretLiteral";
		}
		for (const field of ["startupTimeoutMs", "toolCallTimeoutMs"]) if (f[field].trim() && !/^\d+$/.test(f[field].trim())) errors[field] = "errTimeoutInvalid";
		return errors;
	}
	function buildConfig(f) {
		const config = {
			serverName: f.serverName.trim(),
			transport: f.transport
		};
		if (f.transport === "stdio") {
			config.command = f.command.trim();
			const args = parseArgs(f.args);
			if (args.length) config.args = args;
			if (f.cwd.trim()) config.cwd = f.cwd.trim();
			const env = parseKv(f.env, "=").map;
			if (Object.keys(env).length) config.env = env;
		} else {
			config.url = f.url.trim();
			const headers = parseKv(f.headers, ":").map;
			if (Object.keys(headers).length) config.headers = headers;
		}
		if (f.startupTimeoutMs.trim()) config.startupTimeoutMs = Number(f.startupTimeoutMs);
		if (f.toolCallTimeoutMs.trim()) config.toolCallTimeoutMs = Number(f.toolCallTimeoutMs);
		return config;
	}
	function formFromServer(server) {
		const c = server?.config || {};
		const kv = (o, sep) => Object.entries(o || {}).map(([k, v]) => `${k}${sep}${v}`).join("\n");
		return emptyForm({
			mode: "edit",
			originalName: c.serverName || server.serverName,
			transport: c.transport === "streamable-http" ? "streamable-http" : "stdio",
			serverName: c.serverName || server.serverName,
			command: c.command || "",
			args: (c.args || []).join("\n"),
			cwd: c.cwd || "",
			env: kv(c.env, "="),
			url: c.url || "",
			headers: kv(c.headers, ": "),
			startupTimeoutMs: c.startupTimeoutMs == null ? "" : String(c.startupTimeoutMs),
			toolCallTimeoutMs: c.toolCallTimeoutMs == null ? "" : String(c.toolCallTimeoutMs)
		});
	}
	function buildPatch(f, original) {
		const next = buildConfig(f);
		const prev = buildConfig(formFromServer(original));
		const patch = {};
		for (const k of Object.keys(next)) {
			if (k === "serverName") continue;
			if (JSON.stringify(next[k]) !== JSON.stringify(prev[k])) patch[k] = next[k];
		}
		return patch;
	}
	function ltr(value) {
		return h("bdi", {
			dir: "ltr",
			style: { unicodeBidi: "isolate" }
		}, value == null ? "" : String(value));
	}
	function statusLabel(server) {
		if (server?.trash?.trashed) return t("filterTrashed");
		if (server?.disabled) return t("configDesiredDisabled");
		return t("configDesiredEnabled");
	}
	function trustOf(trust) {
		return String(trust?.state ?? trust?.status ?? "untrusted");
	}
	function trustLabel(trust) {
		const st = trustOf(trust);
		if (st === "trusted") return t("trustTrusted");
		if (st === "invalidated") return t("trustInvalidated");
		return t("trustUntrusted");
	}
	function ownershipLabel(o) {
		if (o === "waycraft") return t("ownershipWaycraft");
		if (o === "preexisting-dsh") return t("ownershipPreexisting");
		if (o === "other") return t("ownershipOther");
		return t("ownershipUnknown");
	}
	function savedLabel(server) {
		return server ? t("statusSaved") : t("statusNotSaved");
	}
	function checkedAtLabel(checkedAt) {
		if (!checkedAt || !Number.isFinite(Date.parse(checkedAt))) return "";
		const time = new Date(checkedAt).toLocaleString(isArabic() ? "ar" : "en");
		return t("checkedAt").replace("{time}", time);
	}
	function testLabel(result) {
		if (!result) return t("testNever");
		return [
			t(result.ok ? "connectionPassed" : "connectionFailed"),
			result.message,
			checkedAtLabel(result.checkedAt)
		].filter(Boolean).join(" · ");
	}
	function importSummary(stats) {
		const n = (k) => Number(stats?.[k] || 0);
		const pick = (key, count) => t(key).replace("{n}", String(count));
		const lines = [];
		if (n("registered")) lines.push(pick("importResultRegistered", n("registered")));
		if (n("replaced")) lines.push(pick("importResultReplaced", n("replaced")));
		if (n("skipped")) lines.push(pick("importResultSkipped", n("skipped")));
		if (n("rejected")) lines.push(pick("importResultRejected", n("rejected")));
		if (n("failed")) lines.push(pick("importResultFailed", n("failed")));
		return lines.length ? lines : [t("importResultNone")];
	}
	const STYLE = `
/* ===== Base & tokens (aligned with waycraft-skills) ===== */
.waycraft-mcp{container-type:inline-size;inline-size:100%;max-inline-size:720px;min-inline-size:0;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.waycraft-mcp *{box-sizing:border-box;min-inline-size:0}
.waycraft-mcp bdi{unicode-bidi:isolate;direction:ltr}

/* ===== Header ===== */
.waycraft-mcp-header{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-mcp-title{margin:0;flex:1 1 auto;font-size:18px;line-height:26px;font-weight:500;color:var(--dsw-alias-label-primary)}

/* ===== Toolbar / filters ===== */
.waycraft-mcp-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.waycraft-mcp input:not([type=checkbox]):not([type=radio]),.waycraft-mcp textarea{min-block-size:32px;padding:6px 12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}
.waycraft-mcp input::placeholder,.waycraft-mcp textarea::placeholder{color:var(--dsw-alias-label-tertiary)}
.waycraft-mcp input:focus-visible,.waycraft-mcp textarea:focus-visible{border-color:var(--dsw-alias-state-business-primary)}
.waycraft-mcp textarea{inline-size:100%;resize:vertical;line-height:20px}
.waycraft-mcp input[type=checkbox]{inline-size:16px;block-size:16px;accent-color:var(--dsw-alias-brand-primary)}
.waycraft-mcp-toolbar select{appearance:none;-webkit-appearance:none;block-size:32px;min-block-size:32px;padding-block:0;padding-inline:12px 32px;border-radius:var(--dsw-radius-md,12px);background-color:var(--dsw-alias-bg-layer-1);background-repeat:no-repeat;background-position:calc(100% - 15px) 14px,calc(100% - 10px) 14px;background-size:5px 5px,5px 5px;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-tertiary) 50%),linear-gradient(135deg,var(--dsw-alias-label-tertiary) 50%,transparent 50%);max-inline-size:100%;cursor:pointer;font:inherit;color:inherit;border:0.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2))}
.waycraft-mcp-filterrow select{appearance:none;-webkit-appearance:none;block-size:32px;min-block-size:32px;padding-block:0;padding-inline:12px 32px;border-radius:var(--dsw-radius-md,12px);background-color:var(--dsw-alias-bg-layer-1);background-repeat:no-repeat;background-position:calc(100% - 15px) 14px,calc(100% - 10px) 14px;background-size:5px 5px,5px 5px;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-tertiary) 50%),linear-gradient(135deg,var(--dsw-alias-label-tertiary) 50%,transparent 50%);max-inline-size:100%;cursor:pointer;font:inherit;color:inherit;border:0.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2))}
.waycraft-mcp-toolbar select:dir(rtl),.waycraft-mcp-toolbar [dir=rtl] select{background-position:10px 14px,15px 14px;padding-inline:32px 12px}
.waycraft-mcp-filterrow select:dir(rtl),.waycraft-mcp-filterrow [dir=rtl] select{background-position:10px 14px,15px 14px;padding-inline:32px 12px}
.waycraft-mcp-toolbar select:focus{border-color:var(--dsw-alias-state-business-primary)}
.waycraft-mcp-filterrow select:focus{border-color:var(--dsw-alias-state-business-primary)}
.waycraft-mcp-toolbar .waycraft-mcp-iconbar{display:flex;gap:4px}

/* ===== Buttons (aligned with waycraft-skills) ===== */
.waycraft-mcp button,.waycraft-mcp input,.waycraft-mcp select,.waycraft-mcp textarea{font:inherit;color:inherit}
.waycraft-mcp button{min-block-size:28px;padding-inline:12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);cursor:pointer;transition:background-color .2s cubic-bezier(.4,0,.2,1)}
.waycraft-mcp button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3))}
.waycraft-mcp button:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-bg-layer-3))}
.waycraft-mcp button:disabled{opacity:.5;cursor:not-allowed}
.waycraft-mcp button:focus-visible,.waycraft-mcp input:focus-visible,.waycraft-mcp select:focus-visible,.waycraft-mcp summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.waycraft-mcp-header button{min-block-size:36px;border-radius:var(--dsw-radius-md,12px)}
.waycraft-mcp button.waycraft-mcp-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));border-color:transparent;color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-mcp button.waycraft-mcp-primary:hover:not(:disabled),.waycraft-mcp button.waycraft-mcp-primary:active:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary));border-color:transparent;color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-mcp button.waycraft-mcp-primary:disabled{background:var(--dsw-alias-button-primary-dimmed,var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary)));opacity:.5}
.waycraft-mcp button.waycraft-mcp-danger{color:var(--dsw-alias-state-error-primary)}
.waycraft-mcp button.waycraft-mcp-danger:hover:not(:disabled),.waycraft-mcp button.waycraft-mcp-danger:active:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,var(--dsw-alias-interactive-bg-hover));color:var(--dsw-alias-state-error-primary)}
.waycraft-mcp button.waycraft-mcp-icon-btn{display:flex;align-items:center;justify-content:center;inline-size:32px;block-size:32px;padding:0;border-radius:var(--dsw-radius-md,12px);background:transparent;border:none;color:var(--dsw-alias-label-primary);cursor:pointer}
.waycraft-mcp button.waycraft-mcp-icon-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.waycraft-mcp button.waycraft-mcp-icon-btn:disabled{opacity:.5;cursor:not-allowed}

/* ===== Cards & lists ===== */
.waycraft-mcp-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.waycraft-mcp-card{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-mcp-card-body{padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.waycraft-mcp-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}
.waycraft-mcp-meta{display:flex;flex-wrap:wrap;gap:6px 12px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.waycraft-mcp-path{direction:ltr;unicode-bidi:isolate;overflow-wrap:anywhere;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}

/* ===== Tabs (segmented) ===== */
.waycraft-mcp-seg{display:flex;flex-wrap:wrap;gap:4px;background:var(--dsw-alias-bg-layer-1);border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);padding:4px}
.waycraft-mcp-seg button{flex:0 1 auto;min-block-size:32px;padding-inline:12px;border:none;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit}
.waycraft-mcp-seg button:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.waycraft-mcp-seg button[aria-pressed="true"],.waycraft-mcp-seg button[aria-checked="true"],.waycraft-mcp-seg button[aria-selected="true"]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-weight:500}
.waycraft-mcp-seg button:disabled{opacity:.5;cursor:not-allowed}

/* ===== Panels & KV ===== */
.waycraft-mcp-panel{border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);padding:10px 12px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;gap:8px}
.waycraft-mcp-kv{margin:0;display:grid;grid-template-columns:minmax(120px,180px) 1fr;gap:6px 10px}
.waycraft-mcp-kv dt{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-mcp-kv dd{margin:0;overflow-wrap:anywhere}

/* ===== Tools table ===== */
.waycraft-mcp-tools{overflow:auto}
.waycraft-mcp-tools table{width:100%;border-collapse:collapse;font-size:12px;line-height:18px}
.waycraft-mcp-tools th,.waycraft-mcp-tools td{padding:6px 8px;border-block-end:0.5px solid var(--dsw-alias-border-l2);text-align:start;vertical-align:top}

/* ===== Pre/code ===== */
.waycraft-mcp-pre{margin:0;padding:8px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);overflow:auto;font-size:12px;line-height:18px;direction:ltr;text-align:left;unicode-bidi:isolate}

/* ===== Alerts / notices / confirm ===== */
.waycraft-mcp-notice{margin:0;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
.waycraft-mcp-alert{margin:0;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-state-error-bg,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}
.waycraft-mcp-alert.waycraft-mcp-alert-warn{background:var(--dsw-alias-state-warning-bg,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-state-warning-primary)}
.waycraft-mcp-field-error{margin:0;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-state-error-bg,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}
.waycraft-mcp-dropzone{border:1px dashed var(--dsw-alias-border-l3);border-radius:12px;padding:20px;text-align:center;background:var(--dsw-alias-bg-layer-1)}
.waycraft-mcp-file-choice{position:relative;display:inline-flex;padding:6px 12px;color:var(--dsw-alias-state-business-primary);border-radius:8px;cursor:pointer}
.waycraft-mcp-file-choice input[type=file]{position:absolute;inset:0;inline-size:100%;block-size:100%;opacity:0;cursor:pointer}
.waycraft-mcp-file-choice:focus-within{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.waycraft-mcp-file-choice:hover{background:var(--dsw-alias-bg-layer-3)}
.waycraft-mcp-dialog-body>.waycraft-mcp-card{border:0;background:transparent;border-radius:0;overflow:visible}
.waycraft-mcp-dialog-sm{inline-size:min(440px,100%)}
.waycraft-mcp-confirm-msg{margin:0;line-height:20px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.waycraft-mcp button.waycraft-mcp-danger-solid{background:var(--dsw-alias-state-error-primary);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-mcp button.waycraft-mcp-danger-solid:hover:not(:disabled){filter:brightness(1.08)}
.waycraft-mcp button.waycraft-mcp-danger-solid:disabled{opacity:.5}
.waycraft-mcp-toasts{position:fixed;flex-direction:row;align-items:flex-end;inset-block-end:16px;inset-inline:16px;z-index:1100;display:flex;justify-content:center;pointer-events:none;container-type:normal;max-inline-size:none;inline-size:auto}
.waycraft-mcp-toast{pointer-events:auto;display:flex;align-items:center;gap:10px;max-inline-size:min(520px,100%);padding:10px 8px 10px 14px;padding-inline:14px 8px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-soft,var(--dsw-shadow-lv3));color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;animation:waycraft-mcp-toast-in .18s ease-out}
.waycraft-mcp-toast-ok .waycraft-mcp-toast-icon{color:var(--dsw-alias-state-success-primary,var(--dsw-alias-label-primary))}
.waycraft-mcp-toast-warn .waycraft-mcp-toast-icon{color:var(--dsw-alias-state-warning-primary)}
.waycraft-mcp-toast-err .waycraft-mcp-toast-icon{color:var(--dsw-alias-state-error-primary)}
.waycraft-mcp-toast-icon{display:inline-flex;flex:none}
.waycraft-mcp-toast-text{flex:1;min-inline-size:0;overflow-wrap:anywhere}
@keyframes waycraft-mcp-toast-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.waycraft-mcp-toast{animation:none}}
.waycraft-mcp-confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px;border:0.5px solid var(--dsw-alias-state-error-primary, var(--dsw-alias-border-l2));border-radius:10px}
/* ===== Guided Add/Edit dialog (#174 A) ===== */
.waycraft-mcp-overlay{position:fixed;inset:0;z-index:1000;container-type:normal;max-inline-size:none;inline-size:auto;display:flex;align-items:center;justify-content:center;padding:16px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 60%,transparent);overflow:auto}
.waycraft-mcp-dialog{container-type:inline-size;inline-size:min(600px,100%);max-block-size:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-soft,var(--dsw-shadow-lv3))}
.waycraft-mcp-dialog-head{padding:16px 24px;border-block-end:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-mcp-dialog-head h3{margin:0;font-size:16px;line-height:24px;font-weight:500}
.waycraft-mcp-dialog-body{display:flex;flex-direction:column;gap:16px;padding:24px;overflow:auto;min-block-size:0}
.waycraft-mcp-dialog-footer{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:16px 24px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-mcp-fields{display:grid;gap:12px}
.waycraft-mcp-field{display:flex;flex-direction:column;gap:4px}
.waycraft-mcp-field-label{display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.waycraft-mcp-field-label input,.waycraft-mcp-field-label textarea{inline-size:100%;font-size:14px;color:var(--dsw-alias-label-primary)}
.waycraft-mcp-field-label textarea{font:12px/18px monospace}
.waycraft-mcp-field-help{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.waycraft-mcp-field input[aria-invalid=true],.waycraft-mcp-field textarea[aria-invalid=true]{border-color:var(--dsw-alias-state-error-primary)}
.waycraft-mcp-advanced{border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);padding:8px 12px}
.waycraft-mcp-advanced>summary{cursor:pointer;min-block-size:28px;color:var(--dsw-alias-label-secondary)}
.waycraft-mcp-advanced>.waycraft-mcp-fields{padding-block:8px}
.waycraft-mcp-preview{display:flex;flex-direction:column;gap:4px}
@container (min-width:480px){.waycraft-mcp-advanced .waycraft-mcp-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* ===== Structure aligned with the Skill manager (stats strip, expandable rows, joined icon bar) ===== */
.waycraft-mcp-stack{display:flex;flex-direction:column;gap:12px}
.waycraft-mcp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-mcp-stat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.waycraft-mcp-stat+.waycraft-mcp-stat{border-inline-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-mcp-stat strong{font-size:18px;line-height:26px;color:var(--dsw-alias-label-primary)}
.waycraft-mcp .waycraft-mcp-toolbar input:not([type=checkbox]):not([type=radio]){flex:1 1 180px;block-size:32px;min-block-size:32px;padding-block:0}
.waycraft-mcp-toolbar select{flex:0 1 150px;max-inline-size:240px}
.waycraft-mcp-filterrow select{inline-size:100%}
.waycraft-mcp-iconbar{display:inline-flex;flex:none;align-items:stretch;block-size:32px;margin-inline-start:auto;border:0.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.waycraft-mcp .waycraft-mcp-iconbar button.waycraft-mcp-icon-btn{inline-size:32px;block-size:100%;min-block-size:0;border-radius:0;color:var(--dsw-alias-label-secondary)}
.waycraft-mcp .waycraft-mcp-iconbar button.waycraft-mcp-icon-btn+button.waycraft-mcp-icon-btn{border-inline-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-mcp .waycraft-mcp-iconbar button.waycraft-mcp-icon-btn:focus-visible{outline-offset:-2px}
.waycraft-mcp-row-head{position:relative;display:flex;align-items:center;gap:8px;min-block-size:44px;padding:8px 16px}
/* Extend the native disclosure button across the summary without nesting its other controls. */
.waycraft-mcp-row-head button.waycraft-mcp-row-toggle::after{content:"";position:absolute;inset:0}
.waycraft-mcp-row-actions,.waycraft-mcp-row-head>.waycraft-mcp-switch,.waycraft-mcp-row-head>.waycraft-mcp-expand{position:relative;z-index:1}
.waycraft-mcp-row-head[data-off]>.waycraft-mcp-row-toggle{opacity:.6}
.waycraft-mcp .waycraft-mcp-row-toggle{flex:0 1 auto;display:flex;align-items:center;gap:8px;min-inline-size:0;padding:0;border:0;background:transparent;text-align:start;cursor:pointer;border-radius:var(--dsw-radius-sm,8px)}
.waycraft-mcp div.waycraft-mcp-row-toggle{cursor:default}
.waycraft-mcp .waycraft-mcp-row-toggle:hover:not(:disabled){background:transparent}
.waycraft-mcp-row-title{min-inline-size:0}
.waycraft-mcp-row-title strong{font-weight:600;overflow-wrap:anywhere}
.waycraft-mcp-row-sub{flex:1 1 0;min-inline-size:0;margin-inline-start:auto;text-align:end;color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.waycraft-mcp-row-head button.waycraft-mcp-icon-btn{flex:none;inline-size:28px;block-size:28px;min-block-size:28px;border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-tertiary)}
.waycraft-mcp-row-head button.waycraft-mcp-icon-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-label-primary)}
.waycraft-mcp-row-head>.waycraft-mcp-status{margin-inline:4px}
.waycraft-mcp-chev{flex:none;inline-size:6px;block-size:6px;margin-inline:4px;border-inline-end:1.5px solid var(--dsw-alias-label-tertiary);border-block-end:1.5px solid var(--dsw-alias-label-tertiary);transform:rotate(-45deg);transition:transform .2s cubic-bezier(.4,0,.2,1)}
.waycraft-mcp-card:dir(rtl) .waycraft-mcp-chev{transform:rotate(135deg)}
.waycraft-mcp-card.is-open .waycraft-mcp-chev,.waycraft-mcp-card.is-open:dir(rtl) .waycraft-mcp-chev{transform:rotate(45deg)}
.waycraft-mcp-card.is-open>.waycraft-mcp-card-body{border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-mcp-card-body{padding:12px 16px;gap:12px}
.waycraft-mcp-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
/* ===== Skill-manager-aligned filter row, area tabs, detail tabs, row actions ===== */
.waycraft-mcp-filterrow{display:flex;gap:8px;flex-wrap:wrap}
.waycraft-mcp-filterrow select{flex:0 1 150px;min-inline-size:0;max-inline-size:240px}
@container (max-width:520px){.waycraft-mcp-filterrow select{flex:1 1 100%;max-inline-size:none}}
@supports not (container-type:inline-size){@media (max-width:520px){.waycraft-mcp-filterrow select{flex:1 1 100%;max-inline-size:none}}}
.waycraft-mcp-header+.waycraft-mcp-seg,.waycraft-mcp>.waycraft-mcp-seg{display:inline-flex;max-inline-size:100%;align-self:flex-start}
.waycraft-mcp-seg button{display:inline-flex;align-items:center;gap:8px;padding-inline:8px;min-block-size:28px}
.waycraft-mcp-seg button svg{flex:none;color:var(--dsw-alias-label-secondary)}
.waycraft-mcp-tabs{display:inline-flex;flex-wrap:wrap;gap:4px;padding:4px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);align-self:flex-start;max-inline-size:100%}
.waycraft-mcp-tabs button{min-block-size:28px;border-color:transparent;background:transparent;border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-secondary)}
.waycraft-mcp-tabs button[aria-selected=true]{background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));color:var(--dsw-alias-label-primary)}
.waycraft-mcp-row-actions{display:flex;flex:none;align-items:center;gap:4px}
.waycraft-mcp .waycraft-mcp-row-actions button.waycraft-mcp-icon-btn{color:var(--dsw-alias-label-secondary)}
.waycraft-mcp .waycraft-mcp-row-actions button.waycraft-mcp-icon-btn:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
.waycraft-mcp .waycraft-mcp-row-actions button.waycraft-mcp-icon-btn.waycraft-mcp-attn{color:var(--dsw-alias-brand-primary)}
.waycraft-mcp .waycraft-mcp-row-actions button.waycraft-mcp-icon-btn.waycraft-mcp-danger{color:var(--dsw-alias-state-error-primary)}
@container (max-width:520px){.waycraft-mcp-row-head{flex-wrap:wrap}.waycraft-mcp .waycraft-mcp-row-head>.waycraft-mcp-row-toggle{flex:1 1 auto;min-inline-size:4ch;white-space:nowrap}.waycraft-mcp-row-sub{display:none}}
.waycraft-mcp-spacer{flex:1 1 0}
.waycraft-mcp-detail{display:flex;flex-direction:column;gap:12px}
.waycraft-mcp-note{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.waycraft-mcp-list>li{list-style:none}
@container (max-width: 520px){.waycraft-mcp-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.waycraft-mcp-stat:nth-child(3){border-inline-start:0}.waycraft-mcp-stat:nth-child(n+3){border-block-start:0.5px solid var(--dsw-alias-border-l2)}.waycraft-mcp-toolbar select,.waycraft-mcp-toolbar input{flex:1 1 100%;max-inline-size:none}.waycraft-mcp-iconbar{margin-inline-start:0}}

.waycraft-mcp-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;direction:ltr;text-align:left;unicode-bidi:plaintext}
.waycraft-mcp-card>.waycraft-mcp-card-body>label{display:flex;flex-direction:column;gap:6px;color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-mcp-card>.waycraft-mcp-card-body>strong{font-size:14px}
.waycraft-mcp-card>.waycraft-mcp-card-body>.waycraft-mcp-row{justify-content:flex-start}
.waycraft-mcp-card>.waycraft-mcp-card-body>.waycraft-mcp-row .waycraft-mcp-primary{margin-inline-start:auto}

.waycraft-mcp-card>.waycraft-mcp-note,.waycraft-mcp-card>.waycraft-mcp-notice{margin:0;padding:0 16px 12px;background:transparent}

/* ===== Badges ===== */
.waycraft-mcp-badge{white-space:nowrap;display:inline-flex;align-items:center;gap:4px;padding-inline:8px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xs,4px);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-weight:400}
.waycraft-mcp-badge-warn{background:var(--dsw-alias-state-warning-bg,var(--dsw-alias-bg-layer-3));border-color:var(--dsw-alias-state-warning-border,var(--dsw-alias-border-l2));color:var(--dsw-alias-state-warning-primary)}

/* ===== Switch (toggle) ===== */
.waycraft-mcp button.waycraft-mcp-switch{box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:flex-start;flex:0 0 auto;inline-size:36px;min-inline-size:36px;block-size:20px;min-block-size:0;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);font-size:0;line-height:0;cursor:pointer}
.waycraft-mcp button.waycraft-mcp-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}
.waycraft-mcp-switch:hover:not(:disabled),.waycraft-mcp-switch:active:not(:disabled){background:var(--dsw-alias-border-l3)}
.waycraft-mcp-switch[aria-checked=true]:hover:not(:disabled),.waycraft-mcp-switch[aria-checked=true]:active:not(:disabled){background:var(--dsw-alias-brand-primary)}
.waycraft-mcp-switch:disabled{cursor:default;opacity:.5}
.waycraft-mcp-switch:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.waycraft-mcp-switch-thumb{display:block;flex:none;inline-size:16px;block-size:16px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);transition:transform .12s ease}
.waycraft-mcp-switch[aria-checked=false] .waycraft-mcp-switch-thumb{background:var(--dsw-alias-switch-thumb)}
.waycraft-mcp-switch[aria-checked=true] .waycraft-mcp-switch-thumb{transform:translate(16px)}
.waycraft-mcp-switch[aria-checked=true]:dir(rtl) .waycraft-mcp-switch-thumb{transform:translate(-16px)}
@media (prefers-reduced-motion:reduce){.waycraft-mcp-switch-thumb{transition:none}}
.waycraft-mcp button.waycraft-mcp-switch::after{content:"";position:absolute;inset:-6px -4px}
@media (pointer:coarse){.waycraft-mcp button.waycraft-mcp-icon-btn,.waycraft-mcp .waycraft-mcp-row-actions button:not(.waycraft-mcp-switch){min-inline-size:40px;min-block-size:40px}.waycraft-mcp button.waycraft-mcp-switch::after{inset:-12px -8px}}

/* ===== RTL / container queries ===== */
@container (max-width: 560px){.waycraft-mcp-kv{grid-template-columns:1fr}}
@supports not (container-type:inline-size){@media (max-width:560px){.waycraft-mcp-kv{grid-template-columns:1fr}}}
@container (max-width: 520px){.waycraft-mcp-source-meta .waycraft-mcp-path{display:none}}
@supports not (container-type:inline-size){@media (max-width:520px){.waycraft-mcp-source-meta .waycraft-mcp-path{display:none}}}

/* Local variants keep generic button rules from overriding geometry. */
.waycraft-mcp button.waycraft-mcp-switch:hover:not(:disabled),.waycraft-mcp button.waycraft-mcp-switch:active:not(:disabled){background:var(--dsw-alias-border-l3)}
.waycraft-mcp button.waycraft-mcp-switch[aria-checked=true]:hover:not(:disabled),.waycraft-mcp button.waycraft-mcp-switch[aria-checked=true]:active:not(:disabled){background:var(--dsw-alias-brand-primary)}
.waycraft-mcp-status{flex:none;inline-size:8px;block-size:8px;border-radius:50%;background:var(--dsw-alias-label-tertiary)}
.waycraft-mcp-status-success{background:var(--dsw-alias-state-success-primary,#15803d)}
.waycraft-mcp-status-error{background:var(--dsw-alias-state-error-primary)}
.waycraft-mcp-status-warning{background:var(--dsw-alias-state-warning-primary,#b45309)}
.waycraft-mcp-status-unknown{background:transparent;box-shadow:inset 0 0 0 1.5px var(--dsw-alias-label-tertiary)}
.waycraft-mcp-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.waycraft-mcp-dialog-head h3{font-weight:500}
.waycraft-mcp-dialog-body .waycraft-mcp-notice{background:transparent;padding:0;color:var(--dsw-alias-label-secondary);font-size:13px}
.waycraft-mcp-dialog-body .waycraft-mcp-seg{align-self:flex-start}
.waycraft-mcp-dialog-footer button{min-block-size:36px;border-radius:var(--dsw-radius-md,12px)}
.waycraft-mcp-menu{position:fixed;z-index:1050;container-type:normal;inline-size:max-content;max-inline-size:calc(100vw - 16px);max-block-size:calc(100dvh - 16px);overflow:auto;padding:4px;border-radius:var(--dsw-radius-md,12px);background:var(--dsw-menu-surface-fill,var(--dsw-alias-bg-layer-2));backdrop-filter:var(--dsw-menu-backdrop-filter,none);box-shadow:var(--dsw-elevation-prominent,var(--dsw-elevation-panel,var(--dsw-shadow-lv3)));gap:0;box-sizing:border-box}
.waycraft-mcp-menu[hidden]{display:none}
/* Installed DSH Menu item geometry, adapted without a private host import. */
.waycraft-mcp-menu button.waycraft-mcp-icon-btn{display:flex;justify-content:flex-start;gap:6px;inline-size:100%;padding:6px 8px;block-size:auto;min-block-size:34px;border-radius:var(--dsw-radius-md,12px);font-size:13px;line-height:20px;white-space:nowrap;text-align:start}
.waycraft-mcp-menu button.waycraft-mcp-icon-btn svg{inline-size:14px;block-size:14px;flex:none;color:var(--dsw-alias-menu-icon,var(--dsw-alias-label-secondary))}
.waycraft-mcp-menu button.waycraft-mcp-icon-btn:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}
@media (hover:hover){.waycraft-mcp-menu button.waycraft-mcp-icon-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}}
@media (hover:hover){.waycraft-mcp-row-head:hover{background:var(--dsw-alias-interactive-bg-hover)}.waycraft-mcp-badge:hover{border-color:var(--dsw-alias-border-l3)}}
@media (max-width:520px){.waycraft-mcp-dialog-head,.waycraft-mcp-dialog-footer{padding:16px}.waycraft-mcp-dialog-body{padding:16px}.waycraft-mcp-dialog-footer button{flex:1 1 auto}}
@media (pointer:coarse){.waycraft-mcp input:not([type=checkbox]),.waycraft-mcp textarea,.waycraft-mcp select{font-size:16px}}
/* ===== Stats ===== */
.waycraft-mcp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-mcp-stat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.waycraft-mcp-stat+.waycraft-mcp-stat{border-inline-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-mcp-stat strong{font-size:18px;line-height:26px;color:var(--dsw-alias-label-primary)}

/* ===== Source card ===== */
.waycraft-mcp-source{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-mcp-source>summary{display:flex;align-items:center;gap:8px;min-block-size:44px;padding:8px 16px;cursor:pointer;font-weight:500;list-style:none}
.waycraft-mcp-source>summary::-webkit-details-marker{display:none}
.waycraft-mcp-chev{flex:none;inline-size:6px;block-size:6px;margin-inline:4px;border-inline-end:1.5px solid var(--dsw-alias-label-tertiary);border-block-end:1.5px solid var(--dsw-alias-label-tertiary);transform:rotate(-45deg);transition:transform .2s cubic-bezier(.4,0,.2,1)}
.waycraft-mcp-source:dir(rtl) .waycraft-mcp-chev{transform:rotate(135deg)}
.waycraft-mcp-source[open] .waycraft-mcp-chev,.waycraft-mcp-source:dir(rtl)[open] .waycraft-mcp-chev{transform:rotate(45deg)}
.waycraft-mcp-source[data-off]>summary>.waycraft-mcp-source-name,.waycraft-mcp-source[data-off]>summary>.waycraft-mcp-count,.waycraft-mcp-source[data-off]>summary>.waycraft-mcp-source-icon{opacity:.55}
.waycraft-mcp-source-name{flex:0 1 auto;overflow-wrap:anywhere}
.waycraft-mcp-source-icon{inline-size:16px;block-size:16px;flex:none;color:var(--dsw-alias-label-secondary)}
.waycraft-mcp-source-path{flex:1 1 0;min-inline-size:0;margin-inline-start:auto;text-align:end;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.waycraft-mcp-count{flex:none;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400;white-space:nowrap}
.waycraft-mcp-source-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:space-between}
.waycraft-mcp-source-body{display:flex;flex-direction:column;gap:12px;padding:12px 16px}
`;
	function issueMessage(e) {
		if (e?.code === "conflict") return t("conflictReloaded");
		if (e?.code === "exists") return t("errExists");
		if (e?.code === "trust_required") return t("trustUntrusted");
		if (e?.code === "validation") {
			const issues = Array.isArray(e.data?.issues) ? e.data.issues : [];
			if (!issues.length) return t("formInvalid");
			const parts = [t("formInvalid")];
			for (const i of issues) {
				parts.push(" ");
				if (i.path) parts.push(ltr(i.path), ": ");
				parts.push(String(i.message || ""));
			}
			return h(React.Fragment, null, ...parts);
		}
		return e?.message || t("opFailed");
	}
	/** Body portal target; null without a DOM (unit tests), where the overlay renders inline. Same pattern as skills-browser.ts. */
	const portalTarget = () => {
		try {
			const body = document.body;
			return body ? {
				body,
				dom: require("react-dom")
			} : null;
		} catch {
			return null;
		}
	};
	const withTech = (text) => {
		const parts = String(text).split(TECH_TOKEN);
		return parts.length === 1 ? text : h(React.Fragment, null, ...parts.map((p, i) => i % 2 ? ltr(p) : p));
	};
	function ServerFormDialog(props) {
		const [f, setF] = React.useState(props.initial);
		const [touched, setTouched] = React.useState({});
		const [attempted, setAttempted] = React.useState(false);
		const [saving, setSaving] = React.useState(false);
		const [serverError, setServerError] = React.useState("");
		const [confirmDiscard, setConfirmDiscard] = React.useState(false);
		const ref = React.useRef(null);
		const [opener] = React.useState(() => typeof document !== "undefined" ? document.activeElement : null);
		React.useEffect(() => {
			ref.current?.focus?.();
			return () => {
				try {
					opener?.focus?.();
				} catch {}
			};
		}, []);
		const isEdit = f.mode === "edit";
		const kept = isEdit ? keptSecrets(props.original) : {};
		const dirty = JSON.stringify(f) !== JSON.stringify(props.initial);
		const errors = validateForm(f, isEdit ? props.original : void 0);
		if (f.registryReview && /[{}]/.test(f.url)) errors.url = "errUrlInvalid";
		if (f.registryReview && f.registryRequiredHeaders?.some((name) => !/^\$\{credential:[^}]+\}$/.test(parseKv(f.headers, ":").map[name] || ""))) errors.headers = "errSecretLiteral";
		const hasErrors = Object.keys(errors).length > 0;
		const setField = (key, value) => setF((prev) => ({
			...prev,
			[key]: value
		}));
		const touch = (key) => setTouched((prev) => prev[key] ? prev : {
			...prev,
			[key]: true
		});
		const requestClose = () => {
			if (dirty) setConfirmDiscard(true);
			else props.onClose();
		};
		const FOCUSABLE = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex=\"-1\"])";
		const trapTab = (event) => {
			const items = Array.from(ref.current?.querySelectorAll?.(FOCUSABLE) || []);
			if (!items.length) return;
			const index = items.indexOf(event.target);
			const wrapBack = event.shiftKey && index <= 0;
			const wrapForward = !event.shiftKey && (index === -1 || index === items.length - 1);
			if (wrapBack || wrapForward) {
				event.preventDefault?.();
				(wrapBack ? items[items.length - 1] : items[0]).focus?.();
			}
		};
		const onKeyDown = (event) => {
			if (event.key === "Escape") {
				event.stopPropagation?.();
				requestClose();
			} else if (event.key === "Tab") trapTab(event);
		};
		const keptFields = {
			env: kept.env || 0,
			headers: kept.headers || 0,
			args: kept.args || 0,
			url: kept.url || 0,
			command: kept.command || 0
		};
		const isKept = (key) => (keptFields[key] || 0) > 0;
		const field = (key, caption, control, help) => {
			const shown = errors[key] && (IMMEDIATE_ERRORS.includes(errors[key]) || touched[key] || attempted) ? withTech(t(errors[key])) : "";
			const helpId = `waycraft-mcp-${key}-help`;
			const errId = `waycraft-mcp-${key}-error`;
			const describedBy = [help ? helpId : "", shown ? errId : ""].filter(Boolean).join(" ") || void 0;
			const note = isKept(key) ? h("span", {
				className: "waycraft-mcp-field-help",
				role: "status"
			}, `${keptFields[key]} ${t("keptNote")}`) : null;
			return h("div", { className: "waycraft-mcp-field" }, h("label", { className: "waycraft-mcp-field-label" }, h("span", null, caption), React.cloneElement(control, {
				"aria-invalid": shown ? true : void 0,
				"aria-describedby": describedBy
			})), help ? h("span", {
				id: helpId,
				className: "waycraft-mcp-field-help"
			}, withTech(help)) : null, note, shown ? h("span", {
				id: errId,
				role: "alert",
				className: "waycraft-mcp-field-error"
			}, shown) : null);
		};
		const input = (key, extra = {}) => h("input", {
			value: f[key],
			dir: "ltr",
			disabled: isKept(key) || void 0,
			onInput: (e) => setField(key, e.target.value),
			onBlur: () => touch(key),
			...extra
		});
		const area = (key) => h("textarea", {
			value: f[key],
			rows: 3,
			dir: "ltr",
			spellCheck: false,
			disabled: isKept(key) || void 0,
			onInput: (e) => setField(key, e.target.value),
			onBlur: () => touch(key)
		});
		const save = async () => {
			if (saving) return;
			setAttempted(true);
			if (hasErrors) {
				setServerError(t("formInvalid"));
				return;
			}
			const patch = isEdit ? buildPatch(f, props.original) : null;
			if (patch && !Object.keys(patch).length) {
				setServerError(t("noChanges"));
				return;
			}
			const payload = isEdit ? patch : buildConfig(f);
			if (JSON.stringify(payload).includes(REDACTED)) {
				setServerError(t("errRedactedLiteral"));
				return;
			}
			setSaving(true);
			setServerError("");
			try {
				const d = isEdit ? await rpc("update", {
					serverName: props.original.serverName,
					expectedFingerprint: props.fingerprint,
					patch
				}) : await rpc("create", {
					config: buildConfig(f),
					expectedFingerprint: props.fingerprint
				});
				props.onSaved(d);
			} catch (e) {
				setServerError(issueMessage(e));
				if (e?.code === "conflict") props.onConflict(e.data?.fingerprint);
				setSaving(false);
			}
		};
		const transportTab = (id, label) => h("button", {
			onKeyDown: (e) => {
				if (!isEdit && [
					"ArrowLeft",
					"ArrowRight",
					"Home",
					"End"
				].includes(e.key)) {
					e.preventDefault();
					const next = e.key === "Home" ? "stdio" : e.key === "End" ? "streamable-http" : id === "stdio" ? "streamable-http" : "stdio";
					setField("transport", next);
					e.currentTarget.parentElement?.querySelectorAll?.("button")?.[next === "stdio" ? 0 : 1]?.focus?.();
				}
			},
			type: "button",
			role: "radio",
			"aria-checked": f.transport === id,
			tabIndex: f.transport === id ? 0 : -1,
			disabled: isEdit,
			onClick: () => setField("transport", id)
		}, label);
		const stdio = f.transport === "stdio";
		const body = h("div", { className: "waycraft-mcp-dialog-body" }, h("p", { className: "waycraft-mcp-notice" }, t("formNote")), h("div", {
			className: "waycraft-mcp-seg",
			role: "radiogroup",
			"aria-label": t("transportLabel")
		}, transportTab("stdio", t("transportStdio")), transportTab("streamable-http", t("transportHttp"))), h("div", { className: "waycraft-mcp-fields" }, field("serverName", t("serverName"), input("serverName", {
			disabled: isEdit,
			"aria-readonly": isEdit ? true : void 0,
			required: true
		}), isEdit ? t("nameLocked") : t("nameHelp")), ...stdio ? [
			field("command", t("command"), input("command", { required: true })),
			field("args", t("args"), area("args"), t("argsHelp")),
			field("cwd", t("cwd"), input("cwd")),
			field("env", t("envLabel"), area("env"), t("envHelp"))
		] : [field("url", t("url"), input("url", {
			required: true,
			type: "url",
			inputMode: "url"
		})), field("headers", t("headersLabel"), area("headers"), t("headersHelp"))]), h("details", {
			className: "waycraft-mcp-advanced",
			open: !!(errors.startupTimeoutMs || errors.toolCallTimeoutMs) || void 0
		}, h("summary", null, t("advanced")), h("div", { className: "waycraft-mcp-fields" }, field("startupTimeoutMs", t("startupTimeoutMs"), input("startupTimeoutMs", { inputMode: "numeric" })), field("toolCallTimeoutMs", t("toolCallTimeoutMs"), input("toolCallTimeoutMs", { inputMode: "numeric" })))), h("div", { className: "waycraft-mcp-preview" }, h("span", { className: "waycraft-mcp-meta" }, t("preview")), h("pre", { className: "waycraft-mcp-pre" }, JSON.stringify(redactForPreview(buildConfig(f)), null, 2))), serverError ? h("p", {
			role: "alert",
			className: "waycraft-mcp-alert"
		}, serverError) : null, confirmDiscard ? h(ConfirmDialog, {
			title: t("dirtyCancel"),
			message: t("dirtyCancelBody"),
			confirmLabel: t("discard"),
			danger: true,
			onConfirm: props.onClose,
			onCancel: () => setConfirmDiscard(false)
		}) : null);
		const footer = h("div", { className: "waycraft-mcp-dialog-footer" }, h("button", {
			type: "button",
			onClick: requestClose
		}, t("cancel")), h("button", {
			type: "button",
			className: "waycraft-mcp-primary",
			disabled: saving,
			"aria-disabled": hasErrors ? true : void 0,
			onClick: () => void save()
		}, saving ? t("saving") : t("saveServer")));
		const overlay = h("div", {
			className: "waycraft-mcp waycraft-mcp-overlay",
			dir: isArabic() ? "rtl" : "ltr",
			onMouseDown: (e) => {
				if (e.target === e.currentTarget) requestClose();
			}
		}, h("div", {
			role: "dialog",
			"aria-modal": true,
			"aria-labelledby": "waycraft-mcp-dialog-title",
			className: "waycraft-mcp-dialog",
			ref,
			tabIndex: -1,
			onKeyDown
		}, h("div", { className: "waycraft-mcp-dialog-head" }, h("h3", { id: "waycraft-mcp-dialog-title" }, isEdit ? t("editTitle") : t("addTitle")), h("button", {
			type: "button",
			className: "waycraft-mcp-icon-btn",
			"aria-label": t("cancel"),
			onClick: requestClose
		}, h("svg", {
			width: 16,
			height: 16,
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			"aria-hidden": true
		}, h("path", { d: "M6 6l12 12M18 6L6 18" })))), body, footer));
		const host = portalTarget();
		return host ? host.dom.createPortal(overlay, host.body) : overlay;
	}
	function useModal(onEscape) {
		const ref = React.useRef(null);
		const [opener] = React.useState(() => typeof document !== "undefined" ? document.activeElement : null);
		React.useEffect(() => {
			(ref.current?.querySelector?.(".waycraft-mcp-dialog-footer button:not([disabled])") || ref.current)?.focus?.();
			return () => {
				try {
					opener?.focus?.();
				} catch {}
			};
		}, []);
		const onKeyDown = (event) => {
			if (event.key === "Escape") {
				event.stopPropagation?.();
				onEscape();
				return;
			}
			if (event.key !== "Tab") return;
			const items = Array.from(ref.current?.querySelectorAll?.("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex=\"-1\"])") || []);
			if (!items.length) return;
			const index = items.indexOf(event.target);
			const back = event.shiftKey && index <= 0;
			const forward = !event.shiftKey && (index === -1 || index === items.length - 1);
			if (back || forward) {
				event.preventDefault?.();
				(back ? items[items.length - 1] : items[0]).focus?.();
			}
		};
		return {
			ref,
			onKeyDown
		};
	}
	function ConfirmDialog(props) {
		const { ref, onKeyDown } = useModal(props.onCancel);
		const overlay = h("div", {
			className: "waycraft-mcp waycraft-mcp-overlay",
			dir: isArabic() ? "rtl" : "ltr",
			onMouseDown: (e) => {
				if (e.target === e.currentTarget) props.onCancel();
			}
		}, h("div", {
			role: "alertdialog",
			"aria-modal": true,
			"aria-labelledby": "waycraft-mcp-confirm-title",
			"aria-describedby": "waycraft-mcp-confirm-msg",
			className: "waycraft-mcp-dialog waycraft-mcp-dialog-sm",
			ref,
			tabIndex: -1,
			onKeyDown
		}, h("div", { className: "waycraft-mcp-dialog-head" }, h("h3", { id: "waycraft-mcp-confirm-title" }, props.title)), h("div", { className: "waycraft-mcp-dialog-body" }, h("p", {
			id: "waycraft-mcp-confirm-msg",
			className: "waycraft-mcp-confirm-msg"
		}, props.message)), h("div", { className: "waycraft-mcp-dialog-footer" }, h("button", {
			type: "button",
			disabled: !!props.busy,
			onClick: props.onCancel
		}, t("cancel")), h("button", {
			type: "button",
			className: props.danger ? "waycraft-mcp-danger-solid" : "waycraft-mcp-primary",
			disabled: !!props.busy,
			onClick: props.onConfirm
		}, props.confirmLabel))));
		const host = portalTarget();
		return host ? host.dom.createPortal(overlay, host.body) : overlay;
	}
	function ImportDialog(props) {
		const { ref, onKeyDown } = useModal(props.onClose);
		const node = h("div", {
			className: "waycraft-mcp waycraft-mcp-overlay",
			inert: props.suspended ? true : void 0,
			"aria-hidden": props.suspended || void 0,
			dir: isArabic() ? "rtl" : "ltr",
			onMouseDown: (e) => {
				if (e.target === e.currentTarget) props.onClose();
			}
		}, h("div", {
			role: "dialog",
			"aria-modal": true,
			"aria-labelledby": "waycraft-mcp-import-title",
			className: "waycraft-mcp-dialog",
			ref,
			tabIndex: -1,
			onKeyDown
		}, h("div", { className: "waycraft-mcp-dialog-head" }, h("h3", { id: "waycraft-mcp-import-title" }, t("importTitle")), h("button", {
			type: "button",
			className: "waycraft-mcp-icon-btn",
			"aria-label": t("cancel"),
			onClick: props.onClose
		}, "×")), h("div", { className: "waycraft-mcp-dialog-body" }, props.children)));
		const host = portalTarget();
		return host ? host.dom.createPortal(node, host.body) : node;
	}
	function NativeMoreMenu(props) {
		const [open, setOpen] = React.useState(false);
		const trigger = React.useRef(null);
		const close = () => {
			setOpen(false);
			trigger.current?.focus?.({ preventScroll: true });
		};
		const actions$2 = React.Children.toArray(props.children).filter(Boolean);
		const anchor = tooltip(props.label, h("button", {
			ref: trigger,
			type: "button",
			className: "waycraft-mcp-icon-btn",
			"aria-label": props.label,
			"aria-haspopup": "menu",
			"aria-expanded": open,
			disabled: props.disabled,
			onClick: () => setOpen(!open),
			onKeyDown: (e) => {
				if (e.key === "ArrowDown" || e.key === "ArrowUp") {
					e.preventDefault();
					setOpen(true);
				}
			}
		}, h("svg", {
			viewBox: "0 0 24 24",
			width: 16,
			height: 16,
			fill: "currentColor",
			"aria-hidden": true
		}, [
			5,
			12,
			19
		].map((x) => h("circle", {
			key: x,
			cx: x,
			cy: 12,
			r: 1.5
		})))));
		return h(primitives$1.Menu, {
			open,
			anchor,
			onClose: close,
			align: "end",
			portal: true,
			autoFocus: true,
			items: actions$2.map((child, i) => ({
				id: String(i),
				label: child.props["aria-label"],
				icon: child.props.children,
				disabled: child.props.disabled,
				danger: String(child.props.className || "").includes("danger")
			})),
			onSelect: (id) => {
				close();
				actions$2[Number(id)]?.props.onClick();
			}
		});
	}
	function MoreMenu(props) {
		return primitives$1.Menu ? h(NativeMoreMenu, props) : h(FallbackMoreMenu, props);
	}
	function FallbackMoreMenu(props) {
		const trigger = React.useRef(null);
		const menu = React.useRef(null);
		const [open, setOpen] = React.useState(false);
		const [pos, setPos] = React.useState({
			top: 0,
			left: 0
		});
		const close = (focus) => {
			setOpen(false);
			if (focus) trigger.current?.focus?.();
		};
		React.useEffect(() => {
			if (!open || typeof document === "undefined") return;
			const place = () => {
				const r = trigger.current?.getBoundingClientRect();
				const m = menu.current;
				if (!r || !m) return;
				const w = document.documentElement.clientWidth, v = document.documentElement.clientHeight;
				const top = r.bottom + 4 + m.offsetHeight <= v - 8 ? r.bottom + 4 : r.top - m.offsetHeight - 4;
				setPos({
					top: Math.max(8, Math.min(top, v - m.offsetHeight - 8)),
					left: Math.max(8, Math.min(isArabic() ? r.left : r.right - m.offsetWidth, w - m.offsetWidth - 8))
				});
			};
			place();
			menu.current?.querySelector?.("button:not([disabled])")?.focus?.();
			const away = (e) => {
				if (!menu.current?.contains(e.target) && !trigger.current?.contains(e.target)) close(false);
			};
			document.addEventListener("pointerdown", away, true);
			document.addEventListener("scroll", place, true);
			globalThis.addEventListener?.("resize", place);
			return () => {
				document.removeEventListener("pointerdown", away, true);
				document.removeEventListener("scroll", place, true);
				globalThis.removeEventListener?.("resize", place);
			};
		}, [open]);
		const list = h("div", {
			ref: menu,
			role: "menu",
			hidden: !open,
			className: "waycraft-mcp waycraft-mcp-menu",
			dir: isArabic() ? "rtl" : "ltr",
			style: pos,
			onBlur: (e) => {
				if (e.relatedTarget && !menu.current?.contains(e.relatedTarget) && !trigger.current?.contains(e.relatedTarget)) close(false);
			},
			onKeyDown: (e) => {
				if (e.key === "Escape") {
					e.preventDefault();
					e.stopPropagation();
					close(true);
				}
				if ([
					"ArrowDown",
					"ArrowUp",
					"Home",
					"End"
				].includes(e.key)) {
					e.preventDefault();
					const items = Array.from(menu.current?.querySelectorAll("button:not([disabled])") || []);
					const at = items.indexOf(document.activeElement);
					items[e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
				}
			}
		}, React.Children.map(props.children, (child) => child ? React.cloneElement(child, {
			role: "menuitem",
			onClick: () => {
				close(true);
				child.props.onClick();
			}
		}, child.props.children, child.props["aria-label"]) : null));
		const host = portalTarget();
		return h(React.Fragment, null, h("button", {
			ref: trigger,
			type: "button",
			className: "waycraft-mcp-icon-btn",
			"aria-label": props.label,
			title: props.label,
			"aria-haspopup": "menu",
			"aria-expanded": open,
			disabled: props.disabled,
			onClick: () => setOpen(!open),
			onKeyDown: (e) => {
				if (e.key === "ArrowDown" || e.key === "ArrowUp") {
					e.preventDefault();
					setOpen(true);
				}
			}
		}, h("svg", {
			viewBox: "0 0 24 24",
			width: 16,
			height: 16,
			fill: "currentColor",
			"aria-hidden": true
		}, [
			5,
			12,
			19
		].map((x) => h("circle", {
			key: x,
			cx: x,
			cy: 12,
			r: 1.5
		})))), open || !host ? host ? host.dom.createPortal(list, host.body) : list : null);
	}
	function Toast(props) {
		const { notice, onDismiss } = props;
		React.useEffect(() => {
			if (!notice || notice.kind === "err") return void 0;
			const id = setTimeout(onDismiss, notice.kind === "warn" ? 9e3 : 5e3);
			return () => clearTimeout(id);
		}, [notice]);
		if (!notice) return null;
		if (primitives$1.Toast && notice.kind !== "err") return h(primitives$1.Toast, {
			text: notice.text,
			tone: notice.kind === "warn" ? void 0 : "success",
			holdMs: notice.kind === "warn" ? 9e3 : 5e3,
			onDone: onDismiss
		});
		const kind = notice.kind === "err" ? "err" : notice.kind === "warn" ? "warn" : "ok";
		const glyph = kind === "ok" ? h("svg", {
			viewBox: "0 0 24 24",
			width: 16,
			height: 16,
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 2,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": "true"
		}, h("path", { d: "M5 12.5l4.5 4.5L19 7.5" })) : h("svg", {
			viewBox: "0 0 24 24",
			width: 16,
			height: 16,
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 2,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": "true"
		}, h("path", { d: "M12 8v5M12 16.5v.01" }), h("circle", {
			cx: 12,
			cy: 12,
			r: 9
		}));
		const node = h("div", {
			className: "waycraft-mcp waycraft-mcp-toasts",
			dir: isArabic() ? "rtl" : "ltr"
		}, h("div", {
			role: kind === "err" ? "alert" : "status",
			className: `waycraft-mcp-toast waycraft-mcp-toast-${kind}${kind === "warn" ? " waycraft-mcp-alert-warn" : ""}`
		}, h("span", { className: "waycraft-mcp-toast-icon" }, glyph), h("span", { className: "waycraft-mcp-toast-text" }, notice.text, notice.code ? h("bdi", {
			dir: "ltr",
			className: "waycraft-mcp-toast-code"
		}, ` (${notice.code})`) : null), h("button", {
			type: "button",
			className: "waycraft-mcp-icon-btn",
			"aria-label": t("dismiss"),
			onClick: onDismiss
		}, h("svg", {
			viewBox: "0 0 24 24",
			width: 14,
			height: 14,
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 2,
			strokeLinecap: "round",
			"aria-hidden": "true"
		}, h("path", { d: "M6 6l12 12M18 6L6 18" })))));
		const host = portalTarget();
		return host ? host.dom.createPortal(node, host.body) : node;
	}
	function McpPanel() {
		const [state, setState] = React.useState({ kind: "loading" });
		const [servers, setServers] = React.useState([]);
		const [trashed, setTrashed] = React.useState([]);
		const [fingerprint, setFingerprint] = React.useState("");
		const [area, setArea] = React.useState("servers");
		const [fTransport, setFTransport] = React.useState("all");
		const [fStatus, setFStatus] = React.useState("all");
		const [fTrust, setFTrust] = React.useState("all");
		const [query, setQuery] = React.useState("");
		const [selected, setSelected] = React.useState(null);
		const [tab, setTab] = React.useState("overview");
		const [busy, setBusy] = React.useState("");
		const [notice, setNotice] = React.useState(null);
		const [confirm, setConfirmState] = React.useState(null);
		const [toolCache, setToolCache] = React.useState({});
		const [discoverRoots, setDiscoverRoots] = React.useState("");
		const [discovery, setDiscovery] = React.useState(null);
		const [registryQuery, setRegistryQuery] = React.useState("");
		const [registry, setRegistry] = React.useState(null);
		const [registryError, setRegistryError] = React.useState("");
		const [registryBusy, setRegistryBusy] = React.useState(false);
		const [registryDetail, setRegistryDetail] = React.useState("");
		const registryGeneration = React.useRef(0);
		const registryPageQuery = React.useRef("");
		const registryCursors = React.useRef(/* @__PURE__ */ new Set());
		const registryAbort = React.useRef(null);
		React.useEffect(() => () => {
			registryGeneration.current++;
			registryAbort.current?.abort();
		}, []);
		const searchRegistry = async (cursor) => {
			registryAbort.current?.abort();
			const controller = new AbortController();
			registryAbort.current = controller;
			const generation = ++registryGeneration.current;
			setRegistryBusy(true);
			setRegistryError("");
			setRegistryDetail("");
			if (!cursor) {
				registryPageQuery.current = registryQuery;
				registryCursors.current = /* @__PURE__ */ new Set();
			}
			if (cursor) registryCursors.current.add(cursor);
			try {
				const data = await rpc("registry_search", {
					query: registryPageQuery.current,
					...cursor ? { cursor } : {},
					limit: 20
				}, controller.signal);
				if (generation !== registryGeneration.current) return;
				const page = data.registry;
				setRegistry({
					...page,
					nextCursor: registryCursors.current.has(page.nextCursor) ? void 0 : page.nextCursor
				});
			} catch (error) {
				if (generation === registryGeneration.current) {
					setRegistry(null);
					setRegistryError(error?.message || t("error"));
				}
			} finally {
				if (generation === registryGeneration.current) setRegistryBusy(false);
			}
		};
		const [importText, setImportText] = React.useState("");
		const [importOpen, setImportOpen] = React.useState(false);
		const [importFileName, setImportFileName] = React.useState("");
		const importRead = React.useRef(0);
		const toolsReadGeneration = React.useRef(0);
		const [importReading, setImportReading] = React.useState(false);
		const [toolsRetry, setToolsRetry] = React.useState(0);
		const [toolsRead, setToolsRead] = React.useState({
			key: "",
			loading: false,
			error: false
		});
		const [importPreview, setImportPreview] = React.useState(null);
		const [importApprovals, setImportApprovals] = React.useState({});
		const [importResult, setImportResult] = React.useState(null);
		const [form, setForm] = React.useState(null);
		const [testResults, setTestResults] = React.useState({});
		const alive = React.useRef(true);
		const load = React.useCallback(async () => {
			setState((prev) => prev.kind === "ready" ? prev : { kind: "loading" });
			setNotice(null);
			try {
				const data = await rpc("list");
				if (!alive.current) return;
				const loadedServers = Array.isArray(data.servers) ? data.servers : [];
				setServers(loadedServers);
				setTestResults((previous) => {
					const results = {};
					for (const server of loadedServers) {
						const config = configIdentity(server);
						const check = data.connectionChecks?.[server.serverName];
						if (check && typeof check.ok === "boolean" && check.configFingerprint === config && typeof check.checkedAt === "string" && Number.isFinite(Date.parse(check.checkedAt))) results[server.serverName] = {
							ok: check.ok,
							message: "",
							config,
							checkedAt: check.checkedAt
						};
						else if (!data.connectionChecks && previous[server.serverName]?.config === config) results[server.serverName] = previous[server.serverName];
					}
					return results;
				});
				setTrashed(Array.isArray(data.trashedServers) ? data.trashedServers : []);
				setFingerprint(data.fingerprint || "");
				setState({ kind: "ready" });
			} catch (e) {
				if (!alive.current) return;
				if (e?.code === "unauthorized" || e?.status === 401 || e?.status === 403) setState({ kind: "unauthorized" });
				else setState({
					kind: "error",
					message: e?.message || ""
				});
			}
		}, []);
		React.useEffect(() => {
			alive.current = true;
			load();
			return () => {
				alive.current = false;
			};
		}, [load]);
		const run = async (label, fn, after) => {
			setBusy(label);
			setNotice(null);
			try {
				const d = await fn();
				if (!alive.current) return;
				const custom = after?.(d);
				await load();
				if (alive.current) setNotice(custom || {
					kind: "ok",
					text: t("opSuccess")
				});
			} catch (e) {
				if (!alive.current) return;
				const preview = e?.data?.preview;
				if (preview) setImportPreview(preview);
				const issue = preview?.issues?.[0]?.message;
				setNotice({
					kind: "err",
					text: issue ? `${e?.message || t("opFailed")}: ${issue}` : e?.message || t("opFailed"),
					code: e?.code || (e?.status ? `HTTP ${e.status}` : void 0)
				});
			} finally {
				if (alive.current) setBusy("");
			}
		};
		const matches = (s) => {
			const q = query.trim().toLowerCase();
			if (q && !String(s.serverName || "").toLowerCase().includes(q)) return false;
			if (fTransport !== "all" && String(s.config?.transport || "") !== fTransport) return false;
			if (fStatus === "enabled" && s.disabled) return false;
			if (fStatus === "off" && !s.disabled) return false;
			const needs = ["untrusted", "invalidated"].includes(trustOf(s.trust));
			if (fTrust === "trusted" && needs) return false;
			if (fTrust === "needsTrust" && !needs) return false;
			return true;
		};
		const visibleServers = servers.filter(matches);
		const current = servers.find((s) => s.serverName === selected) || visibleServers[0] || trashed.find((s) => s.serverName === selected) || null;
		const toolsKey = current ? `${current.serverName}:${configIdentity(current)}` : "";
		React.useEffect(() => {
			if (state.kind !== "ready" || area !== "servers" || tab !== "tools" || !current || current.trash?.trashed) return;
			let cancelled = false;
			const generation = ++toolsReadGeneration.current;
			const name = current.serverName;
			setToolsRead({
				key: toolsKey,
				loading: true,
				error: false
			});
			setToolCache((previous) => {
				const next = { ...previous };
				delete next[name];
				return next;
			});
			rpc("list_tools", { serverName: name }).then((data) => {
				if (cancelled || generation !== toolsReadGeneration.current) return;
				setToolCache((previous) => ({
					...previous,
					[name]: data
				}));
				setToolsRead({
					key: toolsKey,
					loading: false,
					error: false
				});
			}, () => {
				if (!cancelled && generation === toolsReadGeneration.current) setToolsRead({
					key: toolsKey,
					loading: false,
					error: true
				});
			});
			return () => {
				cancelled = true;
			};
		}, [
			state.kind,
			area,
			tab,
			toolsKey,
			toolsRetry
		]);
		const changeImport = (text) => {
			importRead.current++;
			setImportReading(false);
			setImportText(text);
			setImportPreview(null);
			setImportApprovals({});
			setImportResult(null);
			setImportFileName("");
		};
		const readImportFiles = async (files) => {
			const ticket = ++importRead.current;
			setImportReading(false);
			setImportText("");
			setImportPreview(null);
			setImportApprovals({});
			setImportResult(null);
			setImportFileName("");
			const file = files?.[0];
			if (files?.length !== 1 || !file || !/\.json$/i.test(file.name || "") || file.size > 24 * 1024) {
				setNotice({
					kind: "err",
					text: t("importFileError")
				});
				return;
			}
			setImportReading(true);
			try {
				const text = await file.text();
				if (!alive.current || ticket !== importRead.current) return;
				if (new TextEncoder().encode(text).length > 24 * 1024) throw new Error(t("importFileError"));
				JSON.parse(text);
				setImportText(text);
				setImportFileName(file.name);
				setNotice(null);
			} catch {
				if (alive.current && ticket === importRead.current) setNotice({
					kind: "err",
					text: t("importFileError")
				});
			} finally {
				if (alive.current && ticket === importRead.current) setImportReading(false);
			}
		};
		const closeImport = () => {
			if (busy) return;
			const close = () => {
				importRead.current++;
				setImportOpen(false);
				changeImport("");
			};
			if (importText || importPreview) setConfirmState({
				title: t("importTitle"),
				label: t("importDiscard"),
				fn: async () => {
					close();
					return {};
				}
			});
			else close();
		};
		if (state.kind === "loading") return h("div", {
			className: "waycraft-mcp",
			dir: isArabic() ? "rtl" : "ltr"
		}, h("style", null, STYLE), h("p", { role: "status" }, t("loading")));
		if (state.kind === "unauthorized") return h("div", {
			className: "waycraft-mcp",
			dir: isArabic() ? "rtl" : "ltr"
		}, h("style", null, STYLE), h("p", { role: "alert" }, t("unauthorized")));
		if (state.kind === "error") return h("div", {
			className: "waycraft-mcp",
			dir: isArabic() ? "rtl" : "ltr"
		}, h("style", null, STYLE), h("p", { role: "alert" }, t("error")), h("p", { className: "waycraft-mcp-note" }, ltr(state.message || "")), h("button", {
			type: "button",
			onClick: load
		}, t("retry")));
		const confirmUi = confirm ? h(ConfirmDialog, {
			title: confirm.title || t("confirm"),
			message: confirm.label,
			confirmLabel: confirm.confirmLabel || t("confirm"),
			danger: !!confirm.danger,
			busy: !!busy,
			onCancel: () => setConfirmState(null),
			onConfirm: () => {
				const c = confirm;
				setConfirmState(null);
				run(c.label, c.fn, c.success ? () => ({
					kind: "ok",
					text: c.success
				}) : void 0);
			}
		}) : null;
		const renderCandidate = (c, key) => h("li", {
			key,
			className: "waycraft-mcp-panel"
		}, h("div", { className: "waycraft-mcp-row" }, h("strong", null, ltr(c.serverName)), h("span", { className: "waycraft-mcp-meta" }, c.valid ? t("importValid") : t("importInvalid"), c.conflict ? ` · ${t("importConflict")}` : "", c.credentialRefs?.length ? ` · ${t("importCredRefs")}: ${c.credentialRefs.length}` : "")), c.conflict ? h("p", {
			className: "waycraft-mcp-note",
			role: "status"
		}, c.conflict.message || t("importConflict")) : null, c.scopeNote ? h("p", { className: "waycraft-mcp-note" }, c.scopeNote) : null, c.issues?.length ? h("p", {
			className: "waycraft-mcp-note",
			role: "status"
		}, c.issues.map((i) => i.message || i.code).join("; ")) : null, h("label", { style: {
			display: "flex",
			gap: "8px",
			alignItems: "center"
		} }, h("input", {
			type: "checkbox",
			checked: !!importApprovals[c.serverName]?.approved,
			disabled: !c.valid,
			onChange: (e) => setImportApprovals((m) => ({
				...m,
				[c.serverName]: {
					approved: e.target.checked,
					onConflict: m[c.serverName]?.onConflict || "skip"
				}
			}))
		}), t("importSelect")), c.conflict?.kind === "duplicate_existing" ? h("select", {
			"aria-label": t("importConflict"),
			value: importApprovals[c.serverName]?.onConflict || "skip",
			onChange: (e) => setImportApprovals((m) => ({
				...m,
				[c.serverName]: {
					approved: !!m[c.serverName]?.approved,
					onConflict: e.target.value
				}
			}))
		}, h("option", { value: "skip" }, t("importConflictSkip")), h("option", { value: "replace" }, t("importConflictReplace"))) : null, h("pre", { className: "waycraft-mcp-pre" }, JSON.stringify(c.config || {}, null, 2)));
		const registryArea = h("section", {
			"aria-label": t("registryTitle"),
			className: "waycraft-mcp-stack"
		}, h("strong", null, t("registryTitle")), h("p", { className: "waycraft-mcp-note" }, t("registryNote")), h("form", {
			className: "waycraft-mcp-row",
			onSubmit: (event) => {
				event.preventDefault();
				searchRegistry();
			}
		}, h("input", {
			"aria-label": t("registryQuery"),
			placeholder: t("registryQuery"),
			maxLength: 200,
			value: registryQuery,
			onInput: (event) => {
				registryGeneration.current++;
				registryAbort.current?.abort();
				setRegistryBusy(false);
				setRegistry(null);
				setRegistryQuery(event.target.value);
			}
		}), h("button", {
			type: "submit",
			disabled: registryBusy,
			onClick: (event) => {
				event.preventDefault();
				searchRegistry();
			}
		}, t("registrySearch"))), registryBusy ? h("p", { role: "status" }, t("loading")) : null, registryError ? h("div", { role: "alert" }, registryError, h("button", {
			type: "button",
			onClick: () => void searchRegistry()
		}, t("retry"))) : null, registry && !registryBusy ? h("div", null, !registry.servers?.length ? h("p", { role: "status" }, t("registryEmpty")) : null, ...(registry.servers || []).map((server) => {
			const identity = `${server.name}@${server.version}`;
			const remotes = (server.remotes || []).filter((remote) => remote.type === "streamable-http" && /^https?:\/\//i.test(remote.url));
			return h("article", {
				key: identity,
				className: "waycraft-mcp-panel",
				style: {
					borderBlockEnd: "1px solid var(--dsw-alias-border-l3)",
					paddingBlock: "12px"
				}
			}, h("div", { className: "waycraft-mcp-row" }, h("strong", null, ltr(server.name)), h("span", { className: "waycraft-mcp-meta" }, ltr(server.version)), h("button", {
				type: "button",
				"aria-expanded": registryDetail === identity,
				onClick: () => setRegistryDetail(registryDetail === identity ? "" : identity)
			}, t("registryDetails"))), h("p", {
				className: "waycraft-mcp-note",
				dir: "auto"
			}, server.description), registryDetail === identity ? h("div", { className: "waycraft-mcp-stack" }, h("span", { className: "waycraft-mcp-meta" }, t("registryTitle")), !remotes.length ? h("p", null, t("registryManual")) : h("p", { className: "waycraft-mcp-note" }, t("registryHeaders")), ...remotes.map((remote, index) => h("div", {
				key: index,
				className: "waycraft-mcp-row"
			}, ltr(remote.url), h("button", {
				type: "button",
				onClick: () => setForm({
					key: `registry-${identity}-${index}`,
					original: null,
					initial: emptyForm({
						transport: "streamable-http",
						serverName: server.name.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64),
						url: remote.url,
						registryReview: true,
						registryRequiredHeaders: remote.headers.filter((header) => header.required).map((header) => header.name),
						headers: remote.headers.filter((header) => header.required).map((header) => `${header.name}: `).join("\n")
					})
				})
			}, t("registryReview"))))) : null);
		}), registry.nextCursor ? h("button", {
			type: "button",
			disabled: registryBusy,
			onClick: () => void searchRegistry(registry.nextCursor)
		}, t("registryNext")) : null) : null);
		const discoveryArea = h("section", {
			"aria-label": t("discoverTitle"),
			className: "waycraft-mcp-card"
		}, h("div", { className: "waycraft-mcp-card-body" }, h("strong", null, t("discoverTitle")), h("p", { className: "waycraft-mcp-note" }, t("discoverNote"), " ", t("discoverCandidatesNote")), h("label", null, t("discoverRoots"), h("textarea", {
			value: discoverRoots,
			onInput: (e) => setDiscoverRoots(e.target.value),
			rows: 3,
			spellCheck: false,
			className: "waycraft-mcp-mono"
		})), h("div", { className: "waycraft-mcp-row" }, h("button", {
			type: "button",
			disabled: !!busy,
			onClick: () => void run("discover", async () => {
				const roots = discoverRoots.split(/\n+/).map((s) => s.trim()).filter(Boolean);
				if (!roots.length) throw new Error(t("discoverRoots"));
				const d = await rpc("discover", { roots });
				setDiscovery(d.discovery || d);
				return d;
			})
		}, t("discoverScan")))), discovery ? h("div", { className: "waycraft-mcp-card" }, h("div", { className: "waycraft-mcp-card-body" }, h("p", { className: "waycraft-mcp-meta" }, t("discoverCandidate"), ": ", String(discovery.stats?.candidates || 0), " · ", t("discoverMalformed"), ": ", String(discovery.stats?.malformed || 0), " · ", t("discoverOversized"), ": ", String(discovery.stats?.oversized || 0)), (discovery.files || []).length ? (discovery.files || []).map((f, i) => h("article", {
			key: f.path || i,
			className: "waycraft-mcp-card"
		}, h("div", { className: "waycraft-mcp-card-body" }, h("div", { className: "waycraft-mcp-row" }, h("strong", null, ltr(f.relativePath || f.path || "")), h("span", { className: "waycraft-mcp-meta" }, f.status)), f.message ? h("p", { className: "waycraft-mcp-notice" }, f.message) : null, f.preview?.candidates?.length ? h("ul", { className: "waycraft-mcp-list" }, f.preview.candidates.map((c, j) => renderCandidate(c, `${f.path}:${j}`))) : null))) : h("p", { className: "waycraft-mcp-note" }, t("discoverEmpty")))) : h("p", { className: "waycraft-mcp-note" }, t("discoverEmpty")));
		const importArea = h("section", {
			"aria-label": t("importTitle"),
			className: "waycraft-mcp-card"
		}, h("div", { className: "waycraft-mcp-card-body" }, notice?.kind === "err" ? h("p", {
			role: "alert",
			className: "waycraft-mcp-alert"
		}, notice.text) : null, h("p", { className: "waycraft-mcp-note" }, t("importNote")), h("p", { className: "waycraft-mcp-note" }, t("importFormats")), h("div", {
			className: "waycraft-mcp-dropzone",
			onDragOver: (e) => e.preventDefault(),
			onDrop: (e) => {
				e.preventDefault();
				if (!busy) readImportFiles(e.dataTransfer?.files);
			}
		}, h("p", null, t("importDrop")), h("label", { className: "waycraft-mcp-file-choice" }, t("importFile"), h("input", {
			"aria-label": t("importFile"),
			type: "file",
			accept: ".json,application/json",
			disabled: !!busy,
			onChange: (e) => {
				readImportFiles(e.target.files);
				e.target.value = "";
			}
		})), importFileName ? h("p", { role: "status" }, ltr(importFileName)) : null), h("label", null, t("importJson"), h("textarea", {
			value: importText,
			disabled: !!busy,
			onInput: (e) => changeImport(e.target.value),
			rows: 6,
			spellCheck: false,
			className: "waycraft-mcp-mono",
			dir: "ltr"
		})), h("div", { className: "waycraft-mcp-row" }, h("button", {
			type: "button",
			disabled: !!busy || importReading,
			onClick: () => void run("import-preview", async () => {
				const generation = importRead.current;
				setImportPreview(null);
				setImportApprovals({});
				setImportResult(null);
				if (new TextEncoder().encode(importText).length > 24 * 1024) throw new Error(t("importFileError"));
				let input = importText;
				try {
					input = JSON.parse(importText);
				} catch {}
				let d;
				try {
					d = await rpc("import_preview", { input });
				} catch (error) {
					if (!alive.current || generation !== importRead.current) return;
					throw error;
				}
				if (!alive.current || generation !== importRead.current) return;
				setImportPreview(d.preview || d);
				setImportApprovals({});
				setImportResult(null);
				return d;
			})
		}, t("importPreview")), h("button", {
			type: "button",
			className: "waycraft-mcp-primary",
			disabled: !!busy || !importPreview?.ok,
			onClick: () => void run("import-register", async () => {
				const approvals = Object.entries(importApprovals).filter(([, v]) => v?.approved).map(([serverName, v]) => ({
					serverName,
					approved: true,
					onConflict: v.onConflict || "skip"
				}));
				if (!approvals.length) throw new Error(t("importNoPreview"));
				let d;
				try {
					d = await rpc("import_register", {
						preview: importPreview,
						approvals
					});
				} catch (e) {
					if (!e?.data?.import) throw e;
					d = e.data;
				}
				setImportResult(d.import || d);
				setImportPreview(null);
				setImportApprovals({});
				return d;
			}, (d) => {
				const stats$1 = (d.import || d).stats || {};
				return [
					"rejected",
					"failed",
					"skipped"
				].some((k) => Number(stats$1[k]) > 0) ? {
					kind: "warn",
					text: t("importPartialWarning")
				} : void 0;
			})
		}, t("importApproveRegister")))), !importPreview ? h("p", { className: "waycraft-mcp-notice" }, t("importNoPreview")) : h("div", { className: "waycraft-mcp-card" }, h("div", { className: "waycraft-mcp-card-body" }, h("p", { className: "waycraft-mcp-meta" }, t("importValid"), ": ", String(importPreview.stats?.valid || 0), " · ", t("importInvalid"), ": ", String(importPreview.stats?.invalid || 0), " · ", t("importConflict"), ": ", String(importPreview.stats?.conflicts || 0)), importPreview.scope?.note ? h("p", { className: "waycraft-mcp-notice" }, importPreview.scope.note) : null, (importPreview.issues || []).length ? h("div", {
			role: "alert",
			className: "waycraft-mcp-alert"
		}, (importPreview.issues || []).map((iss, i) => h("div", { key: i }, ltr(iss.path || ""), iss.path ? ": " : "", iss.message || String(iss)))) : null, h("ul", { className: "waycraft-mcp-list" }, (importPreview.candidates || []).map((c, i) => renderCandidate(c, `import:${i}`))))), importResult ? h("div", {
			role: "status",
			className: "waycraft-mcp-alert"
		}, h("strong", null, t("importRegistered")), importSummary(importResult.stats).map((line, i) => h("p", {
			key: i,
			className: "waycraft-mcp-notice"
		}, line)), h("p", { className: "waycraft-mcp-notice" }, t("importResultNote"))) : null);
		const switchControl = (props) => h("button", {
			type: "button",
			role: "switch",
			"aria-checked": props.checked,
			"aria-disabled": props.disabled,
			"aria-label": props.label,
			title: props.title,
			className: "waycraft-mcp-switch" + (props.bare ? "" : ""),
			disabled: props.disabled,
			onClick: props.onToggle
		}, h("span", {
			className: "waycraft-mcp-switch-thumb",
			"aria-hidden": "true"
		}));
		function configIdentity(s) {
			return String(s?.reviewedConfigFingerprint || JSON.stringify(s?.config || {}));
		}
		const runTest = (serverName) => run("test", async () => {
			toolsReadGeneration.current++;
			setToolsRead({
				key: toolsKey,
				loading: false,
				error: false
			});
			const config = configIdentity(servers.find((s) => s.serverName === serverName));
			try {
				const d = await rpc("test_connection", {
					serverName,
					expectedFingerprint: fingerprint
				});
				setTestResults((m) => ({
					...m,
					[serverName]: {
						ok: !!d.test?.ok,
						message: String(d.test?.message || ""),
						config
					}
				}));
				if (d.toolCache) setToolCache((m) => ({
					...m,
					[serverName]: d.toolCache
				}));
				return d;
			} catch (e) {
				const msg = String(e?.data?.test?.message || "");
				if (e?.data?.test) {
					setTestResults((m) => ({
						...m,
						[serverName]: {
							ok: false,
							message: msg,
							config
						}
					}));
					if (e.data.toolCache) setToolCache((m) => ({
						...m,
						[serverName]: e.data.toolCache
					}));
					throw new Error(`${t("testFailed")}: ${msg}`);
				}
				throw e;
			}
		});
		const connectionStatus = (s) => {
			if (s.disabled) return ["off", "connectionOff"];
			if (trustOf(s.trust) !== "trusted") return ["warning", "connectionReview"];
			const result = testResults[s.serverName];
			if (result && result.config === configIdentity(s)) return result.ok ? ["success", "connectionPassed"] : ["error", "connectionFailed"];
			return ["unknown", "connectionUnknown"];
		};
		const openEdit = (server) => setForm({
			key: server.serverName,
			initial: formFromServer(server),
			original: server
		});
		const icon = (path, viewBox = "0 0 24 24") => h("svg", {
			viewBox,
			width: 16,
			height: 16,
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": "true"
		}, h("path", { d: path }));
		const ICON = {
			servers: "M4 3h16v7H4zM4 14h16v7H4zM7 6.5h.01M7 17.5h.01",
			search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
			trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
			edit: "M16 3l5 5M3 21l5-1L21 7l-4-4L4 16z",
			test: "M8 5v14l11-7z",
			trust: "M12 3l8 4v5c0 5-8 9-8 9s-8-4-8-9V7zM8 12l3 3 5-6"
		};
		const iconAct = (labelKey, path, onClick, cls) => h("button", {
			type: "button",
			className: "waycraft-mcp-icon-btn" + (cls ? " " + cls : ""),
			"aria-label": t(labelKey),
			title: t(labelKey),
			disabled: !!busy,
			onClick
		}, icon(path));
		const serverRow = (s, inTrash) => {
			const open = !inTrash && selected === s.serverName;
			const needsTrust = ["untrusted", "invalidated"].includes(trustOf(s.trust));
			const headBadges = [s.trash?.trashed ? h("span", {
				key: "tr",
				className: "waycraft-mcp-badge waycraft-mcp-badge-warn"
			}, t("filterTrashed")) : null];
			const [status, statusKey] = connectionStatus(s);
			const lastCheck = testResults[s.serverName];
			const statusTitle = [t(statusKey), lastCheck?.config === configIdentity(s) ? checkedAtLabel(lastCheck.checkedAt) : ""].filter(Boolean).join(" · ");
			const title = h("span", { className: "waycraft-mcp-row-title" }, h("strong", null, ltr(s.serverName)));
			return h("article", {
				key: s.serverName,
				className: "waycraft-mcp-card" + (open ? " is-open" : ""),
				"data-waycraft-server": s.serverName
			}, h("div", {
				className: "waycraft-mcp-row-head",
				"data-off": s.disabled ? "" : void 0
			}, !inTrash ? h("span", {
				className: `waycraft-mcp-status waycraft-mcp-status-${status}`,
				role: "img",
				"aria-label": statusTitle,
				title: statusTitle
			}) : null, inTrash ? h("div", { className: "waycraft-mcp-row-toggle" }, title) : h("button", {
				type: "button",
				className: "waycraft-mcp-row-toggle",
				"aria-expanded": open,
				onClick: () => {
					setSelected(open ? null : s.serverName);
					setTab("overview");
				}
			}, title), !inTrash && needsTrust ? h("span", {
				className: "waycraft-mcp-badge waycraft-mcp-badge-warn",
				title: trustLabel(s.trust)
			}, icon("M12 3L2 21h20zM12 9v5M12 17h.01"), t("trustBadgeUntrusted")) : null, h("span", { className: "waycraft-mcp-row-sub" }, ltr(s.config?.transport), " · ", ownershipLabel(s.ownership)), ...headBadges, inTrash ? h(React.Fragment, null, h("button", {
				type: "button",
				disabled: !!busy,
				onClick: () => setConfirmState({
					success: `${t("toastRestored")}: ${s.serverName}`,
					title: t("restore"),
					confirmLabel: t("restore"),
					label: `${t("restore")}: ${s.serverName}?`,
					fn: () => rpc("restore", {
						serverName: s.serverName,
						expectedFingerprint: fingerprint
					})
				})
			}, t("restore")), h("button", {
				type: "button",
				className: "waycraft-mcp-danger",
				disabled: !!busy,
				onClick: () => setConfirmState({
					success: `${t("toastDeleted")}: ${s.serverName}`,
					title: t("permanentDelete"),
					confirmLabel: t("permanentDelete"),
					label: t("confirmPermanent"),
					danger: true,
					fn: () => rpc("permanent_delete", {
						serverName: s.serverName,
						expectedFingerprint: fingerprint,
						confirm: true
					})
				})
			}, t("permanentDelete"))) : h(React.Fragment, null, h("span", { className: "waycraft-mcp-row-actions" }, h(MoreMenu, {
				label: `${t("more")}: ${s.serverName}`,
				disabled: !!busy
			}, iconAct("testConnection", ICON.test, () => void runTest(s.serverName)), iconAct("editServer", ICON.edit, () => openEdit(s)), needsTrust ? iconAct("approveTrust", ICON.trust, () => void run("trust", () => rpc("approve_trust", {
				serverName: s.serverName,
				reviewedConfigFingerprint: s.reviewedConfigFingerprint,
				expectedFingerprint: fingerprint
			})), "waycraft-mcp-attn") : null, iconAct("moveToTrash", ICON.trash, () => setConfirmState({
				success: `${t("toastTrashed")}: ${s.serverName}`,
				title: t("moveToTrash"),
				confirmLabel: t("moveToTrash"),
				label: t("confirmTrash"),
				danger: true,
				fn: () => rpc("trash", {
					serverName: s.serverName,
					expectedFingerprint: fingerprint
				})
			}), "waycraft-mcp-danger"))), switchControl({
				checked: !s.disabled,
				disabled: !!busy,
				label: `${t("configEnabled")}: ${s.serverName}`,
				title: t("configOffHelp"),
				onToggle: () => void run("config-off", () => rpc("update", {
					serverName: s.serverName,
					expectedFingerprint: fingerprint,
					patch: { disabled: !s.disabled }
				})),
				bare: true
			}), h("button", {
				type: "button",
				className: "waycraft-mcp-icon-btn waycraft-mcp-expand",
				"aria-label": s.serverName,
				"aria-expanded": open,
				onClick: () => {
					setSelected(open ? null : s.serverName);
					setTab("overview");
				}
			}, h("span", {
				className: "waycraft-mcp-chev",
				"aria-hidden": "true"
			})))), open ? h("div", { className: "waycraft-mcp-card-body" }, detailBody(s)) : null);
		};
		const detailBody = (current$1) => h("div", {
			className: "waycraft-mcp-detail",
			"aria-label": t("tabs")
		}, h("div", {
			className: "waycraft-mcp-tabs",
			role: "tablist",
			"aria-label": t("tabs")
		}, [
			"overview",
			"tools",
			"configuration",
			"security"
		].map((id) => h("button", {
			key: id,
			type: "button",
			role: "tab",
			"aria-selected": tab === id,
			tabIndex: tab === id ? 0 : -1,
			onClick: () => setTab(id)
		}, t(id === "security" ? "security" : id)))), tab === "overview" ? h("div", {
			role: "tabpanel",
			className: "waycraft-mcp-panel"
		}, h("dl", { className: "waycraft-mcp-kv" }, h("dt", null, t("status")), h("dd", null, statusLabel(current$1)), h("dt", null, t("trustState")), h("dd", null, trustLabel(current$1.trust)), h("dt", null, t("transport")), h("dd", null, ltr(current$1.config?.transport)), h("dt", null, t("savedState")), h("dd", null, savedLabel(current$1)), h("dt", null, t("runtimeState")), h("dd", null, t("statusRestart")), h("dt", null, t("testOutcome")), h("dd", null, testLabel(testResults[current$1.serverName]?.config === configIdentity(current$1) ? testResults[current$1.serverName] : void 0)))) : null, tab === "tools" ? h("div", {
			role: "tabpanel",
			className: "waycraft-mcp-panel"
		}, h("p", { className: "waycraft-mcp-note" }, t("readOnlyTools")), h("div", { className: "waycraft-mcp-row" }, toolsRead.error && toolsRead.key === toolsKey ? h("button", {
			type: "button",
			onClick: () => setToolsRetry((n) => n + 1)
		}, t("retry")) : null, toolsRead.key !== toolsKey || toolsRead.loading ? h("span", { role: "status" }, t("loading")) : null, toolsRead.key === toolsKey && toolsRead.error ? h("p", { role: "alert" }, t("toolsReadError")) : null, h("button", {
			type: "button",
			disabled: !!busy || !!current$1.trash?.trashed,
			onClick: () => void run("refresh", async () => {
				const generation = ++toolsReadGeneration.current;
				setToolsRead({
					key: toolsKey,
					loading: false,
					error: false
				});
				const d = await rpc("refresh_tools", {
					serverName: current$1.serverName,
					expectedFingerprint: fingerprint
				});
				if (alive.current && generation === toolsReadGeneration.current) setToolCache((m) => ({
					...m,
					[current$1.serverName]: d
				}));
				return d;
			})
		}, t("refreshTools"))), (() => {
			const tc = toolCache[current$1.serverName];
			const tools = tc?.tools || tc?.cache?.tools || [];
			if (!tc) return h("p", { className: "waycraft-mcp-note" }, t("toolsNever"));
			if (!tools.length) return h("p", { className: "waycraft-mcp-note" }, t("noTools"));
			return h("div", { className: "waycraft-mcp-tools" }, h("table", null, h("thead", null, h("tr", null, h("th", null, t("toolName")), h("th", null, t("toolDescription")))), h("tbody", null, ...tools.map((tool) => h("tr", { key: tool.name }, h("td", null, ltr(tool.name)), h("td", null, tool.description || ""))))));
		})()) : null, tab === "configuration" ? h("div", {
			role: "tabpanel",
			className: "waycraft-mcp-panel"
		}, h("pre", { className: "waycraft-mcp-pre" }, JSON.stringify(current$1.config || {}, null, 2)), current$1.limitation || current$1.trash?.limitation ? h("p", {
			role: "status",
			className: "waycraft-mcp-note"
		}, t("limitation"), ": ", current$1.limitation || current$1.trash?.limitation) : null) : null, tab === "security" ? h("div", {
			role: "tabpanel",
			className: "waycraft-mcp-panel"
		}, h("dl", { className: "waycraft-mcp-kv" }, h("dt", null, t("trustState")), h("dd", null, trustLabel(current$1.trust)), h("dt", null, t("fingerprint")), h("dd", null, ltr(current$1.reviewedConfigFingerprint || current$1.trust?.reviewedFingerprint || "")), h("dt", null, t("ownership")), h("dd", null, ownershipLabel(current$1.ownership))), current$1.trash?.trashed ? h("p", { className: "waycraft-mcp-note" }, t("trashedAt"), ": ", ltr(current$1.trash.trashedAt || "")) : null, current$1.trash?.limitation ? h("p", {
			role: "status",
			className: "waycraft-mcp-note"
		}, t("limitation"), ": ", current$1.trash.limitation) : null) : null);
		const trustedCount = servers.filter((x) => trustOf(x.trust) === "trusted").length;
		const needsCount = servers.filter((x) => ["untrusted", "invalidated"].includes(trustOf(x.trust))).length;
		const offCount = servers.filter((x) => x.disabled).length;
		const stats = h("div", {
			className: "waycraft-mcp-stats",
			role: "group",
			"aria-label": t("title")
		}, [
			[servers.length, t("statServers")],
			[trustedCount, t("statTrusted")],
			[needsCount, t("statNeedsReview")],
			[offCount, t("statOff")]
		].map(([n, label]) => h("div", {
			key: label,
			className: "waycraft-mcp-stat"
		}, h("strong", null, n), h("span", null, label))));
		const opt = (v, label) => h("option", {
			key: v,
			value: v
		}, label);
		const serversArea = h("div", { className: "waycraft-mcp-stack" }, h("div", {
			className: "waycraft-mcp-filterrow",
			role: "group",
			"aria-label": t("filters")
		}, h("select", {
			"aria-label": t("filterAllTransports"),
			value: fTransport,
			onChange: (e) => setFTransport(e.target.value)
		}, opt("all", t("filterAllTransports")), opt("stdio", "stdio"), opt("streamable-http", "streamable-http")), h("select", {
			"aria-label": t("filterAllStatuses"),
			value: fStatus,
			onChange: (e) => setFStatus(e.target.value)
		}, opt("all", t("filterAllStatuses")), opt("enabled", t("filterEnabled")), opt("off", t("filterOff"))), h("select", {
			"aria-label": t("filterAllTrust"),
			value: fTrust,
			onChange: (e) => setFTrust(e.target.value)
		}, opt("all", t("filterAllTrust")), opt("trusted", t("filterTrusted")), opt("needsTrust", t("filterNeedsTrust")))), h("div", {
			className: "waycraft-mcp-toolbar",
			role: "search"
		}, h("input", {
			"aria-label": t("search"),
			placeholder: t("search"),
			value: query,
			onInput: (e) => setQuery(e.target.value)
		}), h("div", { className: "waycraft-mcp-iconbar" }, tooltip(t("refreshAria"), h("button", {
			type: "button",
			className: "waycraft-mcp-icon-btn",
			"aria-label": t("refreshAria"),
			disabled: !!busy,
			onClick: load,
			title: t("refresh")
		}, icon("M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3", "0 0 16 16"))), tooltip(t("addServer"), h("button", {
			type: "button",
			className: "waycraft-mcp-icon-btn",
			"aria-label": t("addServer"),
			disabled: !!busy,
			onClick: () => setForm({
				key: Date.now(),
				initial: emptyForm(),
				original: null
			}),
			title: t("addServer")
		}, icon("M8 3v10M3 8h10", "0 0 16 16"))), tooltip(t("importTitle"), h("button", {
			type: "button",
			className: "waycraft-mcp-icon-btn",
			"aria-label": t("importTitle"),
			disabled: !!busy,
			onClick: () => setImportOpen(true)
		}, icon("M8 2v8M5 7l3 3 3-3M3 11v3h10v-3", "0 0 16 16"))))), stats, h("ul", {
			className: "waycraft-mcp-list",
			"aria-label": t("serverList")
		}, visibleServers.length ? visibleServers.map((x) => h("li", { key: x.serverName }, serverRow(x, false))) : h("li", { className: "waycraft-mcp-note" }, t("empty"))));
		const trashArea = h("div", null, h("p", { className: "waycraft-mcp-note" }, t("trashNote")), h("ul", {
			className: "waycraft-mcp-list",
			"aria-label": t("trashList")
		}, trashed.length ? trashed.map((s) => h("li", { key: s.serverName }, serverRow(s, true))) : h("li", { className: "waycraft-mcp-note" }, t("emptyTrash"))));
		return h("div", {
			className: "waycraft-mcp",
			dir: isArabic() ? "rtl" : "ltr",
			"data-waycraft-mcp-ui": "175"
		}, h("style", null, STYLE), h("div", { className: "waycraft-mcp-header" }, h("h2", { className: "waycraft-mcp-title" }, t("title"))), h(Toast, {
			notice,
			onDismiss: () => setNotice(null)
		}), h("div", {
			className: "waycraft-mcp-seg",
			role: "tablist",
			"aria-label": t("title")
		}, [
			["servers", t("areaServers")],
			["discover", t("areaDiscoverImport")],
			["trash", t("areaTrash")]
		].map(([id, label]) => h("button", {
			key: id,
			type: "button",
			role: "tab",
			"aria-selected": area === id,
			tabIndex: area === id ? 0 : -1,
			onClick: () => setArea(id)
		}, icon(ICON[id === "servers" ? "servers" : id === "discover" ? "search" : "trash"]), label, id === "trash" && trashed.length ? h("span", { className: "waycraft-mcp-badge" }, trashed.length) : ""))), area === "servers" ? serversArea : null, form ? h(ServerFormDialog, {
			key: String(form.key),
			initial: form.initial,
			original: form.original,
			fingerprint,
			onClose: () => setForm(null),
			onConflict: (fp) => {
				if (fp) setFingerprint(fp);
				load();
			},
			onSaved: (d) => {
				setForm(null);
				const name = form.original ? form.original.serverName : d?.server?.serverName;
				if (name) setTestResults((m) => {
					const { [name]: _drop,...rest } = m;
					return rest;
				});
				load().then(() => {
					if (alive.current) setNotice({
						kind: "ok",
						text: t("saveDone")
					});
				});
			}
		}) : null, importOpen ? h(ImportDialog, {
			onClose: closeImport,
			suspended: !!confirm
		}, importArea) : null, area === "discover" ? h("div", { className: "waycraft-mcp-stack" }, registryArea, h("details", null, h("summary", null, t("discoverTitle")), discoveryArea), h("button", {
			type: "button",
			onClick: () => setImportOpen(true)
		}, t("importTitle"))) : null, area === "trash" ? trashArea : null, confirmUi);
	}
	effect(() => {
		let off;
		let disposed = false;
		let delay = 3e3;
		let timer;
		const show = () => {
			if (off || disposed) return;
			off = ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "waycraft-mcp",
				order: 92,
				label: () => t("title")
			}, McpPanel));
		};
		const hide = () => {
			off?.();
			off = void 0;
		};
		const probe = () => rpc("status").then(() => {
			delay = 3e3;
			show();
		}).catch((e) => {
			if (e?.status === 404) hide();
			else if (e?.status === 401 || e?.status === 403) show();
			else delay = Math.min(delay * 2, 6e4);
		}).finally(() => {
			if (!disposed) {
				timer = setTimeout(() => void probe(), delay);
				timer?.unref?.();
			}
		});
		probe();
		return () => {
			disposed = true;
			clearTimeout(timer);
			hide();
		};
	}, "waycraft-mcp presence");
}

//#endregion
//#region src/ImageGallery.tsx
const FONT_S_12$1 = "var(--dsw-font-s-12, 400 12px/18px var(--dsw-font-family))";
const FONT_S_13$1 = "var(--dsw-font-s-13, 400 13px/20px var(--dsw-font-family))";
/** Display box for a lone image (platform rule): long edge 240px with the
* rendered aspect ratio clamped to [0.25, 4] — the overflow is cropped by
* `object-fit: cover` — and never upscaled past the image's natural size. The
* crop anchor keeps the top of very tall images and the left of very wide
* ones, where the informative content usually starts. */
function singleFit(attachment) {
	const natural = attachment.width / attachment.height;
	const ratio = Math.min(4, Math.max(.25, natural));
	const box = ratio >= 1 ? {
		width: 240,
		height: 240 / ratio
	} : {
		width: 240 * ratio,
		height: 240
	};
	const scale = Math.min(1, attachment.width / box.width, attachment.height / box.height);
	return {
		width: Math.max(1, Math.round(box.width * scale)),
		height: Math.max(1, Math.round(box.height * scale)),
		objectPosition: natural < .25 ? "center top" : natural > 4 ? "left center" : "center"
	};
}
const styles$6 = {
	gallery: {
		display: "flex",
		flexWrap: "wrap",
		gap: 8,
		justifyContent: "flex-start"
	},
	frame: {
		display: "grid",
		placeItems: "center",
		overflow: "hidden",
		padding: 0,
		border: "1px solid var(--dsw-alias-border-l2-darkmode-thin)",
		borderRadius: 8,
		background: "var(--dsw-alias-interactive-bg-hover-solid)",
		cursor: "zoom-in"
	},
	tile: {
		width: 64,
		height: 64
	},
	img: {
		width: "100%",
		height: "100%",
		objectFit: "cover",
		display: "block"
	},
	loading: {
		font: FONT_S_12$1,
		color: "var(--dsw-alias-label-tertiary)",
		padding: "0 8px"
	},
	error: {
		font: FONT_S_12$1,
		color: "var(--dsw-alias-state-error-primary)",
		cursor: "pointer",
		border: "1px solid var(--dsw-alias-border-l2-darkmode-thin)",
		borderRadius: 8,
		background: "transparent",
		padding: "6px 10px"
	},
	overlay: {
		position: "fixed",
		inset: 0,
		zIndex: 1e3,
		display: "grid",
		placeItems: "center",
		background: "var(--dsw-alias-bg-mask-1)",
		padding: 24
	},
	overlayImg: {
		maxWidth: "92vw",
		maxHeight: "92vh",
		objectFit: "contain",
		borderRadius: 4
	},
	close: {
		position: "absolute",
		insetBlockStart: 12,
		insetInlineEnd: 12,
		width: 32,
		height: 32,
		display: "grid",
		placeItems: "center",
		border: "none",
		borderRadius: "50%",
		cursor: "pointer",
		background: "var(--dsw-alias-bg-layer-1)",
		color: "var(--dsw-alias-label-primary)",
		font: FONT_S_13$1
	}
};
/**
* Full-viewport original-image preview: backdrop or close-control click and
* Escape all dismiss; the image itself is inert so a click on it does not
* fall through to the backdrop dismissal.
*/
function ImageLightbox({ src, alt, labels, onClose }) {
	const closeButton = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		const opener = document.activeElement;
		closeButton.current?.focus();
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
			if (event.key === "Tab") {
				event.preventDefault();
				closeButton.current?.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			opener?.focus();
		};
	}, [onClose]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		role: "dialog",
		"aria-modal": true,
		"aria-label": labels.dialog,
		style: styles$6.overlay,
		onClick: onClose,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
			src,
			alt,
			style: styles$6.overlayImg,
			onClick: (event) => {
				event.stopPropagation();
			}
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			ref: closeButton,
			type: "button",
			"aria-label": labels.close,
			style: styles$6.close,
			onClick: onClose,
			children: "×"
		})]
	});
}
/**
* Compact history renderer with retryable loading and click-to-open original
* preview. A lone image renders at its `singleFit` size; an image among
* several renders as a fixed 64px square tile.
*/
function MessageImage({ attachment, load, variant, labels }) {
	const [src, setSrc] = (0, react.useState)(null);
	const [error, setError] = (0, react.useState)(false);
	const [open, setOpen] = (0, react.useState)(false);
	const [attempt, setAttempt] = (0, react.useState)(0);
	const retry = (0, react.useCallback)(() => {
		setAttempt((a) => a + 1);
	}, []);
	const close = (0, react.useCallback)(() => {
		setOpen(false);
	}, []);
	const fit = (0, react.useMemo)(() => variant === "single" ? singleFit(attachment) : void 0, [attachment, variant]);
	(0, react.useEffect)(() => {
		let live = true;
		setError(false);
		setSrc(null);
		load(attachment).then((url) => {
			if (live) setSrc(url);
		}).catch(() => {
			if (live) setError(true);
		});
		return () => {
			live = false;
		};
	}, [
		attachment,
		load,
		attempt
	]);
	const label = attachment.name ?? labels.image;
	if (error) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		style: styles$6.error,
		onClick: retry,
		children: labels.loadFailed
	});
	const box = fit === void 0 ? styles$6.tile : {
		width: fit.width,
		height: fit.height
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		style: {
			...styles$6.frame,
			...box
		},
		title: labels.open,
		"aria-label": labels.openNamed(label),
		onClick: () => {
			if (src !== null) setOpen(true);
		},
		children: src === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: styles$6.loading,
			children: labels.loading
		}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
			src,
			alt: label,
			style: {
				...styles$6.img,
				objectPosition: fit?.objectPosition
			},
			onError: () => {
				setOpen(false);
				setError(true);
			}
		})
	}), open && src !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImageLightbox, {
		src,
		alt: label,
		labels: labels.lightbox,
		onClose: close
	})] });
}
/** Wrapping image group: a lone image renders large, several render as 64px
* square tiles (same rule as the platform gallery). */
function ImageGallery({ images, load, labels }) {
	if (images.length === 0) return null;
	const variant = images.length === 1 ? "single" : "tile";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: styles$6.gallery,
		children: images.map((image, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MessageImage, {
			attachment: image.attachment,
			load,
			variant,
			labels
		}, `${image.attachment.attachmentId}:${index}`))
	});
}

//#endregion
//#region src/subscriptions-rpc.ts
async function callSubscriptionsAuth$1(rpc, endpoint, payload) {
	const result = await rpc.call("/api", `waycraft-subscriptions.${endpoint}`, payload);
	if (!result?.ok) throw new Error(result?.error?.message ?? "Subscriptions unavailable");
	return result.value;
}

//#endregion
//#region locale/en.json
var subscriptions$1 = {
	"pageSettings": "Settings",
	"providerConfigured": "Account configured (inference not verified)",
	"providerAttention": "Provider needs attention",
	"freeProviders": "Free providers",
	"apiSubscription": "Subscription",
	"zenEnabled": "Enable OpenCode Zen",
	"zenDisabled": "Disabled — new requests are blocked",
	"zenRefresh": "Refresh status",
	"zenNoLogin": "Free models · no login required",
	"zenUnavailable": "OpenCode Zen is unavailable.",
	"zenReachable": "Gateway reachable (catalog only; inference not verified)",
	"zenUnreachable": "Gateway unreachable; fallback models may not be available.",
	"zenModelCount": "Available models",
	"zenSource_gateway": "Gateway catalog",
	"zenSource_static": "Static fallback",
	"zenSource_cache": "Cached fallback",
	"apiUnavailable": "Native API-provider remotes are unavailable. Browser admission must be verified before use.",
	"apiRefresh": "Refresh API providers",
	"apiLoading": "Loading native providers…",
	"apiFailed": "The native operation failed. Your draft is retained; refresh or retry. No remote diagnostic is displayed because it may contain sensitive data.",
	"apiConflict": "Settings changed underneath this editor. Your draft was not overwritten or applied. Cancel, refresh and reopen to reconcile your changes.",
	"apiPartial": "Provider settings were saved, but the key operation failed. Your key intent is retained; retry saves only the outstanding key operation.",
	"apiInvalid": "Check the route, HTTP(S) URL and model JSON. Custom endpoints need a base URL and at least one model.",
	"apiSaved": "Saved to native DSH settings.",
	"apiKeySet": "Key configured",
	"apiKeyMissing": "No key configured",
	"apiKeyUnknown": "Key status unavailable",
	"apiAccountUnknown": "Account status unavailable",
	"apiAdd": "Add provider",
	"apiEdit": "Edit provider",
	"apiDelete": "Delete added provider",
	"apiCustom": "Custom API",
	"apiCatalog": "Provider catalog",
	"apiChoose": "Choose a provider",
	"apiModelID": "Model ID",
	"apiModelName": "Model name",
	"apiModelAdd": "Add model",
	"apiModelRemove": "Remove model",
	"apiEditor": "API provider editor",
	"apiRoute": "Provider route (lowercase words separated by hyphens)",
	"apiName": "Display name",
	"apiURL": "Base URL",
	"apiProtocol": "Protocol",
	"apiKeyAction": "Key action",
	"apiKey_keep": "Keep current key",
	"apiKey_set": "Set or replace key",
	"apiKey_unset": "Remove stored key",
	"apiKey": "New key (write only)",
	"apiKeyLimit": "Stored keys are never read back. Settings and key writes are separate native operations, not a transaction. Removing a stored key may reveal an environment fallback. Deleting a provider does not delete shared credentials.",
	"apiFetch": "Fetch available models",
	"apiModels": "Models",
	"apiModelsHint": "Edit model IDs and names. Existing model capabilities and metadata are preserved. Fetch replaces this draft only; Apply saves it.",
	"apiSave": "Apply",
	"apiCancel": "Cancel provider edit",
	"antigravitySetupRequired": "Antigravity OAuth client configuration is malformed. Correct the configured client pair; stored accounts are retained.",
	"copilotDeviceHint": "Enter this code on the GitHub verification page.",
	"copyDeviceCode": "Copy code",
	"copilotProviderUnavailable": "Copilot is unavailable. Disable the reference component first.",
	"title": "AI Providers",
	"accounts": "Subscription accounts",
	"providers": "Model providers",
	"subscriptionProviders": "Subscription providers",
	"apiProviders": "API providers",
	"subscriptionAdd": "Add subscription provider",
	"accountCount": "account(s)",
	"subscriptionDetails": "Provider details",
	"providersHint": "Manage subscription accounts and usage. Use Add account below to sign in.",
	"accountsEmpty": "No subscription accounts yet.",
	"providersEmpty": "No API providers yet.",
	"unreachable": "The Subscriptions host component cannot be reached. Reconnect or check the component on the Plugins page.",
	"coexistence": "The reference plugin dsh-plugin-subscriptions is running too. Only one plugin can serve the shared provider ids (codex, claude, grok, copilot, antigravity) at a time; switch the reference plugin off before using providers from this component.",
	"loginProgress": "Login in progress…",
	"connected": "account(s) connected",
	"notLoggedIn": "Not logged in",
	"clientVersion": "Client version",
	"source_npm": "latest on npm",
	"source_local": "local CLI",
	"source_fallback": "built-in",
	"source_config": "configured",
	"addAccount": "Add account",
	"openAuthorization": "Open authorization page",
	"pasteCallback": "Paste callback URL or code",
	"submitCallback": "Submit",
	"cancelLogin": "Cancel",
	"unknownPlan": "Unknown plan",
	"expires": "Expires",
	"defaultAccount": "Default account",
	"makeDefault": "Make default",
	"logout": "Log out",
	"refreshUsage": "Refresh",
	"usageNotLoaded": "Loading usage…",
	"usageUnavailable": "No usage windows reported.",
	"window_session": "5-hour window",
	"window_weekly": "Weekly",
	"window_other": "Window",
	"resets": "resets",
	"resetCredits": "Usage limit resets",
	"creditExpiryUnknown": "Expiry unknown",
	"creditExpired": "Expired",
	"creditsUnavailable": "Reset credits could not be verified.",
	"useReset": "Use…",
	"confirmLogout": "Log this account out? Its stored credentials will be removed.",
	"confirmReset": "Confirm full reset",
	"resetAcknowledge": "I understand that one credit will be consumed.",
	"cancel": "Cancel",
	"confirm": "Consume 1 reset",
	"login": "Log in",
	"checking": "Checking…",
	"usageTitle": "Usage",
	"plan": "Plan",
	"available": "available",
	"fullReset": "Full reset",
	"providerUnavailable": "Codex unavailable: provider id already registered.",
	"clientVersionHint": "Requests present this CLI version, and newer models may require a recent one.",
	"manualSummary": "Browser flow not working? Paste the callback URL or code",
	"addAccountHint": "Browser authorization signs in whichever account the browser currently uses — switch accounts there first (or use an incognito window with the manual code below) to add a different one.",
	"resetGuard": "You can use this reset when weekly usage reaches at least 80%.",
	"resetRefresh": "Refresh usage to verify current limits and reset availability.",
	"resetReady": "Use this reset — the earliest-expiring credit. Confirmation required.",
	"resetWarning": "This consumes one credit and resets weekly + 5-hour limits. This interface cannot undo it. Confirmation expires in 60 seconds.",
	"intro": "Log a subscription provider in or out. Login opens the provider’s authorization page in a new tab; headless setups can paste the callback URL or code instead.",
	"proxyTestOk": "OK · HTTP {status} · {ms} ms",
	"proxyUsernamePlaceholder": "Proxy username",
	"accountsModels": "Pool model allowlist",
	"modelsContextInvalid": "Enter a positive whole number of tokens for {model}.",
	"proxyLoadFailed": "Failed to load proxy settings: {message}",
	"modelsSave": "Save changes",
	"modelsContextHint": "Leave blank to follow the provider. The requested window is capped by the account’s advertised maximum; account pools use the smallest member window. This controls local history and compaction, not the API’s capacity.",
	"usageRefresh": "Refresh",
	"accountsAlias": "Alias (optional)",
	"accountsSaveFailed": "Could not save changes: {message}",
	"proxyUrlPlaceholder": "http://localhost:7890",
	"proxyPasswordPlaceholder": "Leave blank to keep the saved password",
	"accountsModelsCount": "{count} selected",
	"modelDefaultsTitle": "Default reasoning effort",
	"proxyDialogTitle": "Proxy settings",
	"accountsIndependent": "Show an independent entry in the model picker",
	"modelDefaultsFilterEmpty": "No model matches “{query}”.",
	"modelsSubagentSpeed": "Subagent default speed",
	"accountsPoolEnabled": "Include in the LLM account pool",
	"modelsPartialSave": "Some reasoning defaults were saved. Remaining changes are still in the draft; retry to finish.",
	"accountsModelsAutomatic": "Allow all models, including future models",
	"proxySaveFailed": "Save failed: {message}",
	"proxyStatusError": "Config error: {message}",
	"proxyLoading": "Loading proxy settings…",
	"modelsEdit": "Edit model list",
	"proxyPassword": "Password",
	"proxyBypassPlaceholder": "127.0.0.1, localhost, *.example.com",
	"subscriptionDisplayName": "Subscription display name",
	"modelDisplayName": "Model display name",
	"accountsLoading": "Loading accounts…",
	"accountsLoadFailed": "Could not load account settings: {message}",
	"proxyUrlHint": "HTTP or HTTPS proxy only (Clash/mihomo, v2rayN…); socks is not supported.",
	"accountsIndependentHint": "Independent LLM routes use only this account, with no fallback to another account. This does not isolate tools or the whole session.",
	"modelsToolsHint": "Changes apply only to sessions created after saving. Existing sessions keep their tools. Shared tools remain available if any supporting provider is enabled.",
	"proxySaving": "Saving…",
	"subscriptionDisplayNameHint": "Used in the quota bar and subscription headings. Leave blank for the default.",
	"modelsUnavailable": "Currently unavailable",
	"speedFast": "Fast",
	"proxyClearPassword": "Clear the saved password",
	"proxyDialogClose": "Close",
	"proxySave": "Save",
	"modelsSelectAll": "Select all",
	"proxyUrl": "Proxy URL",
	"accountsCatalogUnavailable": "Model discovery is currently unavailable. Saved model selections are preserved.",
	"modelsAutomatic": "Automatically show all models, including new models",
	"speedStandard": "Standard",
	"modelsHint": "Configure model visibility, default reasoning effort, subagent speed, context and tools here; Save changes below submits them together with the account settings. Hidden models remain usable by existing sessions; tool changes apply to new sessions.",
	"modelDefaultsSaving": "Saving…",
	"accountsHint": "Choose which accounts serve pooled LLM requests. Pool exclusion applies only to LLM routing, not tools or session-wide isolation.",
	"accountsNoModels": "No models reported for this account.",
	"proxyUsername": "Username (optional)",
	"modelDefaultsFilterPlaceholder": "Filter models",
	"modelDefaultsLoading": "Loading models…",
	"proxyConfigure": "Configure…",
	"proxyTestFail": "Failed: {message}",
	"proxyTestOkDirect": "OK (DSH network settings) · HTTP {status} · {ms} ms",
	"modelsContextBounds": "Default {default} · Maximum {max}",
	"proxyStatusEnabled": "Enabled · {url}",
	"accountsModelsAll": "All models",
	"imageClose": "Close",
	"proxyStatusNone": "Plugin proxy disabled — using DSH network settings.",
	"modelDisplayNameHint": "Leave blank for the original name. Reasoning effort stays separate.",
	"proxyEnabled": "Route subscription requests through a proxy",
	"accountsTitle": "Manage {provider}",
	"proxyNote": "On DSH v0.1.3-alpha.1, prefer the host HTTP_PROXY / HTTPS_PROXY / ALL_PROXY / NO_PROXY settings and leave this plugin proxy disabled. This optional override is retained for older hosts and subscription-only routing. Disabled or bypassed requests use DSH network settings; they are not necessarily direct. Applies to token exchange, model APIs, usage and tools. Browser OAuth follows the browser/system proxy.",
	"proxyBypassHint": "Comma-separated hostnames that skip this plugin proxy and use DSH network settings.",
	"proxyCancel": "Cancel",
	"modelsContext": "Context (tokens)",
	"displayNameReset": "Restore default",
	"modelsTools": "Provider tools",
	"proxySaved": "Saved — new requests use the updated network settings.",
	"modelDefaultsRetry": "Retry",
	"proxyBypass": "Bypass hosts",
	"modelsSelectNone": "Clear selection",
	"modelDefaultsFollowProvider": "Follow provider",
	"proxyTesting": "Testing…",
	"accountsManage": "Manage",
	"accountsModelsHint": "Applies only to pooled LLM routing, not independent entries. An empty selection allows no models. Turning off pool participation keeps this selection for later.",
	"proxyTitle": "Proxy",
	"modelsSubagentSpeedHint": "Applies to subsequent subagent requests using this model, regardless of the parent model. Main conversations keep their own Speed setting. Fast requires model support.",
	"proxyTest": "Test",
	"proxyUsernameHint": "Username is optional",
	"proxyPasswordHint": "Leave blank to keep the saved password",
	"modelsWebSearch": "Web search",
	"modelsImage": "Image generation",
	"modelsVideo": "Video generation",
	"modelsSearch": "X search",
	"modelDefaultsLoadFailed": "Failed to load models: {message}",
	"modelDefaultsRefresh": "Refresh model lists",
	"modelDefaultsNoModels": "This provider reports no models.",
	"modelDefaultsNoAccount": "No connected accounts. Connect one on the provider card first.",
	"modelDefaultsDiscoveryFailed": "Model discovery failed or timed out. Use Refresh to try again.",
	"modelDefaultsSaveFailedNamed": "Save failed for {model}: {message}",
	"speed": "Speed",
	"speedStandardDescription": "Default speed",
	"speedFastDescription": "1.5x speed, more usage",
	"commandFast": "Switch the Codex speed tier (Standard/Fast)",
	"commandFastUnavailable": "The current model has no fast tier; /fast only works on Codex models whose catalog advertises one",
	"usageSessionShort": "5h",
	"usageWeeklyShort": "Wk",
	"usageBadgeReset": "Resets in {time}",
	"usageBadgeOpenDetails": "Open all accounts and quotas",
	"usageBadgeClose": "Close usage details",
	"usageBadgeTitle": "Subscription usage",
	"usageBadgeCurrent": "current",
	"usageBadgeMoreWindows": "More quota windows ({count})",
	"usageBadgeModelCount": "{count} model quotas",
	"usageBadgeModelUnavailable": "Current model quota unavailable",
	"usageBadgeDisplay": "Status-bar quota display",
	"usageBadgeDisplayRecent": "Current / most recent subscription only",
	"usageBadgeDisplayHidden": "Hidden",
	"usageBadgeDisplayHint": "Saved automatically in this browser. At most one subscription is shown; non-subscription models keep the most recent subscription selected in this view, or show nothing. Hiding does not affect usage details here.",
	"usageBadgeDisplaySaveFailed": "Could not save the display preference. Check browser storage permissions.",
	"usagePlan": "Plan: {plan}",
	"usageSession": "5-hour window",
	"usageWeekly": "Weekly",
	"usageWindow": "Window",
	"claudeProviderUnavailable": "Claude unavailable: provider id already registered.",
	"addAccountOAuth": "Browser authorization",
	"addAccountKeychain": "Import Claude Code",
	"claudeAddAccountHint": "Browser authorization signs in whichever account the browser currently uses. Import Claude Code copies the account Claude Code is signed in to and keeps it in sync; sign in with the claude command first.",
	"claudePromptCacheTtl": "Prompt cache lifetime",
	"claudePromptCacheTtlHint": "How long Anthropic keeps the conversation cache after its last use. Cache reads cost the same either way; a one-hour cache write costs 2× base input instead of 1.25×. Applies from the next turn.",
	"claudePromptCacheTtlDefault": "Follow config ({ttl})",
	"claudePromptCacheTtl5m": "5 minutes",
	"claudePromptCacheTtl1h": "1 hour",
	"usageEmpty": "No usage quotas reported.",
	"usageNoVisibleModels": "No quotas for the shown models.",
	"antigravityProviderUnavailable": "Antigravity registration is unavailable.",
	"grokProviderUnavailable": "Grok registration is unavailable.",
	"image": "Image",
	"viewImage": "View image",
	"viewImageNamed": "View {name}",
	"imageLoading": "Loading image…",
	"imageLoadFailed": "Could not load image. Retry",
	"imagePreview": "Image preview",
	"generating": "Generating image…",
	"generatingVideo": "Generating video…",
	"videoLoading": "Loading video…",
	"videoLoadFailed": "Could not load video: {message}",
	"videoPlaybackFailed": "The browser could not play this video."
};

//#endregion
//#region src/locales.ts
const en = subscriptions$1;

//#endregion
//#region src/ImageGenerateToolview.tsx
const FONT_S_12 = "var(--dsw-font-s-12, 400 12px/18px var(--dsw-font-family))";
const FONT_S_13 = "var(--dsw-font-s-13, 400 13px/20px var(--dsw-font-family))";
/** DSH 0.1.7 renamed IconSparkle16; resolving it by name keeps older hosts working too. */
const SparkleIcon$1 = (_props) => null;
/** Title prompt truncation budget (characters). */
const PROMPT_MAX_LENGTH$1 = 60;
/**
* Build the ImageGallery loader over the `image` endpoint.
* @param rpc - Connection RPC caller.
* @returns loader resolving an attachment ref to a data URL.
*/
function createImageLoader(rpc) {
	return (attachment) => callSubscriptionsAuth$1(rpc, "image", { ...attachment }).then((result) => `data:${result.mediaType};base64,${result.dataBase64}`);
}
/**
* English-dictionary fallback for a missing locale seat (standalone renders);
* the framework always supplies the namespace-bound one.
* @param key - dictionary key.
* @param params - `{name}` template params.
* @returns the template with params substituted.
*/
function fallbackTranslate$3(key, params) {
	let text = en[key];
	for (const [name, value] of Object.entries(params ?? {})) text = text.replaceAll(`{${name}}`, String(value));
	return text;
}
/** Extract the prompt from the call's raw args JSON; falls back to the first string value, then the raw line. */
function derivePrompt$1(argsRaw) {
	let parsed;
	try {
		parsed = JSON.parse(argsRaw);
	} catch {
		parsed = void 0;
	}
	let prompt;
	if (typeof parsed === "object" && parsed !== null) {
		const args = parsed;
		if (typeof args.prompt === "string" && args.prompt !== "") prompt = args.prompt;
		else for (const value of Object.values(args)) if (typeof value === "string" && value !== "") {
			prompt = value;
			break;
		}
	}
	const line = (prompt ?? argsRaw).split("\n", 1)[0] ?? "";
	return line.length > PROMPT_MAX_LENGTH$1 ? `${line.slice(0, PROMPT_MAX_LENGTH$1)}…` : line;
}
/** Flatten a settled result's text blocks (the degraded text-only route and the error line). */
function resultText$1(block) {
	if (!("kind" in block)) return "";
	const parts = [];
	for (const part of block.content) if (part.type === "text") parts.push(part.text);
	if (parts.length === 0 && block.error !== void 0) parts.push(`${block.error.name}: ${block.error.code}`);
	return parts.join("\n");
}
/** Image attachments of a settled result; empty while running or on the text-only route. */
function resultImages(block) {
	if (!("kind" in block)) return [];
	const images = [];
	for (const part of block.content) if (part.type === "image") images.push({ attachment: part.attachment });
	return images;
}
const styles$5 = {
	container: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		padding: "4px 0"
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		minWidth: 0
	},
	icon: {
		display: "inline-flex",
		flexShrink: 0,
		color: "var(--dsw-alias-label-tertiary)"
	},
	title: {
		font: FONT_S_13,
		color: "var(--dsw-alias-label-primary)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	subtle: {
		margin: 0,
		font: FONT_S_12,
		color: "var(--dsw-alias-label-tertiary)"
	},
	output: {
		margin: 0,
		font: FONT_S_12,
		color: "var(--dsw-alias-label-secondary)",
		whiteSpace: "pre-wrap",
		overflowWrap: "anywhere"
	},
	error: {
		margin: 0,
		font: FONT_S_12,
		color: "var(--dsw-alias-state-error-primary)"
	}
};
/**
* The `image_generate` keyed toolview component.
* @param props - owner share, inject face, and locale seat (spread flat).
* @returns the call row plus, once settled, the gallery / text / error body.
*/
function ImageGenerateToolview(props) {
	const { block, load } = props;
	const t = props.t ?? fallbackTranslate$3;
	if (block === void 0) return null;
	const settled = "kind" in block;
	const argsRaw = (settled ? block.call?.argsRaw : "argsRaw" in block ? block.argsRaw : void 0) ?? "";
	let references = 0;
	try {
		const args = JSON.parse(argsRaw);
		if (Array.isArray(args?.referenceImages)) references = args.referenceImages.length;
	} catch {}
	const title = `image_generate${references > 0 ? ` (${references} ref)` : ""}: ${derivePrompt$1(argsRaw)}`;
	const images = resultImages(block);
	const text = settled ? resultText$1(block) : "";
	const labels = {
		image: t("image"),
		open: t("viewImage"),
		openNamed: (name) => t("viewImageNamed", { name }),
		loading: t("imageLoading"),
		loadFailed: t("imageLoadFailed"),
		lightbox: {
			dialog: t("imagePreview"),
			close: t("imageClose")
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles$5.container,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: styles$5.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$5.icon,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon$1, { size: 14 })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$5.title,
					children: title
				})]
			}),
			!settled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.subtle,
				children: t("generating")
			}),
			settled && block.isError && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.error,
				children: text.split("\n", 1)[0]
			}),
			settled && !block.isError && images.length > 0 && load !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImageGallery, {
				images,
				load,
				labels
			}),
			settled && !block.isError && images.length === 0 && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.output,
				children: text
			})
		]
	});
}

//#endregion
//#region src/video-route.ts
/** Exact GET route (below `/api`) serving a generated video as binary `video/mp4`; shared by host and browser halves. */
const VIDEO_FILE_ROUTE = "waycraft-subscriptions.videoFile";

//#endregion
//#region src/VideoGenerateToolview.tsx
/** DSH 0.1.7 renamed IconSparkle16; resolving it by name keeps older hosts working too. */
const SparkleIcon = (_props) => null;
/** Title prompt truncation budget (characters). */
const PROMPT_MAX_LENGTH = 60;
/**
* Build the video loader over the `/subscriptions-auth` `video` endpoint.
* @param rpc - Connection RPC caller.
* @returns loader resolving a bare file name to the decoded bytes.
*/
function createVideoLoader(rpc) {
	return async (name) => ({ url: `/api/${VIDEO_FILE_ROUTE}?name=${encodeURIComponent(name)}` });
}
/**
* English-dictionary fallback for a missing locale seat (standalone renders);
* the framework always supplies the namespace-bound one.
*/
function fallbackTranslate$2(key, params) {
	let text = en[key];
	for (const [name, value] of Object.entries(params ?? {})) text = text.replaceAll(`{${name}}`, String(value));
	return text;
}
/** Extract the prompt from the call's raw args JSON; falls back to the first string value, then the raw line. */
function derivePrompt(argsRaw) {
	let parsed;
	try {
		parsed = JSON.parse(argsRaw);
	} catch {
		parsed = void 0;
	}
	let prompt;
	if (typeof parsed === "object" && parsed !== null) {
		const args = parsed;
		if (typeof args.prompt === "string" && args.prompt !== "") prompt = args.prompt;
		else for (const value of Object.values(args)) if (typeof value === "string" && value !== "") {
			prompt = value;
			break;
		}
	}
	const line = (prompt ?? argsRaw).split("\n", 1)[0] ?? "";
	return line.length > PROMPT_MAX_LENGTH ? `${line.slice(0, PROMPT_MAX_LENGTH)}…` : line;
}
/** Flatten a settled result's text blocks (the fallback body and the error line). */
function resultText(block) {
	if (!("kind" in block)) return "";
	const parts = [];
	for (const part of block.content) if (part.type === "text") parts.push(part.text);
	if (parts.length === 0 && block.error !== void 0) parts.push(`${block.error.name}: ${block.error.code}`);
	return parts.join("\n");
}
/**
* The generated video's bare file name: presentation meta first (top-level
* dispatches), then the render text's "Saved video to …" line (nested
* dispatches compute no meta).
*/
function resolveFileName(block) {
	if (!("kind" in block)) return void 0;
	const meta = block.meta;
	if (typeof meta === "object" && meta !== null) {
		const fileName = meta.fileName;
		if (typeof fileName === "string" && fileName.length > 0) return fileName;
	}
	const match = /^Saved video to (.+\.mp4)/m.exec(resultText(block));
	if (match === null) return void 0;
	const path = match[1];
	return path.slice(path.lastIndexOf("/") + 1);
}
/** Decode a base64 payload into bytes (browser-side; no Buffer). */
function base64Bytes(dataBase64) {
	const binary = atob(dataBase64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
	return bytes;
}
const styles$4 = {
	container: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		padding: "4px 0"
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		minWidth: 0
	},
	icon: {
		display: "inline-flex",
		flexShrink: 0,
		color: "var(--dsw-alias-label-tertiary)"
	},
	title: {
		font: "var(--dsw-font-s-13)",
		color: "var(--dsw-alias-label-primary)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	subtle: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)"
	},
	output: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-secondary)",
		whiteSpace: "pre-wrap",
		overflowWrap: "anywhere"
	},
	error: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-state-error-primary)"
	},
	video: {
		display: "block",
		maxWidth: 480,
		width: "100%",
		borderRadius: 8,
		backgroundColor: "var(--dsw-alias-bg-layer-3)"
	}
};
/**
* The `video_generate` keyed toolview component.
* @param props - owner share, inject face, and locale seat (spread flat).
* @returns the call row plus, once settled, the player / text / error body.
*/
function VideoGenerateToolview(props) {
	const { block, loadVideo } = props;
	const t = props.t ?? fallbackTranslate$2;
	const settled = block !== void 0 && "kind" in block;
	const isError = settled && block.isError;
	const fileName = block !== void 0 && settled && !isError ? resolveFileName(block) : void 0;
	const [load, setLoad] = (0, react.useState)({ phase: "loading" });
	(0, react.useEffect)(() => {
		if (fileName === void 0 || loadVideo === void 0) return;
		let cancelled = false;
		let objectUrl;
		setLoad({ phase: "loading" });
		loadVideo(fileName).then((video) => {
			if (cancelled) return;
			if ("url" in video) {
				setLoad({
					phase: "ready",
					url: video.url
				});
				return;
			}
			objectUrl = URL.createObjectURL(new Blob([base64Bytes(video.dataBase64).slice()], { type: video.mediaType }));
			setLoad({
				phase: "ready",
				url: objectUrl
			});
		}, (error) => {
			if (cancelled) return;
			setLoad({
				phase: "failed",
				message: error instanceof Error ? error.message : String(error)
			});
		});
		return () => {
			cancelled = true;
			if (objectUrl !== void 0) URL.revokeObjectURL(objectUrl);
		};
	}, [fileName, loadVideo]);
	if (block === void 0) return null;
	const title = `video_generate: ${derivePrompt((settled ? block.call?.argsRaw : "argsRaw" in block ? block.argsRaw : void 0) ?? "")}`;
	const text = settled ? resultText(block) : "";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles$4.container,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: styles$4.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$4.icon,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon, { size: 14 })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$4.title,
					children: title
				})]
			}),
			!settled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.subtle,
				children: t("generatingVideo")
			}),
			settled && isError && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.error,
				children: text.split("\n", 1)[0]
			}),
			settled && !isError && fileName !== void 0 && load.phase === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.subtle,
				children: t("videoLoading")
			}),
			settled && !isError && fileName !== void 0 && load.phase === "failed" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.error,
				children: t("videoLoadFailed", { message: load.message })
			}),
			settled && !isError && fileName !== void 0 && load.phase === "ready" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
				style: styles$4.video,
				src: load.url,
				controls: true,
				preload: "metadata",
				onError: () => setLoad({
					phase: "failed",
					message: t("videoPlaybackFailed")
				})
			}),
			settled && !isError && fileName === void 0 && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.output,
				children: text
			})
		]
	});
}

//#endregion
//#region locale/ar.json
var subscriptions = {
	"pageSettings": "الإعدادات",
	"providerConfigured": "الحساب مُعدّ (لم يُتحقق من التوليد)",
	"providerAttention": "الموفّر يحتاج إلى المراجعة",
	"freeProviders": "الموفّرون المجانيون",
	"apiSubscription": "اشتراك",
	"zenEnabled": "تفعيل OpenCode Zen",
	"zenDisabled": "معطّل — لا تُقبل طلبات جديدة",
	"zenRefresh": "تحديث الحالة",
	"zenNoLogin": "نماذج مجانية · لا يلزم تسجيل الدخول",
	"zenUnavailable": "خدمة OpenCode Zen غير متاحة.",
	"zenReachable": "البوابة متاحة (قائمة النماذج فقط؛ لم يُتحقق من التوليد)",
	"zenUnreachable": "يتعذر الوصول للبوابة؛ قد لا تتاح النماذج الاحتياطية.",
	"zenModelCount": "النماذج المتاحة",
	"zenSource_gateway": "قائمة البوابة",
	"zenSource_static": "قائمة احتياطية ثابتة",
	"zenSource_cache": "قائمة احتياطية مخزنة",
	"apiUnavailable": "واجهات موفري API الأصلية غير متاحة. يجب التحقق من صلاحية المتصفح قبل الاستخدام.",
	"apiRefresh": "تحديث موفري API",
	"apiLoading": "جارٍ تحميل الموفرين الأصليين…",
	"apiFailed": "فشلت العملية الأصلية. حُفظت المسودة؛ حدّث أو أعد المحاولة. لا تُعرض تفاصيل الخطأ لأنها قد تحتوي على بيانات حساسة.",
	"apiConflict": "تغيّرت الإعدادات أثناء التحرير. لم تُستبدل مسودتك ولم تُطبّق. ألغِ التحرير وحدّث ثم افتح المحرر لمراجعة تغييراتك.",
	"apiPartial": "حُفظت إعدادات الموفر لكن عملية المفتاح فشلت. حُفظ طلب المفتاح؛ إعادة المحاولة تنفّذ عملية المفتاح المتبقية فقط.",
	"apiInvalid": "تحقق من المعرّف ورابط HTTP(S) وبيانات النماذج. الموفر المخصص يحتاج إلى رابط ونموذج واحد على الأقل.",
	"apiSaved": "حُفظ في إعدادات DSH الأصلية.",
	"apiKeySet": "المفتاح مُعدّ",
	"apiKeyMissing": "لا يوجد مفتاح مُعدّ",
	"apiKeyUnknown": "حالة المفتاح غير متاحة",
	"apiAccountUnknown": "حالة الحساب غير متاحة",
	"apiAdd": "إضافة موفر",
	"apiEdit": "تحرير الموفر",
	"apiDelete": "حذف الموفر المضاف",
	"apiCustom": "API مخصص",
	"apiCatalog": "دليل الموفرين",
	"apiChoose": "اختر موفرًا",
	"apiModelID": "معرّف النموذج",
	"apiModelName": "اسم النموذج",
	"apiModelAdd": "إضافة نموذج",
	"apiModelRemove": "إزالة النموذج",
	"apiEditor": "محرر موفر API",
	"apiRoute": "معرّف الموفر (كلمات لاتينية صغيرة تفصلها شرطات)",
	"apiName": "اسم العرض",
	"apiURL": "الرابط الأساسي",
	"apiProtocol": "البروتوكول",
	"apiKeyAction": "إجراء المفتاح",
	"apiKey_keep": "الاحتفاظ بالمفتاح الحالي",
	"apiKey_set": "تعيين المفتاح أو استبداله",
	"apiKey_unset": "إزالة المفتاح المخزّن",
	"apiKey": "مفتاح جديد (للكتابة فقط)",
	"apiKeyLimit": "لا تُقرأ المفاتيح المخزّنة مطلقًا. كتابة الإعدادات والمفتاح عمليتان أصليتان منفصلتان وليستا معاملة ذرية. إزالة المفتاح قد تكشف مفتاح البيئة البديل. حذف الموفر لا يحذف بيانات الاعتماد المشتركة.",
	"apiFetch": "جلب النماذج المتاحة",
	"apiModels": "النماذج",
	"apiModelsHint": "حرر معرّفات النماذج وأسماءها. تُحفظ القدرات والبيانات الحالية. الجلب يستبدل المسودة فقط؛ التطبيق يحفظها.",
	"apiSave": "تطبيق",
	"apiCancel": "إلغاء تحرير الموفر",
	"antigravitySetupRequired": "إعداد عميل OAuth في Antigravity غير صالح. صحّح بيانات العميل المُعدّة؛ تُحفظ الحسابات الحالية.",
	"copilotDeviceHint": "أدخل هذا الرمز في صفحة التحقق من GitHub.",
	"copyDeviceCode": "نسخ الرمز",
	"copilotProviderUnavailable": "Copilot غير متاح. أوقف المكوّن المرجعي أولًا.",
	"title": "موفّرو الذكاء الاصطناعي",
	"accounts": "حسابات الاشتراك",
	"providers": "موفّرو النماذج",
	"subscriptionProviders": "موفّرو الاشتراكات",
	"apiProviders": "موفّرو API",
	"subscriptionAdd": "إضافة موفّر اشتراك",
	"accountCount": "حساب",
	"subscriptionDetails": "تفاصيل الموفّر",
	"providersHint": "أدِر حسابات الاشتراك والاستخدام. استخدم إضافة حساب أدناه لتسجيل الدخول.",
	"accountsEmpty": "لا توجد حسابات اشتراك بعد.",
	"providersEmpty": "لا يوجد موفرو API بعد.",
	"unreachable": "يتعذر الوصول إلى مكوّن الاشتراكات على المضيف. أعد الاتصال أو تحقق من المكوّن في صفحة الإضافات.",
	"coexistence": "الإضافة المرجعية dsh-plugin-subscriptions تعمل أيضًا. يمكن لإضافة واحدة فقط تقديم معرّفات الموفّرين المشتركة (codex, claude, grok, copilot, antigravity) في الوقت نفسه؛ أوقف الإضافة المرجعية قبل استخدام الموفّرين من هذا المكوّن.",
	"loginProgress": "جارٍ تسجيل الدخول…",
	"connected": "حساب متصل",
	"notLoggedIn": "لم يتم تسجيل الدخول",
	"clientVersion": "إصدار العميل",
	"source_npm": "سجل npm",
	"source_local": "واجهة الأوامر المحلية",
	"source_fallback": "الإصدار الاحتياطي المرفق",
	"source_config": "الإعدادات",
	"addAccount": "إضافة حساب",
	"openAuthorization": "فتح صفحة التفويض",
	"pasteCallback": "ألصق رابط العودة أو الرمز",
	"submitCallback": "إرسال",
	"cancelLogin": "إلغاء",
	"unknownPlan": "خطة غير معروفة",
	"expires": "تنتهي الصلاحية",
	"defaultAccount": "الحساب الافتراضي",
	"makeDefault": "تعيين كافتراضي",
	"logout": "تسجيل الخروج",
	"refreshUsage": "تحديث",
	"usageNotLoaded": "جارٍ تحميل الاستخدام…",
	"usageUnavailable": "لم تُبلّغ أي فترات استخدام.",
	"window_session": "فترة خمس ساعات",
	"window_weekly": "أسبوعي",
	"window_other": "فترة الاستخدام",
	"resets": "إعادة التعيين",
	"resetCredits": "إعادات تعيين حدود الاستخدام",
	"creditExpiryUnknown": "انتهاء الصلاحية غير معروف",
	"creditExpired": "منتهي الصلاحية",
	"creditsUnavailable": "تعذر التحقق من أرصدة إعادة التعيين.",
	"useReset": "استخدام…",
	"confirmLogout": "هل تريد تسجيل خروج هذا الحساب؟ ستُحذف بيانات اعتماده المخزنة.",
	"confirmReset": "تأكيد إعادة التعيين الكاملة",
	"resetAcknowledge": "أفهم أن هذا سيستهلك رصيد إعادة تعيين واحدًا.",
	"cancel": "إلغاء",
	"confirm": "استهلاك رصيد واحد",
	"login": "تسجيل الدخول",
	"checking": "جارٍ التحقق…",
	"usageTitle": "الاستخدام",
	"plan": "الخطة",
	"available": "متاح",
	"fullReset": "إعادة تعيين كاملة",
	"providerUnavailable": "Codex غير متاح: معرّف الموفّر مسجّل بالفعل.",
	"clientVersionHint": "تستخدم الطلبات إصدار واجهة الأوامر هذا؛ قد تتطلب النماذج الأحدث إصدارًا حديثًا.",
	"manualSummary": "هل تعذّر مسار المتصفح؟ ألصق رابط العودة أو الرمز",
	"addAccountHint": "يسجّل تفويض المتصفح الدخول بالحساب المستخدم حاليًا في المتصفح — بدّل الحساب هناك أولًا (أو استخدم نافذة خاصة مع الرمز اليدوي أدناه) لإضافة حساب آخر.",
	"resetGuard": "يمكنك استخدام إعادة التعيين عندما يبلغ الاستخدام الأسبوعي 80٪ على الأقل.",
	"resetRefresh": "حدّث الاستخدام للتحقق من الحدود الحالية وتوفّر إعادة التعيين.",
	"resetReady": "استخدم الرصيد الأقرب لانتهاء الصلاحية. يلزم التأكيد.",
	"resetWarning": "يستهلك هذا رصيدًا واحدًا ويعيد تعيين الحد الأسبوعي وحد الخمس ساعات. لا يمكن التراجع من هذه الواجهة. ينتهي التأكيد بعد 60 ثانية.",
	"intro": "سجّل الدخول إلى موفّر اشتراك أو اخرج منه. يفتح تسجيل الدخول صفحة تفويض الموفّر في تبويب جديد؛ ويمكن لصق رابط العودة أو الرمز في الأنظمة بلا متصفح.",
	"proxyTestOk": "نجح · HTTP {status} · {ms} مللي ثانية",
	"proxyUsernamePlaceholder": "اسم مستخدم الوكيل",
	"accountsModels": "قائمة النماذج المسموح بها للمجموعة",
	"modelsContextInvalid": "أدخل عدداً صحيحاً موجباً لرموز {model}.",
	"proxyLoadFailed": "تعذر تحميل إعدادات الوكيل: {message}",
	"modelsSave": "حفظ التغييرات",
	"modelsContextHint": "اتركه فارغاً لاتباع المزوّد. يُقيّد بالحجم الأقصى المعلن للحساب؛ تستخدم المجموعة أصغر نافذة. يضبط السجل والضغط المحليين وليس سعة الواجهة.",
	"usageRefresh": "تحديث",
	"accountsAlias": "اسم مستعار (اختياري)",
	"accountsSaveFailed": "تعذر حفظ التغييرات: {message}",
	"proxyUrlPlaceholder": "مثال: http://localhost:7890",
	"proxyPasswordPlaceholder": "اتركها فارغة للاحتفاظ بكلمة المرور المحفوظة",
	"accountsModelsCount": "{count} محدد",
	"modelDefaultsTitle": "مستوى الاستدلال الافتراضي",
	"proxyDialogTitle": "إعدادات الوكيل الشبكي",
	"accountsIndependent": "عرض إدخال مستقل في منتقي النماذج",
	"modelDefaultsFilterEmpty": "لا نموذج يطابق «{query}».",
	"modelsSubagentSpeed": "السرعة الافتراضية للوكيل الفرعي",
	"accountsPoolEnabled": "تضمين في مجموعة حسابات النماذج",
	"modelsPartialSave": "حُفظت بعض افتراضيات الاستدلال. التغييرات المتبقية ما زالت في المسودة؛ أعد المحاولة.",
	"accountsModelsAutomatic": "السماح بكل النماذج بما فيها المستقبلية",
	"proxySaveFailed": "تعذر الحفظ: {message}",
	"proxyStatusError": "خطأ إعداد: {message}",
	"proxyLoading": "جارٍ تحميل إعدادات الوكيل…",
	"modelsEdit": "تحرير قائمة النماذج",
	"proxyPassword": "كلمة المرور",
	"proxyBypassPlaceholder": "مثال: 127.0.0.1, localhost, *.example.com",
	"subscriptionDisplayName": "اسم عرض الاشتراك",
	"modelDisplayName": "اسم عرض النموذج",
	"accountsLoading": "جارٍ تحميل الحسابات…",
	"accountsLoadFailed": "تعذر تحميل إعدادات الحسابات: {message}",
	"proxyUrlHint": "وكيل HTTP أو HTTPS فقط؛ SOCKS غير مدعوم.",
	"accountsIndependentHint": "يستخدم المسار المستقل هذا الحساب فقط دون الرجوع إلى حساب آخر. لا يعزل الأدوات أو الجلسة.",
	"modelsToolsHint": "تنطبق التغييرات على الجلسات المنشأة بعد الحفظ فقط. تحتفظ الجلسات الحالية بأدواتها. تبقى الأدوات المشتركة متاحة إذا كان أي مزوّد داعم مفعّلاً.",
	"proxySaving": "جارٍ الحفظ…",
	"subscriptionDisplayNameHint": "يُستخدم في عناوين الاشتراك وشريط الحصة. اتركه فارغاً للاسم الافتراضي.",
	"modelsUnavailable": "غير متاح حالياً",
	"speedFast": "سريعة",
	"proxyClearPassword": "مسح كلمة المرور المحفوظة",
	"proxyDialogClose": "إغلاق",
	"proxySave": "حفظ",
	"modelsSelectAll": "تحديد الكل",
	"proxyUrl": "عنوان الوكيل",
	"accountsCatalogUnavailable": "اكتشاف النماذج غير متاح حالياً. تُحفظ التحديدات السابقة.",
	"modelsAutomatic": "إظهار كل النماذج تلقائياً بما فيها الجديدة",
	"speedStandard": "عادية",
	"modelsHint": "اضبط ظهور النماذج والاستدلال الافتراضي وسرعة الوكيل الفرعي والسياق والأدوات. يحفظ الزر أدناه هذه التغييرات مع إعدادات الحسابات. تبقى النماذج المخفية قابلة للاستخدام في الجلسات الحالية؛ تغييرات الأدوات للجلسات الجديدة.",
	"modelDefaultsSaving": "جارٍ الحفظ…",
	"accountsHint": "اختر الحسابات التي تخدم طلبات مجموعة النماذج. الاستبعاد لا يعزل الأدوات أو الجلسة بأكملها.",
	"accountsNoModels": "لم يُبلّغ عن نماذج لهذا الحساب.",
	"proxyUsername": "اسم المستخدم (اختياري)",
	"modelDefaultsFilterPlaceholder": "تصفية النماذج",
	"modelDefaultsLoading": "جارٍ تحميل النماذج…",
	"proxyConfigure": "تهيئة…",
	"proxyTestFail": "فشل: {message}",
	"proxyTestOkDirect": "نجح (إعدادات شبكة DSH) · HTTP {status} · {ms} مللي ثانية",
	"modelsContextBounds": "الافتراضي {default} · الحد الأقصى {max}",
	"proxyStatusEnabled": "مفعّل · {url}",
	"accountsModelsAll": "كل النماذج",
	"imageClose": "إغلاق",
	"proxyStatusNone": "وكيل الإضافة معطّل — تُستخدم إعدادات شبكة DSH.",
	"modelDisplayNameHint": "اتركه فارغاً للاسم الأصلي. يبقى مستوى الاستدلال مستقلاً.",
	"proxyEnabled": "توجيه طلبات الاشتراك عبر وكيل شبكي",
	"accountsTitle": "إدارة {provider}",
	"proxyNote": "يُفضّل استخدام إعدادات شبكة DSH وترك هذا التجاوز الاختياري معطّلاً. تستخدم الطلبات المستثناة أو المعطّلة إعدادات DSH ولا تكون مباشرة بالضرورة. ينطبق على تبادل الرموز وواجهات النماذج والاستخدام والأدوات. يتبع تسجيل الدخول إعدادات المتصفح والنظام.",
	"proxyBypassHint": "أسماء مضيفين مفصولة بفواصل تتجاوز وكيل الإضافة وتستخدم إعدادات شبكة DSH.",
	"proxyCancel": "إلغاء",
	"modelsContext": "السياق (رموز)",
	"displayNameReset": "استعادة الافتراضي",
	"modelsTools": "أدوات المزوّد",
	"proxySaved": "تم الحفظ — تستخدم الطلبات الجديدة الإعدادات المحدّثة.",
	"modelDefaultsRetry": "إعادة المحاولة",
	"proxyBypass": "مضيفون مستثنون",
	"modelsSelectNone": "مسح التحديد",
	"modelDefaultsFollowProvider": "اتباع المزوّد",
	"proxyTesting": "جارٍ الاختبار…",
	"accountsManage": "إدارة",
	"accountsModelsHint": "ينطبق على توجيه المجموعة فقط، لا الإدخالات المستقلة. التحديد الفارغ لا يسمح بأي نموذج. يُحفظ التحديد عند تعطيل المشاركة.",
	"proxyTitle": "الوكيل الشبكي",
	"modelsSubagentSpeedHint": "ينطبق على طلبات الوكيل الفرعي اللاحقة بهذا النموذج. تحتفظ المحادثات الرئيسية بسرعتها. تتطلب السرعة العالية دعم النموذج.",
	"proxyTest": "اختبار",
	"proxyUsernameHint": "اسم المستخدم اختياري",
	"proxyPasswordHint": "اتركها فارغة للاحتفاظ بكلمة المرور المحفوظة",
	"modelsWebSearch": "بحث الويب",
	"modelsImage": "توليد الصور",
	"modelsVideo": "توليد الفيديو",
	"modelsSearch": "بحث X",
	"modelDefaultsLoadFailed": "تعذر تحميل النماذج: {message}",
	"modelDefaultsRefresh": "تحديث قوائم النماذج",
	"modelDefaultsNoModels": "لم يُبلّغ المزوّد عن نماذج.",
	"modelDefaultsNoAccount": "لا حسابات متصلة. أضف حساباً أولاً.",
	"modelDefaultsDiscoveryFailed": "تعذر اكتشاف النماذج أو انتهت المهلة. حدّث لإعادة المحاولة.",
	"modelDefaultsSaveFailedNamed": "تعذر حفظ {model}: {message}",
	"speed": "السرعة",
	"speedStandardDescription": "السرعة الافتراضية",
	"speedFastDescription": "سرعة 1.5 ضعف، واستهلاك أكبر",
	"commandFast": "تبديل مستوى سرعة Codex (عادية/سريعة)",
	"commandFastUnavailable": "لا يدعم النموذج الحالي المستوى السريع؛ يعمل الأمر /fast فقط مع نماذج Codex التي يعلن كتالوجها عن مستوى سريع",
	"usageSessionShort": "5س",
	"usageWeeklyShort": "أسبوع",
	"usageBadgeReset": "إعادة التعيين خلال {time}",
	"usageBadgeOpenDetails": "عرض جميع الحسابات والحصص",
	"usageBadgeClose": "إغلاق تفاصيل الاستهلاك",
	"usageBadgeTitle": "استهلاك الاشتراك",
	"usageBadgeCurrent": "الحالي",
	"usageBadgeMoreWindows": "المزيد من نوافذ الحصة ({count})",
	"usageBadgeModelCount": "حصص {count} من النماذج",
	"usageBadgeModelUnavailable": "حصة النموذج الحالي غير متاحة",
	"usageBadgeDisplay": "عرض الحصة في شريط الحالة",
	"usageBadgeDisplayRecent": "الاشتراك الحالي / الأحدث فقط",
	"usageBadgeDisplayHidden": "مخفي",
	"usageBadgeDisplayHint": "يُحفظ تلقائيًا في هذا المتصفح. يُعرض اشتراك واحد على الأكثر؛ وتحتفظ النماذج غير المرتبطة باشتراك بآخر اشتراك تم اختياره في هذا العرض، أو لا تعرض شيئًا. لا يؤثر الإخفاء على تفاصيل الاستهلاك هنا.",
	"usageBadgeDisplaySaveFailed": "تعذر حفظ تفضيل العرض. تحقق من أذونات تخزين المتصفح.",
	"usagePlan": "الخطة: {plan}",
	"usageSession": "نافذة 5 ساعات",
	"usageWeekly": "أسبوعي",
	"usageWindow": "نافذة",
	"claudeProviderUnavailable": "Claude غير متاح: معرّف الموفّر مسجّل بالفعل.",
	"addAccountOAuth": "تفويض المتصفح",
	"addAccountKeychain": "استيراد من Claude Code",
	"claudeAddAccountHint": "يسجّل تفويض المتصفح الدخول بالحساب المستخدم حاليًا في المتصفح. ينسخ الاستيراد من Claude Code الحساب المسجَّل فيه ويبقيه متزامنًا؛ سجّل الدخول أولًا بالأمر claude.",
	"claudePromptCacheTtl": "مدة بقاء ذاكرة المطالبات المؤقتة",
	"claudePromptCacheTtlHint": "المدة التي تحتفظ بها Anthropic بذاكرة المحادثة المؤقتة بعد آخر استخدام. تكلفة قراءة الذاكرة واحدة في الحالتين؛ أما كتابة ذاكرة لمدة ساعة فتكلّف ضعف مدخلات الأساس بدل 1.25 ضعفًا. يسري من الدور التالي.",
	"claudePromptCacheTtlDefault": "اتباع الإعداد ({ttl})",
	"claudePromptCacheTtl5m": "5 دقائق",
	"claudePromptCacheTtl1h": "ساعة واحدة",
	"usageEmpty": "لم يتم الإبلاغ عن حصص استخدام.",
	"usageNoVisibleModels": "لا توجد حصص للنماذج المعروضة.",
	"antigravityProviderUnavailable": "تسجيل Antigravity غير متاح.",
	"grokProviderUnavailable": "تسجيل Grok غير متاح.",
	"image": "صورة",
	"viewImage": "عرض الصورة",
	"viewImageNamed": "عرض {name}",
	"imageLoading": "جارٍ تحميل الصورة…",
	"imageLoadFailed": "تعذر تحميل الصورة. أعد المحاولة",
	"imagePreview": "معاينة الصورة",
	"generating": "جارٍ إنشاء الصورة…",
	"generatingVideo": "جارٍ إنشاء الفيديو…",
	"videoLoading": "جارٍ تحميل الفيديو…",
	"videoLoadFailed": "تعذر تحميل الفيديو: {message}",
	"videoPlaybackFailed": "تعذر على المتصفح تشغيل هذا الفيديو."
};

//#endregion
//#region src/settings/subscriptions-rpc.ts
/**
* The node half mounts every endpoint as an exact POST route on the shared
* `/api` channel (`/api/waycraft-subscriptions.<endpoint>`), so the browser
* reaches it through the `/api` channel with a prefixed endpoint name.
* A dedicated channel is no longer used: since dsh 0.1.5 `rpc.handle`
* cannot register one from a plugin (see `src/auth/rpc.ts`).
*/
const SUBSCRIPTIONS_AUTH_CHANNEL = "/api";
const SUBSCRIPTIONS_AUTH_PREFIX = "waycraft-subscriptions.";
/** Business error returned by a `subscriptions-auth` endpoint (error branch message). */
var SubscriptionsAuthError = class extends Error {
	/** Stable error kind from the host; `internal` for older hosts that send none. */
	kind;
	constructor(message, kind = "internal") {
		super(message);
		this.kind = kind;
	}
};
/**
* Call one `subscriptions-auth` endpoint and unwrap the business result.
* Shared by the settings section, the composer Speed toggle, the usage
* badge, and the image/video toolviews.
* @param rpc - Connection RPC caller.
* @param endpoint - endpoint name (`status`, `usage`, `image`, ...).
* @param payload - endpoint-owned request payload.
* @returns the success value, cast by the caller to the endpoint's shape.
*/
async function callSubscriptionsAuth(rpc, endpoint, payload) {
	let result;
	try {
		result = await rpc.call(SUBSCRIPTIONS_AUTH_CHANNEL, `${SUBSCRIPTIONS_AUTH_PREFIX}${endpoint}`, payload);
	} catch (error) {
		throw new SubscriptionsAuthError(error instanceof Error ? error.message : String(error), "unavailable");
	}
	if (!result.ok) throw new SubscriptionsAuthError(result.error.message, result.error.kind);
	return result.value;
}

//#endregion
//#region src/settings/account-preferences.ts
/** Missing allowlist follows discovery; explicit [] must remain empty. */
function accountPoolSelection(account, models) {
	return new Set(account.poolModels ?? models.map((model) => model.id));
}
/** Retain unavailable saved IDs so a temporary catalog failure cannot erase them. */
function accountModelRows(account, preferences) {
	const known = new Set(account.models.map((model) => model.id));
	return [...account.models.map((model) => ({
		...model,
		unavailable: false
	})), ...(preferences.poolModels ?? []).filter((id) => !known.has(id)).map((id) => ({
		id,
		name: id,
		unavailable: true
	}))];
}

//#endregion
//#region src/settings/model-filter.ts
/**
* Which empty state the model list is in.
*
* `provider-empty` means the provider shows NO rows at all — the filter box cannot match
* anything in that state, and printing `No model matches “”.` next to it reads like a broken
* control rather than like an explanation.
*
* `filter-empty` keeps the existing message for a query that filtered everything out of a
* provider that does have rows.
*/
function modelListState(total, matched) {
	if (total === 0) return "provider-empty";
	return matched === 0 ? "filter-empty" : "rows";
}
/**
* Row ids the editor can still show when discovery returned nothing: saved visibility,
* display names and subagent speeds must count towards the total —
* otherwise a temporary catalog failure would hide the rows that edit them.
*/
function savedModelIds(visibleModels, displayNames, subagentSpeeds = void 0) {
	return [...new Set([
		...visibleModels ?? [],
		...Object.keys(displayNames ?? {}),
		...Object.keys(subagentSpeeds ?? {})
	])];
}
/**
* Why the provider has no models — read from the data the host already sends.
*
* `total === 0` alone cannot tell these apart, and guessing wrong re-creates the very
* defect this guard exists to prevent: telling a user who IS logged in to go and log in. The
* catalog payload carries one row per connected account with `unavailable: true` when that
* account's discovery failed or timed out (src/index.ts).
*
*  · no account at all                       → `noAccount`;
*  · accounts exist, every discovery failed  → `discoveryFailed` (retry, not log in);
*  · a connected account answered (possibly with an empty catalog) → `noModels`.
*/
function modelEditorNotice(accounts) {
	if (accounts.length === 0) return "noAccount";
	return accounts.every((account) => account.unavailable === true) ? "discoveryFailed" : "noModels";
}
/** Locale keys for the three honest empty states. */
const NOTICE_KEYS = {
	noAccount: "modelDefaultsNoAccount",
	discoveryFailed: "modelDefaultsDiscoveryFailed",
	noModels: "modelDefaultsNoModels"
};
/**
* The editor's whole empty-state decision, in one testable place: how many rows exist
* (discovered + the user's saved ids), whether a query filtered them all out, and which
* notice to show when there are none.
*/
function modelEditorState(input) {
	return {
		listState: modelListState(input.discovered + input.saved, input.matched),
		noticeKey: NOTICE_KEYS[modelEditorNotice(input.accounts)]
	};
}

//#endregion
//#region src/settings/ProviderModelEditor.tsx
const border$1 = "0.5px solid var(--dsw-alias-border-l2, #ddd)";
const actions$1 = {
	display: "flex",
	flexWrap: "wrap",
	gap: 8,
	alignItems: "center"
};
/**
* Embedded section of the account manager dialog. It owns the model draft
* (visibility, effort, context, tools) but not its submission: the dialog
* collects the draft through the handle and saves it with the account edits
* in one go, so there is a single Save/Cancel pair.
*/
const ProviderModelEditor = (0, react.forwardRef)(function ProviderModelEditor$1({ provider, rpc, t, disabled = false, onDirtyChange }, ref) {
	const [catalog, setCatalog] = (0, react.useState)();
	const [draft, setDraft] = (0, react.useState)({});
	const [contexts, setContexts] = (0, react.useState)({});
	const [efforts, setEfforts] = (0, react.useState)({});
	const [query, setQuery] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)(false);
	const [dirty, setDirty] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)("");
	const generation = (0, react.useRef)(0);
	(0, react.useEffect)(() => () => {
		generation.current++;
	}, []);
	(0, react.useEffect)(() => {
		onDirtyChange?.(dirty);
	}, [dirty]);
	function reset(data) {
		setCatalog(data);
		setDraft(data.settings);
		setEfforts(Object.fromEntries(data.models.map((model) => [model.id, model.configured ?? ""])));
		setContexts(Object.fromEntries(Object.entries(data.settings.contextWindows ?? {}).map(([id, value]) => [id, String(value)])));
		setDirty(false);
	}
	async function load(force = false) {
		const request = ++generation.current;
		setBusy(true);
		setError("");
		try {
			const data = await callSubscriptionsAuth(rpc, "providerSettings", {
				provider,
				force
			});
			if (generation.current === request) reset(data);
		} catch (error$1) {
			if (generation.current === request) setError(String(error$1 instanceof Error ? error$1.message : error$1));
		} finally {
			if (generation.current === request) setBusy(false);
		}
	}
	function edit(next) {
		setDraft(next);
		setDirty(true);
	}
	(0, react.useEffect)(() => {
		load();
	}, [provider, rpc]);
	(0, react.useImperativeHandle)(ref, () => ({ collect() {
		if (!catalog || !dirty) return { efforts: [] };
		const windows = Object.create(null);
		for (const [model, text] of Object.entries(contexts)) {
			if (!text.trim()) continue;
			const value = Number(text);
			const limits = catalog.models.find((entry) => entry.id === model);
			if (!/^\d+$/.test(text.trim()) || !Number.isSafeInteger(value) || value <= 0 || limits?.maxContextWindow !== void 0 && value > limits.maxContextWindow) {
				setError(t("modelsContextInvalid", { model }));
				return;
			}
			windows[model] = value;
		}
		setError("");
		const { accounts: _accounts,...settings } = {
			...draft,
			...provider === "codex" ? { contextWindows: windows } : {}
		};
		return {
			settings,
			original: catalog.settings,
			efforts: catalog.models.flatMap((model) => {
				const effort = efforts[model.id] ?? "";
				return effort === (model.configured ?? "") || !model.efforts?.length ? [] : [{
					model: model.id,
					effort
				}];
			})
		};
	} }), [
		catalog,
		dirty,
		draft,
		contexts,
		efforts,
		provider
	]);
	const allModels = catalog?.models ?? [];
	const known = new Set(allModels.map((model) => model.id));
	const missing = savedModelIds(draft.visibleModels, draft.modelDisplayNames, draft.subagentSpeeds).filter((id) => !known.has(id)).map((id) => ({
		id,
		name: id
	}));
	const customName = (id) => Object.hasOwn(draft.modelDisplayNames ?? {}, id) ? draft.modelDisplayNames[id] : "";
	const editName = (id, value) => {
		const names = Object.assign(Object.create(null), draft.modelDisplayNames);
		if (value.trim()) names[id] = value;
		else delete names[id];
		edit({
			...draft,
			modelDisplayNames: names
		});
	};
	const models = [...allModels, ...missing].filter((model) => `${model.name} ${model.id} ${customName(model.id)}`.toLowerCase().includes(query.trim().toLowerCase()));
	const editorState = modelEditorState({
		discovered: allModels.length,
		saved: missing.length,
		matched: models.length,
		accounts: catalog?.accounts ?? []
	});
	const selected = new Set(draft.visibleModels ?? allModels.map((model) => model.id));
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			borderBlockStart: border$1,
			marginBlockStart: 12,
			paddingBlockStart: 12
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
			style: { margin: 0 },
			children: t("modelsEdit")
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "grid",
				gap: 12,
				marginBlockStart: 12
			},
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "waycraft-subscription-hint",
					children: t("modelsHint")
				}),
				error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: actions$1,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "waycraft-subscription-quiet",
						disabled: busy || disabled || dirty,
						onClick: () => {
							load(true);
						},
						children: t("usageRefresh")
					}), busy && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						role: "status",
						children: t("modelDefaultsLoading")
					})]
				}),
				catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
					disabled: busy || disabled,
					style: {
						border: 0,
						padding: 0,
						margin: 0,
						minWidth: 0,
						display: "grid",
						gap: 12
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.visibleModels === void 0,
								onChange: (event) => {
									const next = { ...draft };
									if (event.target.checked) delete next.visibleModels;
									else next.visibleModels = allModels.map((model) => model.id);
									edit(next);
								}
							}),
							" ",
							t("modelsAutomatic")
						] }),
						editorState.listState === "provider-empty" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "waycraft-subscription-hint",
							children: t(editorState.noticeKey)
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: actions$1,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: { flex: "1 1 180px" },
									value: query,
									onChange: (event) => setQuery(event.target.value),
									placeholder: t("modelDefaultsFilterPlaceholder"),
									"aria-label": t("modelDefaultsFilterPlaceholder")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => edit({
										...draft,
										visibleModels: allModels.map((model) => model.id)
									}),
									children: t("modelsSelectAll")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => edit({
										...draft,
										visibleModels: []
									}),
									children: t("modelsSelectNone")
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								maxHeight: 360,
								overflowY: "auto",
								display: "grid",
								gap: 8
							},
							children: [models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									borderBlockEnd: border$1,
									padding: "8px 2px",
									display: "grid",
									gap: 8
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: { overflowWrap: "anywhere" },
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: selected.has(model.id),
												onChange: (event) => {
													const next = new Set(selected);
													if (event.target.checked) next.add(model.id);
													else next.delete(model.id);
													edit({
														...draft,
														visibleModels: [...next]
													});
												}
											}),
											" ",
											model.name,
											!known.has(model.id) && ` (${t("modelsUnavailable")})`
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", {
										style: {
											color: "var(--dsw-alias-label-tertiary)",
											overflowWrap: "anywhere"
										},
										children: ["ID: ", model.id]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: actions$1,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: {
												display: "grid",
												gap: 6,
												flex: "1 1 200px",
												minWidth: 0
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: { fontSize: 12 },
												children: t("modelDisplayName")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												maxLength: 80,
												"aria-label": `${model.name} ${t("modelDisplayName")}`,
												placeholder: model.name,
												value: customName(model.id),
												onChange: (event) => editName(model.id, event.target.value)
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: { alignSelf: "end" },
											"aria-label": `${model.name} ${t("displayNameReset")}`,
											disabled: !customName(model.id),
											onClick: () => editName(model.id, ""),
											children: t("displayNameReset")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
										style: { color: "var(--dsw-alias-label-tertiary)" },
										children: t("modelDisplayNameHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: actions$1,
										children: [(model.efforts?.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: actions$1,
											children: [t("modelDefaultsTitle"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												"aria-label": `${model.name} ${t("modelDefaultsTitle")}`,
												value: efforts[model.id] ?? "",
												onChange: (event) => {
													setEfforts({
														...efforts,
														[model.id]: event.target.value
													});
													setDirty(true);
												},
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "",
														children: t("modelDefaultsFollowProvider")
													}),
													model.configured && !model.efforts?.some((effort) => effort.id === model.configured) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
														value: model.configured,
														disabled: true,
														children: [
															model.configured,
															" (",
															t("modelsUnavailable"),
															")"
														]
													}),
													model.efforts?.map((effort) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: effort.id,
														children: effort.name
													}, effort.id))
												]
											})]
										}), provider === "codex" && model.maxContextWindow !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: actions$1,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												style: actions$1,
												children: [t("modelsContext"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													style: { width: 140 },
													inputMode: "numeric",
													value: contexts[model.id] ?? "",
													"aria-label": `${model.name} ${t("modelsContext")}`,
													placeholder: String(model.defaultContextWindow),
													onChange: (event) => {
														setContexts({
															...contexts,
															[model.id]: event.target.value
														});
														setDirty(true);
													}
												})]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsContextBounds", {
												default: model.defaultContextWindow,
												max: model.maxContextWindow
											}) })]
										})]
									}),
									provider === "codex" && (model.fastTier || Object.hasOwn(draft.subagentSpeeds ?? {}, model.id)) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "grid",
											gap: 6
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: actions$1,
											children: [t("modelsSubagentSpeed"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												"aria-label": `${model.name} ${t("modelsSubagentSpeed")}`,
												value: Object.hasOwn(draft.subagentSpeeds ?? {}, model.id) ? draft.subagentSpeeds[model.id] : "standard",
												onChange: (event) => edit({
													...draft,
													subagentSpeeds: {
														...draft.subagentSpeeds,
														[model.id]: event.target.value
													}
												}),
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: "standard",
													children: t("speedStandard")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
													value: "fast",
													disabled: !model.fastTier,
													children: [t("speedFast"), !model.fastTier && ` (${t("modelsUnavailable")})`]
												})]
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsSubagentSpeedHint") })]
									})
								]
							}, model.id)), models.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("modelDefaultsFilterEmpty", { query }) })]
						})] }),
						provider === "codex" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsContextHint") }),
						catalog.tools.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "grid",
								gap: 8
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("modelsTools") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsToolsHint") }),
								catalog.tools.map((tool) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: draft.tools?.[tool] !== false,
										onChange: (event) => edit({
											...draft,
											tools: {
												...draft.tools,
												[tool]: event.target.checked
											}
										})
									}),
									" ",
									t(tool === "image_generate" ? "modelsImage" : tool === "video_generate" ? "modelsVideo" : tool === "web_search" ? "modelsWebSearch" : "modelsSearch")
								] }, tool))
							]
						})
					]
				})
			]
		})]
	});
});

//#endregion
//#region src/settings/display-name-events.ts
/** Notify mounted views after a successful save, without another quota request. */
const DISPLAY_NAME_CHANGED = "waycraft-subscriptions-display-name-changed";
function notifyDisplayNameChange(provider, displayName) {
	window.dispatchEvent(new CustomEvent(DISPLAY_NAME_CHANGED, { detail: {
		provider,
		...displayName?.trim() ? { displayName: displayName.trim() } : {}
	} }));
}

//#endregion
//#region src/settings/provider-settings-styles.ts
/**
* The host loads one JS client bundle, so keep this small, scoped stylesheet
* with the dialog instead of relying on a separate CSS asset. Geometry and
* theme tokens follow the host's settings-form and ui-primitives controls.
*/
const formScope = ":is(.waycraft-subscription-manager, .waycraft-subscriptions-settings)";
const providerSettingsCss = `
.waycraft-subscription-manager {
  box-sizing: border-box;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-panel, 16px);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  box-shadow: var(--dsw-elevation-prominent, 0 20px 70px #0004);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color-scheme: light;
}
.waycraft-subscriptions-settings {
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color-scheme: light;
}
body[data-ds-dark-theme] ${formScope} {
  color-scheme: dark;
}
.waycraft-subscription-manager::backdrop {
  background: var(--dsw-alias-bg-mask-1, #0006);
  backdrop-filter: var(--dsw-mask-blur, none);
}
${formScope} h2 {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
}
${formScope} h3 {
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
}
${formScope} strong,
${formScope} .waycraft-subscription-label {
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}
${formScope} legend {
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
}
${formScope} small,
${formScope} .waycraft-subscription-hint,
${formScope} [role="status"] {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
${formScope} [role="alert"] {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-state-error-primary, #b42318);
}
${formScope} input:not([type="checkbox"]),
${formScope} select {
  box-sizing: border-box;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
}
${formScope} input::placeholder {
  color: var(--dsw-alias-label-tertiary);
  opacity: 1;
}
${formScope} input:not([type="checkbox"]):focus-visible,
${formScope} select:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-state-business-primary, var(--dsw-alias-brand-primary));
}
${formScope} input:not([type="checkbox"]):disabled,
${formScope} select:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
${formScope} input[aria-invalid="true"] {
  border-color: var(--dsw-alias-state-error-primary, #b42318);
}
${formScope} option {
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
}
${formScope} label:has(> input[type="checkbox"]) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
}
${formScope} input[type="checkbox"] {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin: 2px 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
${formScope} label:has(> input[type="checkbox"]:disabled) {
  cursor: default;
  opacity: 0.5;
}
${formScope} button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 28px;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
${formScope} button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-3));
}
${formScope} button:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-3));
}
${formScope} button:disabled {
  opacity: 0.4;
  cursor: default;
}
${formScope} button.waycraft-subscription-quiet {
  border-color: transparent;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
${formScope} :is(footer, .waycraft-subscription-dialog-actions) button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font-size: 13px;
  line-height: 1.5;
}
${formScope} button.waycraft-subscription-primary {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-layer-1));
  font-weight: 500;
}
${formScope} button.waycraft-subscription-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-label-secondary));
}
${formScope} button:focus-visible,
${formScope} input[type="checkbox"]:focus-visible,
${formScope} summary:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
${formScope} summary {
  border-radius: var(--dsw-radius-sm, 6px);
}
${formScope} summary:hover {
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
`;
/** Composer controls retain their own geometry, separate from settings forms. */
const subscriptionChromeCss = `
.waycraft-subscription-usage-pill { corner-shape: round; touch-action: manipulation; }
.waycraft-subscription-usage-pill>svg { flex-shrink: 0; }
.waycraft-subscription-usage-close {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  inline-size: 28px; block-size: 28px; padding: 0; border: 0; border-radius: var(--dsw-radius-sm, 8px);
  color: var(--dsw-alias-label-secondary); background: transparent; cursor: pointer;
}
.waycraft-subscription-usage-close:hover { background: var(--dsw-alias-interactive-bg-hover); }
.waycraft-subscription-usage-close:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
}
@media (max-width: 480px) {
  .waycraft-subscription-usage-pill { max-inline-size: min(220px, calc(100vw - 24px)); }
  .waycraft-subscription-usage-panel { padding: 12px !important; }
}
.waycraft-subscription-usage-tooltip,
.waycraft-subscription-usage-panel {
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  backdrop-filter: var(--dsw-menu-backdrop-filter, none);
}
.waycraft-subscription-speed button:hover:not(:disabled) {
  --waycraft-subscription-speed-hover: var(--dsw-alias-interactive-bg-hover);
}
.waycraft-subscription-speed button:active:not(:disabled) {
  --waycraft-subscription-speed-hover: var(--dsw-alias-interactive-bg-active);
}
.waycraft-subscription-speed button:disabled { opacity: 0.4; cursor: default; }
.waycraft-subscription-speed button:focus-visible,
.waycraft-subscription-usage-pill:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
`;

//#endregion
//#region src/settings/ProviderAccountManager.tsx
const PROMPT_CACHE_TTLS = ["5m", "1h"];
const border = "0.5px solid var(--dsw-alias-border-l2)";
const stack = {
	display: "grid",
	gap: 12,
	minWidth: 0
};
const actions = {
	display: "flex",
	flexWrap: "wrap",
	gap: 8,
	alignItems: "center"
};
/** Native top-layer dialog provides keyboard containment, Escape and focus restoration. */
function ProviderAccountManager({ provider, name, rpc, t, onClose }) {
	const dialog = (0, react.useRef)(null);
	const title = (0, react.useId)();
	const description = (0, react.useId)();
	const cacheTtlId = (0, react.useId)();
	const [catalog, setCatalog] = (0, react.useState)();
	const [changes, setChanges] = (0, react.useState)({});
	const [loading, setLoading] = (0, react.useState)(true);
	const [saving, setSaving] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)("");
	const [saveError, setSaveError] = (0, react.useState)("");
	const [attempt, setAttempt] = (0, react.useState)(0);
	const [modelsDirty, setModelsDirty] = (0, react.useState)(false);
	const [displayName, setDisplayName] = (0, react.useState)("");
	const [nameDirty, setNameDirty] = (0, react.useState)(false);
	/** '' follows the plugin config; otherwise an explicit TTL. */
	const [cacheTtl, setCacheTtl] = (0, react.useState)("");
	const [cacheTtlDirty, setCacheTtlDirty] = (0, react.useState)(false);
	const alive = (0, react.useRef)(true);
	const saveLock = (0, react.useRef)(false);
	const editor = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		alive.current = true;
		const element = dialog.current;
		const previous = document.activeElement;
		element.showModal();
		return () => {
			alive.current = false;
			element.close();
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
		};
	}, []);
	(0, react.useEffect)(() => {
		let current = true;
		setLoading(true);
		setError("");
		callSubscriptionsAuth(rpc, "providerSettings", { provider }).then((data) => {
			if (current) {
				setCatalog(data);
				setDisplayName(data.settings.displayName ?? "");
				setCacheTtl(data.settings.promptCacheTtl ?? "");
			}
		}).catch((error$1) => {
			if (current) setError(t("accountsLoadFailed", { message: error$1 instanceof Error ? error$1.message : String(error$1) }));
		}).finally(() => {
			if (current) setLoading(false);
		});
		return () => {
			current = false;
		};
	}, [
		provider,
		rpc,
		attempt
	]);
	function edit(key, next) {
		setChanges((current) => ({
			...current,
			[key]: next
		}));
	}
	/**
	* One submit for both drafts: the model editor's (visibility, effort,
	* context, tools) and this dialog's account edits. A failure keeps the
	* dialog open with every edit intact.
	*/
	async function save() {
		if (saveLock.current) return;
		const models = editor.current === null ? { efforts: [] } : editor.current.collect();
		if (models === void 0) return;
		saveLock.current = true;
		setSaving(true);
		setSaveError("");
		let savedEfforts = 0;
		try {
			for (const { model, effort } of models.efforts) {
				await callSubscriptionsAuth(rpc, "setModelDefault", {
					provider,
					model,
					...effort ? { effort } : {}
				});
				savedEfforts++;
				if (!alive.current) return;
			}
			const original = catalog?.settings ?? {};
			const { accounts: _accounts, displayName: _name, promptCacheTtl: _ttl,...unchanged } = original;
			const savedName = nameDirty ? displayName.trim() : original.displayName;
			const savedTtl = cacheTtlDirty ? cacheTtl : original.promptCacheTtl;
			const { accounts: _editorAccounts, displayName: _editorName, promptCacheTtl: _editorTtl,...editorFields } = models.settings ?? unchanged;
			const settings = {
				...editorFields,
				...original.accounts || Object.keys(changes).length ? { accounts: {
					...original.accounts,
					...changes
				} } : {},
				...savedName ? { displayName: savedName } : {},
				...savedTtl ? { promptCacheTtl: savedTtl } : {}
			};
			await callSubscriptionsAuth(rpc, "setProviderSettings", {
				provider,
				settings,
				original
			});
			notifyDisplayNameChange(provider, settings.displayName);
			if (alive.current) onClose();
		} catch (error$1) {
			if (alive.current) {
				const message = error$1 instanceof Error ? error$1.message : String(error$1);
				setSaveError((savedEfforts ? t("modelsPartialSave") + " " : "") + t("accountsSaveFailed", { message }));
			}
		} finally {
			saveLock.current = false;
			if (alive.current) setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dialog", {
		className: "waycraft-subscription-manager",
		ref: dialog,
		"aria-labelledby": title,
		"aria-describedby": description,
		onCancel: (event) => {
			if (saveLock.current) event.preventDefault();
		},
		onClose,
		style: {
			width: 620,
			maxWidth: "calc(100vw - 32px)",
			maxHeight: "calc(100dvh - 32px)",
			overflow: "auto"
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: providerSettingsCss }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				...stack,
				padding: 20
			},
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					style: {
						...actions,
						justifyContent: "space-between"
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						id: title,
						style: { margin: 0 },
						children: t("accountsTitle", { provider: name })
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						autoFocus: true,
						disabled: saving,
						onClick: onClose,
						children: t("imageClose")
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					id: description,
					className: "waycraft-subscription-hint",
					children: t("accountsHint")
				}),
				error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				}),
				loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "status",
					className: "waycraft-subscription-hint",
					children: t("accountsLoading")
				}),
				!loading && !catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setAttempt((value) => value + 1),
					children: t("modelDefaultsRetry")
				}),
				catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
					disabled: saving || loading,
					style: {
						...stack,
						border: 0,
						margin: 0,
						padding: 0
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							style: {
								...stack,
								gap: 6,
								paddingBlockEnd: 8
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									...stack,
									gap: 6
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("subscriptionDisplayName") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									maxLength: 80,
									value: displayName,
									placeholder: name,
									onChange: (event) => {
										setDisplayName(event.target.value);
										setNameDirty(true);
									}
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									...actions,
									justifyContent: "space-between"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
									className: "waycraft-subscription-hint",
									children: t("subscriptionDisplayNameHint")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: !displayName,
									onClick: () => {
										setDisplayName("");
										setNameDirty(true);
									},
									children: t("displayNameReset")
								})]
							})]
						}),
						provider === "claude" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							style: {
								...stack,
								gap: 6,
								paddingBlockEnd: 8
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									htmlFor: cacheTtlId,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("claudePromptCacheTtl") })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									id: cacheTtlId,
									value: cacheTtl,
									style: { justifySelf: "start" },
									onChange: (event) => {
										setCacheTtl(event.target.value);
										setCacheTtlDirty(true);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("claudePromptCacheTtlDefault", { ttl: catalog.promptCacheTtlDefault ?? "5m" })
									}), PROMPT_CACHE_TTLS.map((ttl) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: ttl,
										children: t(`claudePromptCacheTtl${ttl}`)
									}, ttl))]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
									className: "waycraft-subscription-hint",
									children: t("claudePromptCacheTtlHint")
								})
							]
						}),
						catalog.accounts.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "waycraft-subscription-hint",
							children: t("accountsEmpty")
						}),
						catalog.accounts.map((account) => {
							const preferences = changes[account.key] ?? catalog.settings.accounts?.[account.key] ?? {};
							const selected = accountPoolSelection(preferences, account.models);
							const models = accountModelRows(account, preferences);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
								style: {
									...stack,
									border,
									borderRadius: "var(--dsw-radius-lg, 12px)",
									padding: 14,
									margin: 0
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", {
										style: {
											padding: "0 6px",
											overflowWrap: "anywhere",
											maxWidth: "100%"
										},
										children: account.label
									}),
									account.unavailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "waycraft-subscription-hint",
										children: t("accountsCatalogUnavailable")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: {
											...stack,
											gap: 6
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "waycraft-subscription-label",
											children: t("accountsAlias")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: preferences.alias ?? "",
											placeholder: account.label,
											onChange: (event) => {
												const next = { ...preferences };
												if (event.target.value.trim()) next.alias = event.target.value;
												else delete next.alias;
												edit(account.key, next);
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: preferences.poolEnabled !== false,
											onChange: (event) => edit(account.key, {
												...preferences,
												poolEnabled: event.target.checked
											})
										}),
										" ",
										t("accountsPoolEnabled")
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: preferences.independentEntry === true,
											onChange: (event) => edit(account.key, {
												...preferences,
												independentEntry: event.target.checked
											})
										}),
										" ",
										t("accountsIndependent")
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "waycraft-subscription-hint",
										children: t("accountsIndependentHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
										style: {
											cursor: "pointer",
											fontSize: 13
										},
										children: [
											t("accountsModels"),
											" ·",
											" ",
											preferences.poolModels === void 0 ? t("accountsModelsAll") : t("accountsModelsCount", { count: preferences.poolModels.length })
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											...stack,
											marginBlockStart: 12
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: "waycraft-subscription-hint",
												children: t("accountsModelsHint")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: preferences.poolModels === void 0,
													onChange: (event) => {
														const next = { ...preferences };
														if (event.target.checked) delete next.poolModels;
														else next.poolModels = account.models.map((model) => model.id);
														edit(account.key, next);
													}
												}),
												" ",
												t("accountsModelsAutomatic")
											] }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: actions,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => edit(account.key, {
														...preferences,
														poolModels: models.map((model) => model.id)
													}),
													children: t("modelsSelectAll")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => edit(account.key, {
														...preferences,
														poolModels: []
													}),
													children: t("modelsSelectNone")
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													...stack,
													gap: 8,
													maxHeight: 240,
													overflowY: "auto"
												},
												children: [models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													style: { overflowWrap: "anywhere" },
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: selected.has(model.id),
															onChange: (event) => {
																const next = new Set(selected);
																if (event.target.checked) next.add(model.id);
																else next.delete(model.id);
																edit(account.key, {
																	...preferences,
																	poolModels: [...next]
																});
															}
														}),
														" ",
														model.name,
														model.unavailable && ` (${t("modelsUnavailable")})`
													]
												}, model.id)), models.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													className: "waycraft-subscription-hint",
													children: t("accountsNoModels")
												})]
											})
										]
									})] })
								]
							}, account.key);
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderModelEditor, {
					ref: editor,
					provider,
					rpc,
					t,
					disabled: saving,
					onDirtyChange: setModelsDirty
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
					style: {
						...stack,
						gap: 8,
						borderBlockStart: border,
						padding: "14px 0 8px",
						position: "sticky",
						insetBlockEnd: 0,
						background: "var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1))"
					},
					children: [saveError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: saveError
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							...actions,
							justifyContent: "flex-end"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: saving,
							onClick: onClose,
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "waycraft-subscription-primary",
							disabled: loading || saving || !Object.keys(changes).length && !modelsDirty && !nameDirty && !cacheTtlDirty,
							onClick: () => {
								save();
							},
							children: saving ? t("modelDefaultsSaving") : t("modelsSave")
						})]
					})]
				})
			]
		})]
	});
}

//#endregion
//#region src/codex-card.ts
/** Scoped presentation port of V1ki v0.9.12 b802311; see PROVENANCE.md. */
const styles$3 = {
	section: {
		display: "flex",
		flexDirection: "column",
		gap: 12,
		maxInlineSize: 560,
		minInlineSize: 0,
		color: "var(--dsw-alias-label-primary)"
	},
	card: {
		border: "0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l2))",
		borderRadius: "var(--dsw-radius-xl, 20px)",
		background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
		padding: "12px 14px",
		display: "flex",
		flexDirection: "column",
		gap: 8,
		minInlineSize: 0
	},
	cardHeader: {
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		gap: 8,
		minInlineSize: 0
	},
	dot: {
		inlineSize: 8,
		blockSize: 8,
		borderRadius: "50%",
		flexShrink: 0
	},
	name: {
		fontSize: 14,
		lineHeight: "22px",
		fontWeight: 500,
		color: "var(--dsw-alias-label-primary)",
		overflowWrap: "anywhere",
		minInlineSize: 0
	},
	statusLine: {
		margin: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-secondary)",
		overflowWrap: "anywhere"
	},
	clientVersion: {
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-secondary)",
		fontVariantNumeric: "tabular-nums",
		overflowWrap: "anywhere"
	},
	errorLine: {
		margin: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-state-error-primary)",
		overflowWrap: "anywhere"
	},
	actions: {
		display: "flex",
		gap: 8,
		marginBlockStart: 4,
		alignItems: "center",
		flexWrap: "wrap"
	},
	usage: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		marginBlockStart: 4,
		borderBlockStart: "0.5px solid var(--dsw-alias-border-l2)",
		paddingBlockStart: 8
	},
	usageHeader: {
		display: "flex",
		alignItems: "center",
		gap: 8
	},
	usageTitle: {
		fontSize: 12,
		lineHeight: "18px",
		fontWeight: 500,
		color: "var(--dsw-alias-label-secondary)"
	},
	usagePlan: {
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-secondary)"
	},
	usageRefresh: {
		minHeight: 22,
		blockSize: 22,
		padding: "0 8px",
		marginInlineStart: "auto"
	},
	usageRow: {
		display: "flex",
		flexDirection: "column",
		gap: 3
	},
	usageMeta: {
		display: "flex",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: 8,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-secondary)",
		overflowWrap: "anywhere"
	},
	accountRow: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		minInlineSize: 0,
		borderBlockStart: "0.5px solid var(--dsw-alias-border-l2)",
		paddingBlockStart: 12,
		marginBlockStart: 4
	},
	accountHeader: {
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		gap: 8,
		minInlineSize: 0
	},
	accountName: {
		fontSize: 13,
		lineHeight: "20px",
		color: "var(--dsw-alias-label-primary)",
		userSelect: "all",
		overflowWrap: "anywhere",
		minInlineSize: 0
	},
	starButton: {
		border: "none",
		padding: 0,
		inlineSize: 28,
		fontSize: 14,
		lineHeight: "22px",
		cursor: "pointer",
		color: "var(--dsw-alias-state-warn-label)"
	},
	usageTrack: {
		blockSize: 6,
		borderRadius: 3,
		overflow: "hidden",
		background: "var(--dsw-alias-bg-layer-1)",
		border: "0.5px solid var(--dsw-alias-border-l2)"
	},
	usageFill: {
		blockSize: "100%",
		borderRadius: 3
	},
	manual: {
		fontSize: 13,
		lineHeight: "20px"
	},
	manualRow: {
		display: "flex",
		flexWrap: "wrap",
		gap: 8,
		alignItems: "center",
		marginBlockStart: 8
	},
	manualInput: {
		flex: "1 1 200px",
		minInlineSize: 0
	},
	modal: {
		inlineSize: 460,
		maxInlineSize: "100%",
		maxHeight: "90vh",
		overflowY: "auto",
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		gap: 12,
		padding: "16px 18px",
		borderRadius: "var(--dsw-radius-panel, 28px)",
		background: "var(--dsw-alias-bg-layer-2)",
		border: 0,
		boxShadow: "var(--dsw-elevation-prominent)"
	},
	modalTitle: {
		fontSize: 16,
		lineHeight: "24px",
		fontWeight: 500,
		color: "var(--dsw-alias-label-primary)"
	}
};
/** Shared presentation only; account/usage controllers stay in their existing cards. */
function providerIdentity(h, t, name, accounts, usage, clientVersion) {
	const account = accounts.find((value) => value.isDefault) ?? accounts[0];
	const plan = account?.plan ?? usage[account?.key]?.plan;
	return h("div", { className: "waycraft-provider-identity" }, h("div", { className: "waycraft-provider-summary" }, h("span", { style: styles$3.name }, name), h("span", { style: styles$3.statusLine }, `${accounts.length} ${t("accountCount")}`), plan ? h("bdi", { style: styles$3.usagePlan }, plan) : null), clientVersion ? h("span", {
		style: styles$3.clientVersion,
		title: t("clientVersionHint")
	}, "CLI ", h("bdi", { dir: "ltr" }, clientVersion.version), " · ", t(`source_${clientVersion.source}`)) : null);
}
function providerStatus(h, t, state, label) {
	const color = state === "ready" ? "var(--dsw-alias-state-success-primary)" : state === "error" ? "var(--dsw-alias-state-error-primary)" : state === "warning" ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-label-secondary)";
	return h("span", {
		role: "img",
		"aria-label": t(label),
		title: t(label),
		"data-waycraft-provider-status": state,
		style: {
			...styles$3.dot,
			background: color
		}
	});
}
function providerDisclosure(h, t, name, expanded, toggle) {
	return h("button", {
		type: "button",
		className: "waycraft-provider-disclosure",
		"aria-label": `${t("subscriptionDetails")}: ${name}`,
		"aria-expanded": expanded,
		onClick: toggle
	}, h("svg", {
		"aria-hidden": true,
		width: 16,
		height: 16,
		viewBox: "0 0 16 16",
		style: { transform: expanded ? "rotate(90deg)" : void 0 }
	}, h("path", {
		d: "m6 3 5 5-5 5",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.5,
		strokeLinecap: "round",
		strokeLinejoin: "round"
	})));
}
const controlCss = `.waycraft-subscriptions-settings button.waycraft-provider-disclosure{inline-size:28px;min-height:28px;padding:0;border:0;background:transparent}
.waycraft-provider-identity{display:flex;flex-direction:column;flex:1 1 160px;min-inline-size:0}
.waycraft-provider-summary{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
[dir=rtl] .waycraft-provider-disclosure svg{scale:-1 1}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) input:not([type="checkbox"]),
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) select {
  box-sizing: border-box;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) input::placeholder {
  color: var(--dsw-alias-label-secondary);
  opacity: 1;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) input:not([type="checkbox"]):focus-visible,
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) select:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
  border-color: var(--dsw-alias-brand-primary);
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) input:not([type="checkbox"]):disabled,
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) select:disabled {
  color: var(--dsw-alias-label-secondary);
  cursor: default;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) input[aria-invalid="true"] {
  border-color: var(--dsw-alias-state-error-primary);
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) option {
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) label:has(> input[type="checkbox"]) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) input[type="checkbox"] {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin: 2px 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) label:has(> input[type="checkbox"]:disabled) {
  cursor: default;
  opacity: 0.5;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 32px;
  max-inline-size: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-1));
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) button:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-1));
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) button:disabled {
  opacity: 0.4;
  cursor: default;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) button.waycraft-subscription-quiet {
  border-color: transparent;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) :is(footer, .waycraft-subscription-dialog-actions) button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font-size: 13px;
  line-height: 1.5;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) button.waycraft-subscription-primary {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-layer-1));
  font-weight: 500;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) button.waycraft-subscription-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-label-secondary));
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) button:focus-visible,
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) input[type="checkbox"]:focus-visible,
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) summary:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) summary {
  border-radius: var(--dsw-radius-sm, 6px);
}
:is(.waycraft-subscriptions-page, .waycraft-subscriptions-settings, .waycraft-reset-dialog) summary:hover {
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}

.waycraft-reset-credits > summary::-webkit-details-marker { display:none; }
.waycraft-reset-credits[open] > summary > svg { transform:rotate(90deg); }
[dir="rtl"] .waycraft-reset-credits > summary > svg { transform:scaleX(-1); }
[dir="rtl"] .waycraft-reset-credits[open] > summary > svg { transform:rotate(90deg); }
.waycraft-reset-dialog::backdrop { background:var(--dsw-alias-bg-mask-1); backdrop-filter:var(--dsw-mask-blur, none); }
.waycraft-subscriptions-settings { font:var(--dsw-font-s-13); }
.waycraft-subscriptions-settings a { color:var(--dsw-alias-state-business-primary); text-underline-offset: .15em; }
`;
function createCodexCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	return function CodexCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const [acknowledged, setAcknowledged] = React.useState(false);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `waycraft-subscriptions.${endpoint}`, {
				provider: "codex",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.codex,
				registrationError: value.registrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (error$1) {
				if (alive.current) setError(error$1 instanceof Error ? error$1.message : String(error$1));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((error$1) => {
				if (alive.current) setError(error$1.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch((failure) => {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((error$1) => {
					if (alive.current) setError(error$1.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (error$1) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: error$1 instanceof Error ? error$1.message : String(error$1) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString(void 0, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit"
		});
		const part = (name, style, ...children) => h("div", {
			style,
			"data-waycraft-codex-part": name
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "waycraft-subscriptions-settings",
			"data-waycraft-codex-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "codex",
			name: status?.displayName || "Codex (ChatGPT)",
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, status?.displayName || "Codex (ChatGPT)", status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, status?.displayName || "Codex (ChatGPT)"), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, status?.displayName || "Codex (ChatGPT)", expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("providerUnavailable") : busy ? t("loginProgress") : status?.accounts?.length ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			const credits = [...snapshot?.resetCredits ?? []].sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
			const next = credits.find((credit) => credit.id && (credit.expiresAt === void 0 || credit.expiresAt > Date.now()));
			const weekly = snapshot?.windows?.find((window$1) => window$1.kind === "weekly" && !window$1.scope);
			const resetBlocked = !weekly || !Number.isFinite(weekly.usedPercent) || !weekly.resetsAt || weekly.resetsAt <= Date.now() || snapshot?.resetCreditsError ? "resetRefresh" : weekly.usedPercent < 80 ? "resetGuard" : !next ? "resetRefresh" : null;
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-waycraft-codex-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => {
				setAcknowledged(false);
				setConfirmation({
					kind: "logout",
					account: account.key,
					label: account.account
				});
			}, false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			}), snapshot?.resetCreditsError ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, t("creditsUnavailable"), " ", snapshot.resetCreditsError) : null, snapshot?.resetCredits ? h("details", {
				className: "waycraft-reset-credits",
				style: styles$3.usageRow
			}, h("summary", { style: {
				...styles$3.usageMeta,
				cursor: "pointer",
				listStyle: "none",
				justifyContent: "flex-start",
				gap: 6
			} }, h("svg", {
				"aria-hidden": true,
				width: 12,
				height: 12,
				viewBox: "0 0 16 16"
			}, h("path", {
				d: "m6 3 5 5-5 5",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})), h("span", null, t("resetCredits")), h("span", { style: { marginInlineStart: "auto" } }, credits.filter((c) => c.id && (c.expiresAt === void 0 || c.expiresAt > Date.now())).length, " ", t("available"))), h("div", { style: {
				paddingInlineStart: 18,
				marginBlockStart: 6
			} }, ...credits.map((credit, index) => h("div", {
				key: credit.id ?? index,
				style: {
					...styles$3.usageMeta,
					minBlockSize: 28,
					gap: 12
				}
			}, h("span", { style: {
				display: "inline-flex",
				alignItems: "center",
				gap: 8,
				flexShrink: 0
			} }, t("fullReset"), credit === next ? button(t("useReset"), () => {
				if (!resetBlocked) action(async () => {
					const prepared = await call("prepareReset", { account: account.key });
					setAcknowledged(false);
					setConfirmation({
						kind: "reset",
						account: account.key,
						label: account.account ?? account.key,
						...prepared
					});
				});
			}, false, {
				"aria-disabled": !!resetBlocked,
				title: t(resetBlocked ?? "resetReady"),
				style: {
					blockSize: 22,
					minBlockSize: 22,
					padding: "0 7px",
					opacity: resetBlocked ? .35 : 1,
					cursor: resetBlocked ? "not-allowed" : "pointer"
				}
			}) : null), h("span", { style: { textAlign: "end" } }, credit.expiresAt === void 0 ? t("creditExpiryUnknown") : h("span", null, t("expires"), " ", h("bdi", null, date(credit.expiresAt)), credit.expiresAt <= Date.now() ? ` · ${t("creditExpired")}` : null)))))) : null));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(status?.accounts?.length ? "addAccount" : "login"), startLogin, !!status?.registrationError)), presentation !== "group" && !busy && status?.accounts?.length ? h("p", { style: styles$3.statusLine }, t("addAccountHint")) : null, busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "waycraft-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t(confirmation.kind === "logout" ? "confirmLogout" : "confirmReset"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t(confirmation.kind === "logout" ? "confirmLogout" : "confirmReset")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), confirmation.kind === "reset" ? part("reset-context", styles$3.usageMeta, h("span", null, t("window_weekly")), h("strong", null, `${Math.round(confirmation.weeklyUsedPercent)}%`)) : null, confirmation.kind === "reset" ? h("p", { style: styles$3.statusLine }, confirmation.creditExpiresAt === void 0 ? t("creditExpiryUnknown") : h("span", null, t("expires"), " ", h("bdi", null, date(confirmation.creditExpiresAt)))) : null, confirmation.kind === "reset" ? h("p", { style: styles$3.statusLine }, t("resetWarning")) : null, confirmation.kind === "reset" ? h("label", { style: {
			display: "flex",
			gap: 8,
			alignItems: "flex-start",
			fontSize: 12,
			lineHeight: "18px"
		} }, h("input", {
			type: "checkbox",
			checked: acknowledged,
			onChange: (event) => setAcknowledged(event.target.checked)
		}), t("resetAcknowledge")) : null, h("div", {
			className: "waycraft-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t(confirmation.kind === "reset" ? "confirm" : "logout"), () => {
			action(async () => {
				if (confirmation.kind === "logout") await call("logout", { account: confirmation.account });
				else await call("consumeReset", {
					account: confirmation.account,
					ticket: confirmation.ticket
				});
				setConfirmation(null);
				await refreshStatus();
				if (confirmation.kind === "reset") await refreshUsage(confirmation.account, true);
			});
		}, confirmation.kind === "reset" && (!acknowledged || Date.now() >= confirmation.expiresAt), { className: confirmation.kind === "reset" ? "waycraft-subscription-primary" : void 0 }))) : null);
	};
}

//#endregion
//#region src/settings/ProxySettings.tsx
/** Draft/test/save behavior ported from v0.9.12 SubscriptionsSection. Password never pre-fills. */
function ProxySettings({ rpc, t }) {
	const [view, setView] = (0, react.useState)();
	const [open, setOpen] = (0, react.useState)(false);
	const [draft, setDraft] = (0, react.useState)({});
	const [error, setError] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)("");
	const [result, setResult] = (0, react.useState)();
	const dialog = (0, react.useRef)(null);
	const generation = (0, react.useRef)(0);
	(0, react.useEffect)(() => () => {
		generation.current++;
	}, []);
	const close = () => {
		generation.current++;
		setOpen(false);
		setBusy("");
	};
	(0, react.useEffect)(() => {
		let alive = true;
		callSubscriptionsAuth(rpc, "proxyGet", {}).then((value) => {
			if (alive) setView(value);
		}).catch((reason) => {
			if (alive) setError(String(reason.message));
		});
		return () => {
			alive = false;
		};
	}, [rpc]);
	(0, react.useEffect)(() => {
		if (!open) return;
		const previous = document.activeElement;
		dialog.current?.showModal();
		return () => {
			dialog.current?.close();
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
		};
	}, [open]);
	const field = (key, value) => setDraft((old) => ({
		...old,
		[key]: value
	}));
	const run = async (test) => {
		if (busy) return;
		const request = ++generation.current;
		setBusy(test ? "test" : "save");
		setError("");
		setResult(void 0);
		const password = draft.clearPassword ? { password: null } : draft.password ? { password: draft.password } : {};
		try {
			if (test) {
				const tested = await callSubscriptionsAuth(rpc, "proxyTest", { proxy: {
					enabled: draft.enabled,
					url: draft.url.trim(),
					...draft.username.trim() !== "" ? { username: draft.username.trim() } : {},
					...password,
					bypass: draft.bypass.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
				} });
				if (generation.current === request) setResult(tested);
			} else {
				const saved = await callSubscriptionsAuth(rpc, "proxySet", {
					enabled: draft.enabled,
					url: draft.url.trim(),
					username: draft.username,
					...password,
					bypass: draft.bypass.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
				});
				if (generation.current === request) {
					setView(saved);
					setOpen(false);
				}
			}
		} catch (reason) {
			if (generation.current === request) setError(reason.message);
		} finally {
			if (generation.current === request) setBusy("");
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		className: "waycraft-proxy-settings",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("proxyTitle") }),
				" ",
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: !view,
					onClick: () => {
						setDraft({
							...view,
							username: view.username ?? "",
							password: "",
							clearPassword: false,
							bypass: view.bypass.join(", ")
						});
						setError("");
						setResult(void 0);
						setOpen(true);
					},
					children: t("proxyConfigure")
				})
			] }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "status",
				children: view ? view.error ? t("proxyStatusError", { message: view.error }) : view.enabled ? t("proxyStatusEnabled", { url: view.url }) : t("proxyStatusNone") : t("proxyLoading")
			}),
			error && !open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "alert",
				children: error
			}),
			open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dialog", {
				className: "waycraft-subscription-manager waycraft-proxy-dialog",
				ref: dialog,
				"aria-labelledby": "waycraft-proxy-title",
				onCancel: close,
				style: {
					width: 620,
					maxWidth: "calc(100vw - 32px)",
					maxHeight: "calc(100dvh - 32px)",
					overflow: "auto"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: providerSettingsCss }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 14,
						padding: 20,
						minWidth: 0
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							gap: 12
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							id: "waycraft-proxy-title",
							style: { margin: 0 },
							children: t("proxyDialogTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: close,
							children: t("imageClose")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "grid",
							gap: 12
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.enabled,
								onChange: (event) => field("enabled", event.target.checked)
							}), t("proxyEnabled")] }),
							[
								"url",
								"username",
								"password",
								"bypass"
							].map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "grid",
									gap: 6,
									minWidth: 0
								},
								children: [
									t(`proxy${key[0].toUpperCase()}${key.slice(1)}`),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: key === "password" ? "password" : "text",
										autoComplete: "off",
										dir: key === "url" ? "ltr" : void 0,
										value: draft[key],
										onChange: (event) => field(key, event.target.value)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
										className: "waycraft-subscription-hint",
										children: t(`proxy${key[0].toUpperCase()}${key.slice(1)}Hint`)
									})
								]
							}, key)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.clearPassword,
								onChange: (event) => field("clearPassword", event.target.checked)
							}), t("proxyClearPassword")] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "waycraft-subscription-hint",
								children: t("proxyNote")
							}),
							error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								role: "alert",
								children: error
							}),
							result && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								role: "status",
								children: result.ok ? t(result.viaProxy ? "proxyTestOk" : "proxyTestOkDirect", {
									status: String(result.status),
									ms: String(result.latencyMs)
								}) : t("proxyTestFail", { message: result.error ?? "" })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
								style: {
									display: "flex",
									justifyContent: "flex-end",
									flexWrap: "wrap",
									gap: 8
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: !!busy,
										onClick: () => void run(true),
										children: t(busy === "test" ? "proxyTesting" : "proxyTest")
									}),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: !!busy,
										onClick: () => void run(false),
										children: t(busy === "save" ? "proxySaving" : "proxySave")
									}),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: close,
										children: t("proxyCancel")
									})
								]
							})
						]
					})]
				})]
			})
		]
	});
}

//#endregion
//#region src/api-providers.ts
function createApiProviders(React, remote, t, primitives$1 = require("@deepseek-ai/dsh-client-ui-primitives")) {
	const h = React.createElement;
	const at = (value, path) => path.reduce((v, key) => v?.[key], value);
	const refOf = (entry, profile) => profile?.apiKeyEnv ?? `${entry.provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`;
	const copy = (value) => JSON.parse(JSON.stringify(value));
	const subscriptionIDs = new Set([
		"codex",
		"claude",
		"grok",
		"antigravity",
		"copilot",
		"opencode-zen"
	]);
	const control = {
		font: "inherit",
		color: "inherit",
		background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
		border: "0.5px solid var(--dsw-alias-border-l2)",
		borderRadius: "var(--dsw-radius-md, 12px)",
		padding: "6px 12px",
		minHeight: "36px",
		minWidth: 0,
		boxSizing: "border-box"
	};
	return function ApiProviders({ subscriptions: subscriptions$2, showAPI = true, showSubscriptionAdd = true } = {}) {
		const [subscription, setSubscription] = React.useState("");
		const [authFlow, setAuthFlow] = React.useState(null);
		const [snapshot, setSnapshot] = React.useState(null);
		const [draft, setDraft] = React.useState(null);
		const [addOpen, setAddOpen] = React.useState(false);
		const [addMode, setAddMode] = React.useState("catalog");
		const [message, setMessage] = React.useState("");
		const [busy, setBusy] = React.useState(false);
		const generation = React.useRef(0);
		const mounted = React.useRef(true);
		const addButton = React.useRef(null);
		const subscriptionAddButton = React.useRef(null);
		const addOrigin = React.useRef("api");
		const restoreAddFocus = React.useRef(false);
		const visitedDrafts = React.useRef({});
		React.useEffect(() => {
			if (!addOpen && restoreAddFocus.current) {
				restoreAddFocus.current = false;
				(addOrigin.current === "subscription" ? subscriptionAddButton : addButton).current?.focus();
			}
		}, [addOpen]);
		const valueOf = (result) => {
			if (!result.ok) throw new Error(result.error?.code === "settings/conflict" ? "apiConflict" : "apiFailed");
			return result.value;
		};
		async function load() {
			const sequence = ++generation.current;
			if (!remote) return;
			try {
				const [settings, directory, registered] = await Promise.all([
					remote.settings.describe(),
					remote.llm.listConfigurableProviders(),
					remote.llm.listProviders()
				]);
				const described = valueOf(settings);
				const entries = valueOf(directory);
				const providers = valueOf(registered);
				const configuredIDs = Object.keys(described.namespaces.find((n) => n.ns === "llm-pi-ai")?.value?.providers ?? {});
				const occupiedIDs = new Set([
					...entries.map((entry) => entry.provider),
					...providers.map((provider) => provider.id),
					...configuredIDs
				]);
				const rows = entries.filter((entry) => !subscriptionIDs.has(entry.provider));
				for (const provider of providers) if (!subscriptionIDs.has(provider.id) && !rows.some((e) => e.provider === provider.id)) rows.push({
					provider: provider.id,
					displayName: provider.name,
					settingsNs: "",
					settingsPath: []
				});
				rows.sort((a, b) => rank(a.provider) - rank(b.provider));
				const refs = [...new Set(rows.flatMap((e) => {
					if (e.provider === "deepseek-account") return [];
					const profile = at(described.namespaces.find((n) => n.ns === e.settingsNs)?.value, e.settingsPath);
					return profile?.apiKeyEnv ? [profile.apiKeyEnv] : [refOf(e, profile), ...e.nativeAuth?.env ?? []];
				}))];
				const credentials = {};
				for (let i = 0; i < refs.length; i += 64) Object.assign(credentials, valueOf(await remote.credentials.describe(refs.slice(i, i + 64))));
				if (mounted.current && sequence === generation.current) setSnapshot({
					...described,
					rows,
					credentials,
					occupiedIDs
				});
			} catch {
				if (mounted.current && sequence === generation.current) setMessage("apiFailed");
			}
		}
		function rank(id) {
			return id === "deepseek-account" ? 0 : id === "deepseek-official" ? 1 : 2;
		}
		React.useEffect(() => {
			mounted.current = true;
			load();
			const refresh = () => {
				load();
			};
			const disposers = !remote ? [] : [
				"settings/document-updated",
				"credentials/reference-updated",
				"credentials/record-updated",
				"llm/adapters-updated"
			].map((event) => remote.$on(event, refresh));
			return () => {
				mounted.current = false;
				generation.current++;
				disposers.forEach((off) => off());
			};
		}, []);
		const nsOf = (e) => snapshot.namespaces.find((n) => n.ns === e.settingsNs);
		const removable = (e, ns) => e.declared === true && e.settingsPath.length > 0 && at(ns?.user, e.settingsPath) !== void 0 && at(ns?.base, e.settingsPath) === void 0;
		function edit(entry) {
			const ns = nsOf(entry);
			if (!ns) return;
			const profile = at(ns.value, entry.settingsPath) ?? {};
			setMessage("");
			setDraft({
				entry,
				revision: ns.revision,
				user: copy(at(ns.user, entry.settingsPath) ?? {}),
				profile: copy(profile),
				key: "",
				keyAction: "keep",
				models: copy(profile.models ?? []),
				isNew: at(ns.value, entry.settingsPath) === void 0,
				custom: false
			});
		}
		function custom() {
			const ns = snapshot.namespaces.find((n) => n.ns === "llm-pi-ai");
			setMessage("");
			setDraft({
				entry: {
					provider: "",
					settingsNs: "llm-pi-ai",
					settingsPath: [],
					declared: true
				},
				revision: ns.revision,
				user: {},
				profile: {
					api: "openai-completions",
					baseURL: "",
					displayName: ""
				},
				key: "",
				keyAction: "keep",
				models: [],
				isNew: true,
				custom: true
			});
		}
		function switchMode(mode) {
			if (busy || authFlow?.busy || mode === addMode) return;
			if (draft) visitedDrafts.current[addMode] = {
				...draft,
				key: "",
				keyAction: "keep"
			};
			setAuthFlow(null);
			setAddMode(mode);
			setMessage("");
			if (visitedDrafts.current[mode]) setDraft(visitedDrafts.current[mode]);
			else {
				setDraft(null);
				if (mode === "custom") custom();
				else if (mode === "catalog" && addable[0]) edit(addable[0]);
			}
		}
		const change = (field$1, value) => setDraft((d) => ({
			...d,
			[field$1]: value
		}));
		const profileChange = (field$1, value) => setDraft((d) => ({
			...d,
			profile: {
				...d.profile,
				[field$1]: value
			}
		}));
		async function run(action) {
			if (busy) return;
			setBusy(true);
			setMessage("");
			try {
				await action();
			} catch (error) {
				if (mounted.current) setMessage(error instanceof Error && [
					"apiConflict",
					"apiInvalid",
					"apiPartial"
				].includes(error.message) ? error.message : "apiFailed");
			} finally {
				if (mounted.current) setBusy(false);
			}
		}
		function parsedModels() {
			const models = draft.models;
			if (!Array.isArray(models) || models.some((m) => !m || typeof m.id !== "string" || !m.id.trim() || m.name !== void 0 && typeof m.name !== "string" || ["contextWindow", "maxTokens"].some((k) => m[k] !== void 0 && (!Number.isInteger(m[k]) || m[k] < 1)) || m.input !== void 0 && (!Array.isArray(m.input) || m.input.some((v) => !["text", "image"].includes(v))) || m.reasoningEfforts !== void 0 && m.reasoningEfforts !== false && (typeof m.reasoningEfforts !== "object" || m.reasoningEfforts === null || Array.isArray(m.reasoningEfforts)))) throw new Error("apiInvalid");
			if (new Set(models.map((m) => m.id)).size !== models.length) throw new Error("apiInvalid");
			return models;
		}
		async function save() {
			let entry = draft.entry;
			if (draft.custom) {
				if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.provider) || subscriptionIDs.has(entry.provider) || snapshot.occupiedIDs.has(entry.provider)) throw new Error("apiInvalid");
				entry = {
					...entry,
					settingsPath: ["providers", entry.provider]
				};
			}
			if (draft.profile.baseURL) try {
				const url = new URL(draft.profile.baseURL);
				if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
			} catch {
				throw new Error("apiInvalid");
			}
			const models = parsedModels();
			if (draft.custom && (!draft.profile.baseURL || models.length === 0)) throw new Error("apiInvalid");
			const next = { ...draft.user };
			for (const field$1 of ["displayName", "baseURL"]) if (draft.profile[field$1]?.trim()) next[field$1] = draft.profile[field$1].trim();
			else delete next[field$1];
			next.models = models;
			if (draft.custom) next.api = draft.profile.api;
			const ref = refOf(entry, draft.profile);
			if (draft.keyAction !== "keep" && snapshot.credentials[ref]?.writable === false) throw new Error("apiFailed");
			if (draft.keyAction === "set") {
				if (!draft.key.trim() || /[\r\n]/.test(draft.key)) throw new Error("apiInvalid");
				next.apiKeyEnv = ref;
			}
			const ops = [];
			for (const field$1 of ["displayName", "baseURL"]) if (field$1 in draft.user && !(field$1 in next)) ops.push({
				op: "unset",
				path: [...entry.settingsPath, field$1]
			});
			for (const field$1 of Object.keys(next)) if (JSON.stringify(next[field$1]) !== JSON.stringify(draft.user[field$1])) ops.push({
				op: "set",
				path: [...entry.settingsPath, field$1],
				value: next[field$1]
			});
			if (draft.isNew && ops.length === 0) ops.push({
				op: "set",
				path: entry.settingsPath,
				value: {}
			});
			let committed = false;
			if (ops.length) {
				const view = valueOf(await remote.settings.mutate(entry.settingsNs, ops, draft.revision));
				committed = true;
				if (mounted.current) setDraft((d) => ({
					...d,
					entry,
					revision: view.revision,
					user: copy(next),
					isNew: false,
					custom: false
				}));
			}
			if (draft.keyAction !== "keep") try {
				if (!(draft.keyAction === "set" ? await remote.credentials.set(ref, draft.key.trim()) : await remote.credentials.unset(ref)).ok) throw new Error("apiFailed");
			} catch {
				throw new Error(committed ? "apiPartial" : "apiFailed");
			}
			if (mounted.current) {
				restoreAddFocus.current = addOpen;
				visitedDrafts.current = {};
				setDraft(null);
				setAddOpen(false);
				setMessage("apiSaved");
			}
			await load();
		}
		async function discover() {
			const request = {
				provider: draft.entry.provider,
				baseURL: draft.profile.baseURL,
				api: draft.profile.api
			};
			if (draft.keyAction === "set" && draft.key.trim()) request.apiKey = draft.key.trim();
			const models = valueOf(await remote.llm.discoverModels(draft.entry.settingsNs, request)).map(({ inputModalities,...model }) => ({
				...model,
				...inputModalities === void 0 ? {} : { input: inputModalities }
			}));
			if (mounted.current) change("models", models);
		}
		async function remove(entry) {
			const ns = nsOf(entry);
			if (!removable(entry, ns)) throw new Error("apiInvalid");
			valueOf(await remote.settings.mutate(ns.ns, [{
				op: "unset",
				path: entry.settingsPath
			}], ns.revision));
			setMessage("apiSaved");
			await load();
		}
		const button = (key, onClick, disabled = false, cancellation = false) => h("button", {
			type: "button",
			className: key === "apiAdd" ? "waycraft-api-add-trigger" : void 0,
			style: {
				...control,
				...key === "apiAdd" ? {
					inlineSize: "100%",
					minHeight: 44,
					borderStyle: "dashed",
					background: "transparent"
				} : {}
			},
			onClick,
			disabled: busy || !cancellation && !!authFlow?.busy || disabled,
			...key === "apiAdd" ? { ref: addButton } : {}
		}, t(key));
		const field = (key, value, onChange, type = "text") => h("label", { className: "waycraft-api-field" }, t(key), h("input", {
			"aria-label": t(key),
			type,
			value,
			autoComplete: "off",
			style: control,
			disabled: busy,
			onChange: (e) => onChange(e.target.value),
			dir: [
				"apiRoute",
				"apiURL",
				"apiModelID",
				"apiKey"
			].includes(key) ? "ltr" : "auto"
		}));
		const configured = (entry) => {
			const ns = nsOf(entry);
			return ns !== void 0 && (entry.settingsPath.length === 0 || at(ns.value, entry.settingsPath) !== void 0);
		};
		const addable = snapshot?.rows.filter((entry) => nsOf(entry) && !configured(entry)) ?? [];
		const select = (key, value, onChange, options) => h("label", { className: "waycraft-api-field" }, t(key), h("select", {
			"aria-label": t(key),
			value,
			style: control,
			disabled: busy || key === "apiSubscription" && !!authFlow?.busy,
			onChange: (e) => onChange(e.target.value)
		}, ...options));
		React.useEffect(() => {
			if (!subscriptions$2?.request || authFlow?.busy) return;
			addOrigin.current = "subscription";
			if (subscriptions$2.request.returnFocus) subscriptionAddButton.current = subscriptions$2.request.returnFocus;
			setSubscription(subscriptions$2.request.provider);
			setAddMode("subscription");
			setDraft(null);
			setAddOpen(true);
		}, [subscriptions$2?.request]);
		const close = () => {
			setAuthFlow(null);
			restoreAddFocus.current = addOpen;
			visitedDrafts.current = {};
			setDraft(null);
			setAddOpen(false);
		};
		const editor = () => h("div", {
			role: "group",
			"aria-label": t("apiEditor"),
			className: "waycraft-api-editor"
		}, draft.custom ? field("apiRoute", draft.entry.provider, (v) => change("entry", {
			...draft.entry,
			provider: v
		})) : h("bdi", { className: "waycraft-api-muted" }, draft.entry.provider), field("apiName", draft.profile.displayName ?? "", (v) => profileChange("displayName", v)), field("apiURL", draft.profile.baseURL ?? "", (v) => profileChange("baseURL", v)), draft.custom ? select("apiProtocol", draft.profile.api, (v) => profileChange("api", v), [
			"openai-completions",
			"openai-responses",
			"anthropic-messages"
		].map((v) => h("option", {
			key: v,
			value: v
		}, v))) : null, select("apiKeyAction", draft.keyAction, (v) => change("keyAction", v), [
			"keep",
			"set",
			"unset"
		].map((v) => h("option", {
			key: v,
			value: v
		}, t(`apiKey_${v}`)))), draft.keyAction === "set" ? field("apiKey", draft.key, (v) => change("key", v), "password") : null, h("p", { className: "waycraft-api-muted" }, t("apiKeyLimit")), h("div", { className: "waycraft-api-head" }, h("strong", null, t("apiModels")), button("apiFetch", () => {
			run(discover);
		})), ...draft.models.map((model, index) => h("div", {
			key: index,
			className: "waycraft-api-model",
			"data-waycraft-api-model": index
		}, field("apiModelID", model.id, (v) => change("models", draft.models.map((m, i) => i === index ? {
			...m,
			id: v
		} : m))), field("apiModelName", model.name ?? "", (v) => change("models", draft.models.map((m, i) => i === index ? {
			...m,
			name: v
		} : m))), button("apiModelRemove", () => change("models", draft.models.filter((_, i) => i !== index))))), button("apiModelAdd", () => change("models", [...draft.models, {
			id: "",
			name: ""
		}])), h("p", { className: "waycraft-api-muted" }, t("apiModelsHint")), h("div", { className: "waycraft-api-actions" }, button("apiSave", () => {
			run(save);
		}), button("apiCancel", close, false, true)));
		const openAdd = (group) => {
			addOrigin.current = group;
			setAddOpen(true);
			setDraft(null);
			setMessage("");
			setAddMode(group === "subscription" ? "subscription" : "catalog");
			if (group === "api" && addable[0]) edit(addable[0]);
		};
		const addPanel = () => h("div", { className: `waycraft-api-add${addMode !== "subscription" ? " waycraft-api-add-open" : " waycraft-subscription-add-open"}` }, addOpen ? h(React.Fragment, null, addOrigin.current === "subscription" ? null : h(primitives$1.SegmentedControl, {
			id: "waycraft-provider-add-mode",
			value: addMode,
			label: t("apiAdd"),
			className: "waycraft-api-tabs",
			disabled: busy || !!authFlow?.busy,
			onChange: switchMode,
			options: ["catalog", "custom"].map((mode) => ({
				value: mode,
				label: t(mode === "catalog" ? "apiCatalog" : mode === "custom" ? "apiCustom" : "apiSubscription"),
				disabled: mode !== "subscription" && (!snapshot?.writable || mode === "custom" && !snapshot.namespaces.some((n) => n.ns === "llm-pi-ai"))
			}))
		}), h("div", {
			role: addOrigin.current === "subscription" ? "group" : "tabpanel",
			id: `waycraft-provider-add-mode-${addMode}-panel`,
			"aria-label": addOrigin.current === "subscription" ? t("subscriptionAdd") : void 0,
			"aria-labelledby": addOrigin.current === "subscription" ? void 0 : `waycraft-provider-add-mode-${addMode}`
		}, addMode === "catalog" ? select("apiCatalog", draft?.entry.provider ?? "", (v) => {
			const entry = addable.find((e) => e.provider === v);
			if (entry) edit(entry);
		}, [h("option", {
			key: "",
			value: "",
			disabled: true
		}, t("apiChoose")), ...addable.map((e) => h("option", {
			key: e.provider,
			value: e.provider
		}, e.displayName))]) : null, addMode === "subscription" ? h(React.Fragment, null, select("apiSubscription", subscription || subscriptions$2.providers[0]?.id || "", (v) => {
			if (!authFlow?.busy) {
				setAuthFlow(null);
				setSubscription(v);
			}
		}, subscriptions$2.providers.map((p) => h("option", {
			key: p.id,
			value: p.id
		}, p.name))), subscriptions$2.renderAuth(subscription || subscriptions$2.providers[0]?.id, close, setAuthFlow), h("div", { className: "waycraft-subscription-add-actions" }, button("cancel", () => run(async () => {
			if (!authFlow?.cancel || await authFlow.cancel()) close();
		}), false, true))) : draft ? editor() : button("apiCancel", close, false, true))) : null);
		return h("div", {
			"data-waycraft-api-providers": true,
			"aria-busy": busy,
			className: "waycraft-api-section"
		}, h("style", null, `
        .waycraft-provider-group{display:flex;flex-direction:column;gap:12px;min-inline-size:0}.waycraft-provider-group+.waycraft-provider-group{margin-block-start:12px}.waycraft-provider-title{margin:0;font-size:16px;line-height:24px;font-weight:500}
        .waycraft-api-section{max-inline-size:720px;min-inline-size:0;display:flex;flex-direction:column;gap:12px;text-align:start;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
        .waycraft-api-section *{box-sizing:border-box}.waycraft-api-section p{margin:0}
        .waycraft-api-rows{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}.waycraft-api-rows>li{min-inline-size:0}
        .waycraft-api-row{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));border-radius:var(--dsw-radius-xl,20px);padding:14px 16px;min-inline-size:0}
        .waycraft-api-head,.waycraft-api-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .waycraft-api-identity{display:flex;flex-direction:column;align-items:flex-start;gap:4px;flex:1 1 180px;min-inline-size:0;overflow-wrap:anywhere}.waycraft-api-identity strong{font-weight:500}
        .waycraft-api-actions{margin-inline-start:auto}.waycraft-api-muted{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
        .waycraft-api-editor{display:flex;flex-direction:column;gap:14px;padding-block:14px 4px;margin-block-start:12px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
        .waycraft-api-field{display:flex;flex-direction:column;gap:6px;min-inline-size:0;font-size:12px;line-height:18px;font-weight:500}.waycraft-api-field input,.waycraft-api-field select{inline-size:100%;font-size:14px;line-height:22px;font-weight:400}
        .waycraft-api-model{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:8px;align-items:end}
        .waycraft-api-add{margin-block-start:4px;min-inline-size:0}.waycraft-api-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-block-end:14px}.waycraft-api-tabs [aria-selected=true]{font-weight:500;background:var(--dsw-alias-bg-layer-1)}
        .waycraft-api-section .waycraft-subscription-add-trigger{display:flex;align-items:center;justify-content:center;gap:6px;inline-size:100%;min-block-size:44px;padding:0 14px;border:1px dashed var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px);background:transparent;color:inherit;font:inherit}
        .waycraft-api-section .waycraft-subscription-add-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-1))}
        .waycraft-subscription-add-open{padding:14px 16px;border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-bg-layer-1))}
        .waycraft-subscription-add-actions{display:flex;justify-content:flex-end;gap:8px}
        .waycraft-subscription-add-actions>button{flex:0 0 auto;inline-size:auto}
        .waycraft-api-section .waycraft-subscriptions-settings :is([data-waycraft-codex-part=header],[data-waycraft-claude-part=header],[data-waycraft-grok-part=header],[data-waycraft-antigravity-part=header],[data-waycraft-copilot-part=header])>button:not(.waycraft-provider-disclosure){height:28px;block-size:28px;min-height:28px;padding:0 10px;border-radius:var(--dsw-radius-sm,8px);font-size:12px;line-height:18px}
        .waycraft-subscription-add-open [data-waycraft-codex-part=card],.waycraft-subscription-add-open [data-waycraft-claude-part=card],.waycraft-subscription-add-open [data-waycraft-grok-part=card],.waycraft-subscription-add-open [data-waycraft-antigravity-part=card],.waycraft-subscription-add-open [data-waycraft-copilot-part=card]{border:0!important;background:transparent!important;padding:0!important}
        .waycraft-api-add-open{padding:14px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
        .waycraft-api-add>:is([role=tabpanel],[role=group]){display:flex;flex-direction:column;gap:14px;min-inline-size:0}.waycraft-api-add>:is([role=tabpanel],[role=group])>.waycraft-api-editor{margin-block-start:0}
        .waycraft-api-section button{cursor:pointer;max-inline-size:100%;white-space:normal;overflow-wrap:anywhere}.waycraft-api-section button:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}
        .waycraft-api-section :is(button,input,select):focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.waycraft-api-section :disabled{opacity:.5;cursor:not-allowed}
        @media(max-width:520px){.waycraft-api-model{grid-template-columns:minmax(0,1fr)}.waycraft-api-model button{justify-self:start}.waycraft-api-actions{margin-inline-start:0}}
      `), message ? h("p", { role: message === "apiSaved" ? "status" : "alert" }, t(message)) : null, subscriptions$2 ? h("section", {
			"data-waycraft-provider-group": "subscription",
			className: "waycraft-provider-group",
			"aria-label": t("subscriptionProviders")
		}, h("h3", { className: "waycraft-provider-title" }, t("subscriptionProviders")), h("ul", { className: "waycraft-api-rows" }, ...subscriptions$2.rows), addOpen && addOrigin.current === "subscription" ? addPanel() : !showSubscriptionAdd ? null : h("button", {
			type: "button",
			className: "waycraft-subscription-add-trigger",
			ref: subscriptionAddButton,
			disabled: busy || addOpen,
			onClick: () => openAdd("subscription")
		}, h("svg", {
			width: 16,
			height: 16,
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			"aria-hidden": true
		}, h("path", { d: "M12 4v16M4 12h16" })), t("addAccount"))) : null, showAPI && h("section", {
			"data-waycraft-provider-group": "api",
			className: "waycraft-provider-group",
			"aria-label": t("apiProviders")
		}, h("div", { className: "waycraft-api-head" }, h("h3", { className: "waycraft-provider-title" }, t("apiProviders")), h("div", { className: "waycraft-api-actions" }, button("apiRefresh", () => {
			load();
		}))), h(React.Fragment, null, !snapshot ? h("p", null, t(remote ? message ? "apiFailed" : "apiLoading" : "apiUnavailable")) : null, h("ul", { className: "waycraft-api-rows" }, ...(snapshot?.rows ?? []).filter(configured).map((entry) => {
			const ns = nsOf(entry), profile = at(ns.value, entry.settingsPath);
			const metadata = (profile?.apiKeyEnv ? [profile.apiKeyEnv] : [refOf(entry, profile), ...entry.nativeAuth?.env ?? []]).map((ref) => snapshot.credentials[ref]);
			const credentialStatus = entry.provider === "deepseek-account" ? "account-unknown" : metadata.some((value) => value?.configured === true) ? "configured" : metadata.every((value) => value?.configured === false) ? "missing" : "unknown";
			const statusLabel = credentialStatus === "configured" ? "apiKeySet" : credentialStatus === "missing" ? "apiKeyMissing" : credentialStatus === "account-unknown" ? "apiAccountUnknown" : "apiKeyUnknown";
			return h("li", {
				key: entry.provider,
				"data-waycraft-api-provider": entry.provider,
				className: "waycraft-api-row"
			}, h("div", { className: "waycraft-api-head" }, h("span", { className: "waycraft-api-identity" }, h("strong", null, profile?.displayName ?? entry.displayName), h("span", {
				className: "waycraft-api-muted",
				"data-waycraft-credential-status": credentialStatus
			}, h("span", {
				"aria-hidden": true,
				style: {
					display: "inline-block",
					width: 6,
					height: 6,
					borderRadius: "50%",
					marginInlineEnd: 6,
					background: "currentColor"
				}
			}), t(statusLabel))), h("span", { className: "waycraft-api-actions" }, entry.provider === "deepseek-account" ? null : button("apiEdit", () => {
				setAddOpen(false);
				edit(entry);
			}, addOpen || !snapshot.writable), removable(entry, ns) ? button("apiDelete", () => {
				run(() => remove(entry));
			}, addOpen || !snapshot.writable) : null)), !addOpen && draft?.entry.provider === entry.provider ? editor() : null);
		})), addOpen && addOrigin.current === "api" ? addPanel() : button("apiAdd", () => openAdd("api"), addOpen || !snapshot?.writable))));
	};
}

//#endregion
//#region src/copilot-card.ts
/** GitHub Copilot Settings card, adapted from pinned reference SubscriptionsSection device login and shared
* account presentation. Only sanitized status crosses RPC; see PROVENANCE.md. */
function createCopilotCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	primitives$1.Input;
	const DEFAULT_NAME = "GitHub Copilot";
	return function CopilotCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `waycraft-subscriptions.${endpoint}`, {
				provider: "copilot",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.copilot ?? { accounts: [] },
				registrationError: value.copilotRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch((failure) => {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-waycraft-copilot-part": name$1
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "waycraft-subscriptions-settings",
			"data-waycraft-copilot-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "copilot",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, name, status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, name), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, name, expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("copilotProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-waycraft-copilot-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(hasAccounts ? "addAccount" : "login"), () => startLogin(), !!status?.registrationError)), busy && (status.pendingAuth ?? login) ? h("div", { style: styles$3.manual }, h("p", null, t("copilotDeviceHint")), h("bdi", {
			dir: "ltr",
			"data-waycraft-copilot-code": true
		}, (status.pendingAuth ?? login).userCode), button(t("copyDeviceCode"), () => {
			action(async () => {
				await navigator.clipboard.writeText((status.pendingAuth ?? login).userCode);
			});
		}), h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization"))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "waycraft-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "waycraft-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/claude-card.ts
/**
* Claude Settings card. Scoped presentation port of the Claude part of V1ki v0.9.12 b802311
* SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
* labels, plan and expiry, never a token or credential-store path.
*/
function createClaudeCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	const DEFAULT_NAME = "Claude (Subscription)";
	return function ClaudeCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `waycraft-subscriptions.${endpoint}`, {
				provider: "claude",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.claude ?? { accounts: [] },
				registrationError: value.claudeRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch((failure) => {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-waycraft-claude-part": name$1
		}, ...children);
		const startLogin = (method) => {
			action(async () => {
				const result = await call("login", method === void 0 ? {} : { method });
				if (!alive.current) return;
				if (result.authorizeUrl) window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result.authorizeUrl ? result : null);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "waycraft-subscriptions-settings",
			"data-waycraft-claude-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "claude",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, name, status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, name), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, name, expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("claudeProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-waycraft-claude-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : hasAccounts ? [button(t("addAccountOAuth"), () => startLogin("oauth"), !!status?.registrationError, { key: "oauth" }), button(t("addAccountKeychain"), () => startLogin("keychain"), !!status?.registrationError, { key: "keychain" })] : button(t("login"), () => startLogin(), !!status?.registrationError)), presentation !== "group" && !busy && hasAccounts ? h("p", { style: styles$3.statusLine }, t("claudeAddAccountHint")) : null, busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "waycraft-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "waycraft-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/usage-badge/usage-window-filter.ts
/** Presentation only: never trim the raw snapshots used by quota/routing logic. */
function visibleUsageWindows(provider, windows, visibleModels) {
	const all = windows ?? [];
	if (provider !== "antigravity" || visibleModels === void 0) return all;
	const selected = new Set(visibleModels);
	return all.filter((window$1) => !window$1.scope || selected.has(window$1.scope));
}

//#endregion
//#region src/antigravity-card.ts
/**
* Antigravity Settings card. Scoped presentation port of the Antigravity part of V1ki v0.9.12 b802311
* SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
* labels, plan and expiry, never a token or credential-store path.
*/
function createAntigravityCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	const DEFAULT_NAME = "Google Antigravity";
	return function AntigravityCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `waycraft-subscriptions.${endpoint}`, {
				provider: "antigravity",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.antigravity ?? { accounts: [] },
				registrationError: value.antigravityRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch((failure) => {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (status?.setupRequired) return Promise.resolve();
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-waycraft-antigravity-part": name$1
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				if (result.authorizeUrl) window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result.authorizeUrl ? result : null);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "waycraft-subscriptions-settings",
			"data-waycraft-antigravity-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "antigravity",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError || status?.setupRequired ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError || status?.setupRequired ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, name, status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, name), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, name, expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError && !status?.setupRequired ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.setupRequired ? t("antigravitySetupRequired") : status?.registrationError ? t("antigravityProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail && !status?.setupRequired ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			const windows = visibleUsageWindows("antigravity", snapshot?.windows, status?.visibleModels);
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-waycraft-antigravity-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, !!status?.setupRequired, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !windows.length ? h("p", { style: styles$3.statusLine }, t(snapshot.windows?.length ? "usageNoVisibleModels" : "usageEmpty")) : null, ...windows.map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(hasAccounts ? "addAccountOAuth" : "login"), () => startLogin(), !!status?.registrationError || !!status?.setupRequired)), busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "waycraft-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "waycraft-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/zen-card.ts
/** Login-less lane; independent presentation using the existing owned card styles and RPC. */
function createZenCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	return function ZenCard() {
		const [status, setStatus] = React.useState(null);
		const [failed, setFailed] = React.useState(false);
		const [pending, setPending] = React.useState(false);
		const [expanded, setExpanded] = React.useState(false);
		const alive = React.useRef(true);
		const refresh = async () => {
			setPending(true);
			try {
				const value = await callSubscriptionsAuth$1(rpc, "zenStatus", {});
				if (alive.current) {
					setStatus(value);
					setFailed(false);
				}
			} catch {
				if (alive.current) setFailed(true);
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refresh();
			return () => {
				alive.current = false;
			};
		}, []);
		const enabled = status?.enabled !== false;
		const toggle = async () => {
			setPending(true);
			try {
				const value = await callSubscriptionsAuth$1(rpc, "setZenEnabled", { enabled: !enabled });
				if (alive.current) {
					setStatus(value);
					setFailed(false);
				}
			} catch {
				if (alive.current) setFailed(true);
			} finally {
				if (alive.current) setPending(false);
			}
		};
		const state = !enabled ? "warning" : pending || !status && !failed ? "checking" : failed || status?.registrationError ? "error" : status.reachable ? "ready" : "warning";
		const label = state === "checking" ? "checking" : state === "error" ? "zenUnavailable" : state === "ready" ? "zenReachable" : "zenUnreachable";
		return h("div", {
			style: {
				...styles$3.section,
				maxWidth: "none",
				maxInlineSize: "none",
				width: "100%",
				textAlign: "start"
			},
			className: "waycraft-subscriptions-settings",
			"data-waycraft-zen-card": true
		}, h("style", null, controlCss), h("div", { style: styles$3.card }, h("div", { style: styles$3.cardHeader }, providerStatus(h, t, state, !enabled ? "zenDisabled" : label), h("div", { className: "waycraft-provider-identity" }, h("span", { style: styles$3.name }, "OpenCode Zen")), h("button", {
			type: "button",
			role: "switch",
			"aria-checked": enabled,
			"aria-label": t("zenEnabled"),
			disabled: pending || !status,
			onClick: () => void toggle(),
			style: {
				padding: 2,
				height: 20,
				minHeight: 20,
				minWidth: 36,
				width: 36,
				flexShrink: 0,
				border: 0,
				borderRadius: 999,
				display: "inline-flex",
				alignItems: "center",
				background: enabled ? "var(--dsw-alias-brand-primary)" : "var(--dsw-alias-interactive-bg-hover)"
			}
		}, h("span", {
			"aria-hidden": true,
			style: {
				width: 16,
				height: 16,
				borderRadius: "50%",
				background: enabled ? "var(--dsw-alias-bg-base)" : "var(--dsw-alias-label-secondary)",
				marginInlineStart: enabled ? "auto" : 0,
				marginInlineEnd: enabled ? 0 : "auto"
			}
		})), providerDisclosure(h, t, "OpenCode Zen", expanded, () => setExpanded(!expanded))), expanded ? h("div", { style: {
			...styles$3.usage,
			gap: 8
		} }, h("p", {
			role: "status",
			style: styles$3.statusLine
		}, t(!enabled ? "zenDisabled" : label)), status ? h("p", { style: styles$3.statusLine }, `${t("zenModelCount")}: ${status.modelCount} · ${t("zenSource_" + status.source)}`) : null, h("div", { style: {
			...styles$3.actions,
			justifyContent: "flex-end"
		} }, h(primitives$1.Button ?? "button", {
			type: "button",
			disabled: pending,
			onClick: () => void refresh()
		}, t("zenRefresh")))) : null));
	};
}

//#endregion
//#region src/grok-card.ts
/**
* Grok Settings card. Scoped presentation port of the Grok part of V1ki v0.9.12 b802311
* SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
* labels, plan and expiry, never a token or credential-store path.
*/
function createGrokCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	const DEFAULT_NAME = "Grok (Subscription)";
	return function GrokCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `waycraft-subscriptions.${endpoint}`, {
				provider: "grok",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.grok ?? { accounts: [] },
				registrationError: value.grokRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch((failure) => {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-waycraft-grok-part": name$1
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				if (result.authorizeUrl) window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result.authorizeUrl ? result : null);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "waycraft-subscriptions-settings",
			"data-waycraft-grok-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "grok",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, name, status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, name), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, name, expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("grokProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-waycraft-grok-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(hasAccounts ? "addAccountOAuth" : "login"), () => startLogin(), !!status?.registrationError)), busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "waycraft-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "waycraft-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/speed/SpeedSelect.tsx
/**
* The `loadSpeed` half of the inject face: the plugin's own speed state plus
* the host's current model selection (the visibility gate). A model-RPC
* failure throws rather than answering "hidden" — the caller keeps its last
* known state, so a transient failure never locks the toggle away.
*
* `sessionId` is a plain string: slot and command contexts brand it through
* different dsh-session copies, and only the service boundary needs one.
*
* `models` resolves lazily per call: the ui-model-selection service may
* register after this plugin applies, and a shell without it (no model seat
* at all) simply keeps the toggle hidden.
*/
function createSpeedLoader(connection, models, sessionId) {
	return async () => {
		const directories = models();
		const current = directories === void 0 ? null : (await directories.directoryFor(sessionId).load()).current;
		const state = await callSubscriptionsAuth(connection.rpc, "speed", {
			sessionId,
			...current?.provider === "codex" ? { model: current.model } : {}
		});
		return {
			visible: current !== null && current.provider === "codex" && state.fastModels.includes(current.model),
			tier: state.tier
		};
	};
}
/** The `setSpeed` half of the inject face: boolean outcome for the component's busy state. */
function createSpeedSetter(connection, sessionId) {
	return (tier) => callSubscriptionsAuth(connection.rpc, "setSpeed", {
		sessionId,
		tier
	}).then(() => true, () => false);
}
/** English-dictionary fallback for a missing inject `t` (standalone renders). */
function fallbackTranslate$1(key) {
	return subscriptions$1[key] ?? key;
}
const TIERS = ["standard", "fast"];
/**
* The composer Speed control: a trigger reading `Speed · Fast`/`Speed · Standard`
* that opens a two-row menu (standard/fast with descriptions, check mark on
* the current tier). Mount and every open reload the host state so a model
* switch made since the last open self-corrects.
*/
/** How often the control re-reads the host state (model switches arrive only by asking). */
const POLL_INTERVAL_MS = 3e3;
/**
* The composer Speed control: a trigger reading `Speed · Fast`/`Speed · Standard`
* that opens a two-row menu (standard/fast with descriptions, check mark on
* the current tier). The host pushes nothing on a model switch, so the
* control re-reads on a slow poll with a single-flight guard; a failed read
* keeps the last known state, so a transient RPC failure can never lock the
* toggle away (the earlier mount-only load had no recovery path).
*/
function SpeedSelect({ loadSpeed, setSpeed, t }) {
	const translate = t ?? fallbackTranslate$1;
	const [state, setState] = (0, react.useState)(null);
	const [open, setOpen] = (0, react.useState)(false);
	const [busy, setBusy] = (0, react.useState)(false);
	const rootRef = (0, react.useRef)(null);
	const loadRef = (0, react.useRef)(loadSpeed);
	loadRef.current = loadSpeed;
	(0, react.useEffect)(() => {
		if (loadRef.current === void 0) return;
		let cancelled = false;
		let inflight = false;
		const reload = () => {
			const load = loadRef.current;
			if (load === void 0 || inflight) return;
			inflight = true;
			load().then((loaded) => {
				if (!cancelled) setState(loaded);
			}, () => {}).finally(() => {
				inflight = false;
			});
		};
		reload();
		const timer = setInterval(reload, POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);
	(0, react.useEffect)(() => {
		if (!open) return;
		const closeOutside = (event) => {
			if (!rootRef.current?.contains(event.target)) setOpen(false);
		};
		document.addEventListener("mousedown", closeOutside);
		return () => {
			document.removeEventListener("mousedown", closeOutside);
		};
	}, [open]);
	if (loadSpeed === void 0 || setSpeed === void 0 || state === null || !state.visible) return null;
	const choose = (tier) => {
		if (busy) return;
		if (tier === state.tier) {
			setOpen(false);
			return;
		}
		setBusy(true);
		setSpeed(tier).then((ok) => {
			setBusy(false);
			if (ok) {
				setState({
					visible: true,
					tier
				});
				setOpen(false);
			}
		});
	};
	const show = () => {
		setOpen(true);
		const load = loadRef.current;
		if (load === void 0) return;
		load().then(setState, () => {});
	};
	const tierName = (tier) => translate(tier === "fast" ? "speedFast" : "speedStandard");
	const tierDescription = (tier) => translate(tier === "fast" ? "speedFastDescription" : "speedStandardDescription");
	const triggerLabel = `${translate("speed")} · ${tierName(state.tier)}`;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: "waycraft-subscription-speed",
		style: styles$2.root,
		onKeyDown: (event) => {
			if (event.key === "Escape" && open) {
				event.preventDefault();
				setOpen(false);
			}
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: subscriptionChromeCss }),
			open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: styles$2.menu,
				role: "menu",
				"aria-label": translate("speed"),
				children: TIERS.map((tier) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "menuitemradio",
					"aria-checked": tier === state.tier,
					style: styles$2.item,
					disabled: busy,
					onClick: () => {
						choose(tier);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: styles$2.itemCheck,
						children: tier === state.tier ? "✓" : ""
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: styles$2.itemText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: styles$2.itemName,
							children: tierName(tier)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: styles$2.itemDescription,
							children: tierDescription(tier)
						})]
					})]
				}, tier))
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				style: styles$2.trigger,
				"aria-haspopup": "menu",
				"aria-expanded": open,
				title: triggerLabel,
				disabled: busy,
				onClick: () => {
					if (open) setOpen(false);
					else show();
				},
				children: triggerLabel
			})
		]
	});
}
const styles$2 = {
	root: {
		position: "relative",
		display: "inline-flex"
	},
	trigger: {
		border: "0.5px solid var(--dsw-alias-border-l3)",
		borderRadius: "var(--dsw-radius-sm, 8px)",
		background: "var(--waycraft-subscription-speed-hover, transparent)",
		color: "var(--dsw-alias-label-secondary)",
		font: "inherit",
		fontSize: 12,
		lineHeight: "18px",
		padding: "2px 8px",
		cursor: "pointer",
		whiteSpace: "nowrap"
	},
	menu: {
		position: "absolute",
		bottom: "100%",
		insetInlineEnd: 0,
		marginBottom: 4,
		minWidth: 180,
		padding: 4,
		zIndex: 20,
		background: "var(--dsw-specific-menu, var(--dsw-alias-bg-layer-2))",
		border: 0,
		boxShadow: "var(--dsw-elevation-prominent)",
		borderRadius: "var(--dsw-radius-lg, 16px)",
		display: "flex",
		flexDirection: "column",
		gap: 2
	},
	item: {
		display: "flex",
		alignItems: "flex-start",
		gap: 6,
		width: "100%",
		border: "none",
		borderRadius: "var(--dsw-radius-sm, 8px)",
		background: "var(--waycraft-subscription-speed-hover, transparent)",
		padding: "6px 8px",
		cursor: "pointer",
		font: "inherit",
		textAlign: "start"
	},
	itemCheck: {
		width: 14,
		flexShrink: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-primary)"
	},
	itemText: {
		display: "flex",
		flexDirection: "column"
	},
	itemName: {
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-primary)"
	},
	itemDescription: {
		fontSize: 11,
		lineHeight: "16px",
		color: "var(--dsw-alias-label-tertiary)"
	}
};

//#endregion
//#region src/speed/fast-command.ts
/** Build the locale resolver used by the /fast command contribution. */
function fastCommandDescription(t) {
	return () => t();
}

//#endregion
//#region src/usage-badge/usage-types.ts
/** Bar fill color: success normally, warn from 80%, error from 95%. */
function usageBarColor(usedPercent$1) {
	if (usedPercent$1 >= 95) return "var(--dsw-alias-state-error-primary)";
	if (usedPercent$1 >= 80) return "var(--dsw-alias-state-warn-label)";
	return "var(--dsw-alias-state-success-primary)";
}

//#endregion
//#region src/usage-badge/host-modules.ts
let primitives;
let reactDom;
/** `@deepseek-ai/dsh-client-ui-primitives`, resolved on first use. */
function hostPrimitives() {
	return primitives ??= require("@deepseek-ai/dsh-client-ui-primitives");
}
/** `react-dom` (portals), resolved on first use. */
function hostReactDom() {
	return reactDom ??= require("react-dom");
}

//#endregion
//#region src/usage-badge/usage-badge-preferences.ts
const MODE_KEY = "waycraft.subscriptions.usageBadgeMode";
const MODE_EVENT = "waycraft:subscriptions:usage-badge-mode";
/** Read the browser preference; blocked storage retains the default display. */
function readUsageBadgeMode() {
	if (typeof window === "undefined") return "recent";
	try {
		return (window.localStorage.getItem(MODE_KEY) ?? window.localStorage.getItem(LEGACY_USAGE_BADGE_KEY)) === "hidden" ? "hidden" : "recent";
	} catch (error) {
		if (!(error instanceof DOMException) || error.name !== "SecurityError") throw error;
		return "recent";
	}
}
/** Save first, then notify; the settings control reports a rejected write. */
function setUsageBadgeMode(mode) {
	if (mode !== "recent" && mode !== "hidden") throw new TypeError("Invalid subscription usage display mode");
	window.localStorage.setItem(MODE_KEY, mode);
	window.dispatchEvent(new Event(MODE_EVENT));
}
/** Same-tab writes need a custom event; other tabs use the storage event. */
function subscribeUsageBadgeMode(notify) {
	const onStorage = (event) => {
		if (event.key === MODE_KEY || event.key === null) notify();
	};
	window.addEventListener(MODE_EVENT, notify);
	window.addEventListener("storage", onStorage);
	return () => {
		window.removeEventListener(MODE_EVENT, notify);
		window.removeEventListener("storage", onStorage);
	};
}
/** Shared React snapshot used by the settings control and every mounted badge. */
function useUsageBadgeMode() {
	return (0, react.useSyncExternalStore)(subscribeUsageBadgeMode, readUsageBadgeMode, () => "recent");
}

//#endregion
//#region src/usage-badge/SubscriptionUsageBadge.tsx
/** Owned usage chart glyph; no dependency on a host icon export. */
function UsageBadgeIcon() {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.7",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 19V13M10 19V8M16 19V4M3 21h18" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m3 8 6-4 6 2 6-4" })]
	});
}
/** How often the badge re-reads usage; the server also shares its own cache/negative-cache across UI surfaces. */
const USAGE_POLL_INTERVAL_MS = 15 * 6e4;
/** How often the badge re-reads the session's current model (model switches arrive only by asking). */
const MODEL_POLL_INTERVAL_MS = 3e3;
/** Distance between the trigger's top edge and the dialog's bottom (host stat dialogs use the same). */
const PANEL_GAP = 8;
/** Distance kept between the dialog and each viewport edge. */
const PANEL_MARGIN = 12;
/** The account the collapsed pill reads: the default one, else the first listed. */
function pillAccountOf(d) {
	return d.accounts.find((a) => a.isDefault) ?? d.accounts[0];
}
/** Brand display names (short form for the compact badge). */
const PROVIDER_NAMES = {
	codex: "Codex",
	claude: "Claude",
	grok: "Grok",
	copilot: "Copilot",
	antigravity: "Antigravity"
};
/**
* The `currentModel` half of the inject face: the session's effective
* model selection through ui-model-selection's `modelDirectories` service,
* resolved lazily per call (the service may register after this plugin, and
* a shell without it reports "unknown"; the badge keeps the most recent
* subscription selected in this view, or stays hidden).
*/
function createCurrentModelReader(models, sessionId) {
	return async () => {
		const directories = models();
		if (directories === void 0) return void 0;
		const { current } = await directories.directoryFor(sessionId).load();
		return current ?? void 0;
	};
}
/**
* Compact time-remaining label derived from the window's `resetsAt` timestamp:
* "6d 18h" (days+hours), "1h 58m" (hours+minutes), or "42m" (minutes only).
* Falls back to the scope/kind abbreviation when no reset time is known.
*/
function windowLabel(w) {
	if (w.resetsAt === void 0) {
		if (w.scope !== void 0 && w.scope !== "") return w.scope;
		switch (w.kind) {
			case "session": return "5h";
			case "weekly": return "Wk";
			default: return "W";
		}
	}
	const ms = Math.max(0, w.resetsAt - Date.now());
	const minutes = Math.floor(ms / 6e4);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	return `${Math.max(1, minutes)}m`;
}
/** Clamp and round a window's used share for display. */
function usedPercent(w) {
	return Math.round(Math.min(100, Math.max(0, w.usedPercent)));
}
/** Keep model quotas separate: matching percentages do not imply a shared pool. */
function prioritizeWindows(windows, model) {
	return model === void 0 ? [...windows] : [...windows.filter((w) => w.scope === model), ...windows.filter((w) => w.scope !== model)];
}
/** Small previews keep a live model catalog from taking over the dialog. */
const WINDOW_PREVIEW_LIMIT = 4;
function previewWindows(windows, model, provider) {
	const ordered = prioritizeWindows(windows, model);
	const limit = provider === "antigravity" ? Math.min(2, model === void 0 ? 0 : windows.filter((w) => w.scope === model).length) : WINDOW_PREVIEW_LIMIT;
	return {
		shown: ordered.slice(0, limit),
		hidden: ordered.slice(limit)
	};
}
/** Bounded readout; Antigravity quotas belong to individual models, not the account. */
function compactSegment(d, model, t = fallbackTranslate) {
	const windows = pillAccountOf(d).windows;
	if (d.provider === "antigravity") {
		const matching = model === void 0 ? [] : windows.filter((w) => w.scope === model);
		if (matching.length === 0) return `${d.name} ${t(model === void 0 ? "usageBadgeModelCount" : "usageBadgeModelUnavailable", { count: new Set(windows.map((w) => w.scope).filter(Boolean)).size })}`;
		const parts$1 = matching.slice(0, 2).map((w) => `${w.kind === "weekly" ? t("usageWeekly") : t("usageWindow")} ${usedPercent(w)}%`);
		return `${d.name} ${parts$1.join(" · ")}`;
	}
	const parts = windows.slice(0, 2).map((w) => `${w.scope || (w.kind === "session" ? t("usageSessionShort") : w.kind === "weekly" ? t("usageWeeklyShort") : t("usageWindow"))} ${usedPercent(w)}%`);
	if (windows.length > 2) parts.push(`+${windows.length - 2}`);
	return `${d.name} ${parts.join(" · ")}`;
}
/** Remember only the most recent subscription in this view, including its model scope. */
function retainSubscriptionSelection(previous, current) {
	return current !== void 0 && Object.hasOwn(PROVIDER_NAMES, current.provider) ? current : previous;
}
/** At most one provider; no known selection or no usage means no badge. */
function collapsedDisplays(displays, current) {
	const match = displays.find((d) => d.provider === current);
	return match === void 0 ? [] : [match];
}
/** Order for the expanded dialog: the current provider first, the rest in poll order. */
function expandedDisplays(displays, current) {
	const match = displays.find((d) => d.provider === current);
	return match === void 0 ? displays : [match, ...displays.filter((d) => d !== match)];
}
/**
* A provider's logged-in accounts, the effective default first. When no
* account is flagged default the first listed stands in, matching what
* direct routes fall back to.
*/
function accountsOf(status) {
	if (status == null || !Array.isArray(status.accounts) || status.accounts.length === 0) return [];
	const fallback = status.accounts.find((a) => a.isDefault) ?? status.accounts[0];
	return status.accounts.map((a) => a === fallback ? {
		...a,
		isDefault: true
	} : a).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}
/** English-dictionary fallback for a missing inject `t` (standalone renders). */
function fallbackTranslate(key, params) {
	return (subscriptions$1[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? ""));
}
/** Localized label of one usage window (kind, plus the model scope when named). */
function usageWindowLabel(t, window$1) {
	const base = window$1.kind === "session" ? t("usageSession") : window$1.kind === "weekly" ? t("usageWeekly") : t("usageWindow");
	return window$1.scope !== void 0 && window$1.scope !== "" ? `${base} · ${window$1.scope}` : base;
}
/**
* The composer subscription-usage badge: a pill reading e.g.
* `Codex 5h 25% · Wk 40%` for the current model's provider, opening a dialog with
* every provider's accounts and their windows. Returns null when no data is
* available.
*/
function SubscriptionUsageBadge({ rpc, currentModel, t }) {
	const translate = t ?? fallbackTranslate;
	const [displays, setDisplays] = (0, react.useState)([]);
	const [selection, setSelection] = (0, react.useState)(void 0);
	const [lastSubscription, setLastSubscription] = (0, react.useState)(void 0);
	const displayMode = useUsageBadgeMode();
	const current = selection?.provider;
	const badgeSelection = retainSubscriptionSelection(lastSubscription, selection);
	const [open, setOpen] = (0, react.useState)(false);
	const [hover, setHover] = (0, react.useState)(false);
	const [focused, setFocused] = (0, react.useState)(false);
	const tooltipId = (0, react.useId)();
	const panelId = (0, react.useId)();
	const tooltipRef = (0, react.useRef)(null);
	const buttonRef = (0, react.useRef)(null);
	const showTooltip = !open && (hover || focused);
	const inflightRef = (0, react.useRef)(false);
	const mountedRef = (0, react.useRef)(true);
	const rootRef = (0, react.useRef)(null);
	const panelRef = (0, react.useRef)(null);
	const seatRef = (0, react.useRef)(null);
	const currentRef = (0, react.useRef)(currentModel);
	currentRef.current = currentModel;
	const lastKnownRef = (0, react.useRef)(/* @__PURE__ */ new Map());
	const namesRevision = (0, react.useRef)(0);
	const recentNames = (0, react.useRef)(/* @__PURE__ */ new Map());
	const refresh = (0, react.useCallback)(async () => {
		if (rpc === void 0 || inflightRef.current) return;
		inflightRef.current = true;
		const revision = namesRevision.current;
		try {
			const statusResp = await callSubscriptionsAuth(rpc, "status", {});
			if (!mountedRef.current) return;
			const roster = [];
			for (const provider of Object.keys(statusResp.providers)) {
				if (!Object.hasOwn(PROVIDER_NAMES, provider)) continue;
				for (const account of accountsOf(statusResp.providers[provider])) roster.push({
					provider,
					account
				});
			}
			const keyOf = (provider, account) => `${provider}:${account.key}`;
			const lastKnown = lastKnownRef.current;
			const live = new Set(roster.map(({ provider, account }) => keyOf(provider, account)));
			for (const key of lastKnown.keys()) if (!live.has(key)) lastKnown.delete(key);
			if (roster.length === 0) {
				setDisplays([]);
				return;
			}
			const results = await Promise.allSettled(roster.map(async ({ provider, account }) => {
				return {
					provider,
					account,
					usage: await callSubscriptionsAuth(rpc, "usage", {
						provider,
						account: account.key,
						force: false
					})
				};
			}));
			if (!mountedRef.current) return;
			const plans = /* @__PURE__ */ new Map();
			for (const r of results) {
				if (r.status !== "fulfilled") continue;
				const { provider, account, usage } = r.value;
				const key = keyOf(provider, account);
				if (usage.plan !== void 0) plans.set(key, usage.plan);
				if (!usage.supported || !usage.windows || usage.windows.length === 0) {
					lastKnown.delete(key);
					continue;
				}
				lastKnown.set(key, usage.windows);
			}
			const byProvider = /* @__PURE__ */ new Map();
			for (const { provider, account } of roster) {
				const key = keyOf(provider, account);
				const windows = lastKnown.get(key);
				if (windows === void 0) continue;
				const plan = plans.get(key) ?? account.plan;
				const row = {
					key: account.key,
					isDefault: account.isDefault,
					...account.account === void 0 ? {} : { account: account.account },
					...plan === void 0 ? {} : { plan },
					windows
				};
				const display = byProvider.get(provider);
				if (display === void 0) byProvider.set(provider, {
					provider,
					name: statusResp.providers[provider]?.displayName || PROVIDER_NAMES[provider],
					accounts: [row]
				});
				else display.accounts.push(row);
			}
			setDisplays([...byProvider.values()].map((row) => {
				const saved = recentNames.current.get(row.provider);
				return saved && saved.revision > revision ? {
					...row,
					name: saved.name
				} : row;
			}));
		} catch {} finally {
			inflightRef.current = false;
		}
	}, [rpc]);
	(0, react.useEffect)(() => {
		const update = (event) => {
			const { provider, displayName } = event.detail;
			recentNames.current.set(provider, {
				revision: ++namesRevision.current,
				name: displayName || PROVIDER_NAMES[provider]
			});
			setDisplays((current$1) => current$1.map((row) => row.provider === provider ? {
				...row,
				name: displayName || PROVIDER_NAMES[provider]
			} : row));
		};
		window.addEventListener(DISPLAY_NAME_CHANGED, update);
		return () => {
			window.removeEventListener(DISPLAY_NAME_CHANGED, update);
		};
	}, []);
	(0, react.useEffect)(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);
	(0, react.useEffect)(() => {
		if (displayMode === "hidden") return;
		refresh();
		const timer = setInterval(() => {
			refresh();
		}, USAGE_POLL_INTERVAL_MS);
		return () => {
			clearInterval(timer);
		};
	}, [refresh, displayMode]);
	(0, react.useEffect)(() => {
		if (currentRef.current === void 0) return;
		let cancelled = false;
		let inflight = false;
		const reload = () => {
			const read = currentRef.current;
			if (read === void 0 || inflight) return;
			inflight = true;
			read().then((model) => {
				if (cancelled) return;
				setLastSubscription((previous) => retainSubscriptionSelection(previous, model));
				setSelection(model);
			}, () => {}).finally(() => {
				inflight = false;
			});
		};
		reload();
		const timer = setInterval(reload, MODEL_POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);
	const { useAnchoredPosition, useDismissOnOutsidePointer } = hostPrimitives();
	const pos = useAnchoredPosition({
		open,
		anchorRef: rootRef,
		panelRef,
		side: "top",
		gap: PANEL_GAP,
		margin: PANEL_MARGIN
	});
	const tooltipPos = useAnchoredPosition({
		open: showTooltip,
		anchorRef: rootRef,
		panelRef: tooltipRef,
		side: "top",
		gap: PANEL_GAP,
		margin: PANEL_MARGIN
	});
	useDismissOnOutsidePointer(rootRef, open, setOpen, panelRef);
	(0, react.useEffect)(() => {
		if (!open && !showTooltip) return;
		const onKeyDown = (event) => {
			if (event.key === "Escape") {
				setOpen(false);
				setHover(false);
				setFocused(false);
				if (open) buttonRef.current?.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open, showTooltip]);
	const [statsRow, setStatsRow] = (0, react.useState)(null);
	(0, react.useEffect)(() => {
		const seat$1 = seatRef.current;
		if (seat$1 === null) return;
		const scope = statsScopeOf(seat$1);
		if (scope === null) return;
		const find = () => scope.querySelector("[data-composer-stats]");
		setStatsRow(find());
		const observer = new MutationObserver(() => {
			setStatsRow(find());
		});
		observer.observe(scope, {
			childList: true,
			subtree: true
		});
		return () => {
			observer.disconnect();
		};
	}, []);
	(0, react.useEffect)(() => {
		if (displayMode === "hidden") setOpen(false);
	}, [displayMode]);
	const seat = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
		ref: seatRef,
		style: styles$1.seat,
		"aria-hidden": true
	});
	const collapsed = collapsedDisplays(displays, badgeSelection?.provider);
	if (displayMode === "hidden" || collapsed.length === 0) return seat;
	const label = compactSegment(collapsed[0], badgeSelection?.model, translate);
	const expanded = expandedDisplays(displays, badgeSelection?.provider);
	const title = translate("usageBadgeTitle");
	const toggle = () => {
		const next = !open;
		setOpen(next);
		setHover(false);
		setFocused(false);
		if (next) refresh();
	};
	const close = () => {
		setOpen(false);
		setHover(false);
		setFocused(false);
		buttonRef.current?.focus();
	};
	const tooltipAccount = pillAccountOf(collapsed[0]);
	const tooltipWindows = previewWindows(tooltipAccount.windows, badgeSelection?.model, collapsed[0].provider);
	const pill = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
		ref: rootRef,
		style: styles$1.anchor,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: subscriptionChromeCss }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				ref: buttonRef,
				type: "button",
				className: "waycraft-subscription-usage-pill",
				style: {
					...styles$1.pill,
					...hover || open ? styles$1.pillActive : {}
				},
				"aria-haspopup": "dialog",
				"aria-expanded": open,
				"aria-label": `${title} · ${label}`,
				"aria-describedby": showTooltip ? tooltipId : void 0,
				"aria-controls": open ? panelId : void 0,
				onMouseEnter: () => {
					setHover(true);
				},
				onMouseLeave: () => {
					setHover(false);
				},
				onFocus: () => {
					if (!open) setFocused(true);
				},
				onBlur: () => {
					setFocused(false);
				},
				onKeyDown: (event) => {
					if (event.key === "Escape") {
						setHover(false);
						setFocused(false);
					}
				},
				onClick: toggle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageBadgeIcon, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("bdi", {
					style: styles$1.label,
					children: label
				})]
			}),
			showTooltip && hostReactDom().createPortal(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: tooltipRef,
				id: tooltipId,
				role: "tooltip",
				className: "waycraft-subscription-usage-tooltip",
				style: {
					...styles$1.tooltip,
					...tooltipPos ?? MEASURE_STYLE
				},
				onMouseEnter: () => {
					setHover(true);
				},
				onMouseLeave: () => {
					setHover(false);
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
						style: styles$1.tooltipTitle,
						children: title
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("bdi", {
						style: styles$1.tooltipHint,
						title: tooltipAccount.account,
						children: tooltipAccount.account
					}),
					tooltipWindows.shown.map((w, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles$1.tooltipRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: usageWindowLabel(translate, w) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("bdi", {
							style: {
								display: "inline-flex",
								alignItems: "center",
								gap: 5
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageRing, { percent: usedPercent(w) }),
								usedPercent(w),
								"%",
								w.resetsAt !== void 0 && ` · ${translate("usageBadgeReset", { time: windowLabel(w) })}`
							]
						})]
					}, i)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: styles$1.tooltipHint,
						children: translate("usageBadgeOpenDetails")
					})
				]
			}), document.body),
			open && hostReactDom().createPortal(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: panelRef,
				id: panelId,
				role: "dialog",
				"aria-label": title,
				className: "waycraft-subscription-usage-panel",
				style: {
					...styles$1.panel,
					...pos ?? MEASURE_STYLE
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles$1.title,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: styles$1.titleLabel,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageBadgeIcon, {}), title]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "waycraft-subscription-usage-close",
							"aria-label": translate("usageBadgeClose"),
							onClick: close,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
								width: "16",
								height: "16",
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								"aria-hidden": true,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6 6 12 12M6 18 18 6" })
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: styles$1.titleRule,
						"aria-hidden": true
					}),
					expanded.map((d, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						style: index === 0 ? void 0 : styles$1.section,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: styles$1.providerRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: styles$1.providerName,
								children: [d.name, d.provider === current && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: styles$1.currentTag,
									children: translate("usageBadgeCurrent")
								})]
							}), d.accounts.length === 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountMeta, {
								account: d.accounts[0],
								translate
							})]
						}), d.accounts.map((account, accountIndex) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: accountIndex === 0 ? void 0 : styles$1.accountBlock,
							children: [d.accounts.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: styles$1.accountRow,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountMeta, {
									account,
									translate
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountWindows, {
								windows: account.windows,
								model: d.provider === badgeSelection?.provider ? badgeSelection.model : void 0,
								provider: d.provider,
								translate
							}, `${d.provider}:${badgeSelection?.model ?? ""}`)]
						}, account.key))]
					}, d.provider))
				]
			}), document.body)
		]
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [seat, statsRow !== null && statsRow.isConnected ? hostReactDom().createPortal(pill, statsRow) : pill] });
}
/**
* Nearest ancestor of the dock seat that can contain the host's stats row:
* the composer bar. Bounded so a badge in an unfamiliar layout never adopts
* some other composer's pills.
*/
function statsScopeOf(seat) {
	let node = seat.parentElement;
	for (let depth = 0; node !== null && depth < 4; depth++) {
		if (node.querySelector("[data-composer-stats]") !== null) return node;
		node = node.parentElement;
	}
	return seat.parentElement;
}
/**
* One account's handle and plan: `★ user@example.com · Plan: pro`. The star
* marks the default account (the one direct routes serve and the collapsed
* pill reads), the same glyph Settings → Subscriptions uses.
*/
function AccountMeta({ account, translate }) {
	const parts = [account.account, account.plan === void 0 ? void 0 : translate("usagePlan", { plan: account.plan })].filter((part) => part !== void 0 && part !== "");
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
		style: styles$1.providerMeta,
		title: account.account,
		children: [account.isDefault && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
			style: styles$1.defaultStar,
			"aria-label": translate("defaultAccount"),
			children: ["★", " "]
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 2
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("bdi", { children: parts[0] }), parts[1] && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: parts[1] })]
		})]
	});
}
/** Preview each account independently; all remaining quotas stay accessible. */
function AccountWindows({ windows, model, provider, translate }) {
	const { shown, hidden } = previewWindows(windows, model, provider);
	const rows = (items) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dl", {
		style: styles$1.details,
		children: items.map((w, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WindowRow, {
			label: `${usageWindowLabel(translate, w)}${model !== void 0 && w.scope === model ? ` · ${translate("usageBadgeCurrent")}` : ""}`,
			window: w
		}, i))
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [rows(shown), hidden.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
		style: styles$1.moreWindows,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", {
			style: styles$1.moreSummary,
			children: translate("usageBadgeMoreWindows", { count: hidden.length })
		}), rows(hidden)]
	})] });
}
function UsageRing({ percent }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 20 20",
		"aria-hidden": "true",
		style: {
			flexShrink: 0,
			transform: "rotate(-90deg)"
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
			cx: "10",
			cy: "10",
			r: "7",
			fill: "none",
			stroke: "var(--dsw-alias-border-l2)",
			strokeWidth: "3"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
			cx: "10",
			cy: "10",
			r: "7",
			fill: "none",
			stroke: usageBarColor(percent),
			strokeWidth: "3",
			pathLength: "100",
			strokeDasharray: `${percent} 100`
		})]
	});
}
/** One `dt`/`dd` pair: window name → `25% · 6d 1h`, with the bar underneath. */
function WindowRow({ label, window: w }) {
	const percent = usedPercent(w);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
			style: styles$1.dt,
			children: label
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
			style: styles$1.dd,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [percent, "%"] }), w.resetsAt !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				style: styles$1.reset,
				children: [" · ", windowLabel(w)]
			})]
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			role: "progressbar",
			"aria-label": label,
			"aria-valuenow": percent,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			style: styles$1.bar,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
				...styles$1.barFill,
				width: `${percent}%`,
				background: usageBarColor(percent)
			} })
		})
	] });
}
/**
* Unplaced portal panel: hidden but laid out so the clamp measures real
* dimensions (the `useAnchoredPosition` measure pass).
*/
const MEASURE_STYLE = {
	visibility: "hidden",
	left: 0,
	top: 0
};
const styles$1 = {
	seat: { display: "none" },
	anchor: {
		minWidth: 0,
		maxWidth: "min(100%, 100vw - 24px)",
		display: "inline-flex",
		flexShrink: 1
	},
	pill: {
		boxSizing: "border-box",
		minWidth: 0,
		maxWidth: "100%",
		color: "var(--dsw-alias-label-tertiary)",
		font: "inherit",
		fontSize: "calc(var(--dsh-content-font-size-secondary, 13px) - 1px)",
		fontVariantNumeric: "tabular-nums",
		lineHeight: "calc(20px + var(--dsh-content-font-delta-secondary, 0px))",
		whiteSpace: "nowrap",
		background: "transparent",
		border: "none",
		borderRadius: "var(--dsw-radius-sm, 8px)",
		alignItems: "center",
		gap: 6,
		padding: "1px 8px",
		display: "inline-flex",
		cursor: "pointer"
	},
	pillActive: {
		background: "var(--dsw-alias-interactive-bg-hover)",
		color: "var(--dsw-alias-label-secondary)"
	},
	label: {
		textOverflow: "ellipsis",
		minWidth: 0,
		overflow: "hidden"
	},
	panel: {
		position: "fixed",
		zIndex: 1100,
		boxSizing: "border-box",
		background: "var(--dsw-specific-menu, var(--dsw-alias-bg-overlay))",
		width: "min(400px, 100vw - 24px)",
		minWidth: 0,
		maxWidth: "calc(100vw - 24px)",
		maxHeight: "min(560px, 100dvh - 24px)",
		overflowY: "auto",
		overscrollBehavior: "contain",
		boxShadow: "var(--dsw-elevation-prominent)",
		color: "var(--dsw-alias-label-secondary)",
		cursor: "default",
		border: 0,
		borderRadius: "var(--dsw-radius-lg, 16px)",
		padding: 16,
		fontSize: 12,
		lineHeight: "18px"
	},
	tooltip: {
		position: "fixed",
		zIndex: 1101,
		boxSizing: "border-box",
		width: "min(300px, 100vw - 24px)",
		padding: "8px 10px",
		borderRadius: "var(--dsw-radius-lg, 16px)",
		background: "var(--dsw-specific-menu, var(--dsw-alias-bg-overlay))",
		boxShadow: "var(--dsw-elevation-prominent)",
		color: "var(--dsw-alias-label-secondary)",
		fontSize: 12,
		lineHeight: "18px",
		display: "flex",
		flexDirection: "column",
		gap: 4,
		overflowWrap: "anywhere",
		maxHeight: "calc(100dvh - 24px)",
		overflowY: "auto"
	},
	tooltipTitle: {
		color: "var(--dsw-alias-label-primary)",
		fontWeight: 500
	},
	tooltipRow: {
		display: "flex",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: "2px 8px",
		fontVariantNumeric: "tabular-nums"
	},
	tooltipHint: {
		color: "var(--dsw-alias-label-tertiary)",
		paddingBlockStart: 2
	},
	title: {
		color: "var(--dsw-alias-label-primary)",
		display: "flex",
		justifyContent: "space-between",
		gap: 16,
		marginBottom: 8,
		fontWeight: 500
	},
	titleLabel: {
		alignItems: "center",
		gap: 6,
		minWidth: 0,
		display: "inline-flex"
	},
	titleRule: {
		borderTop: "0.5px solid var(--dsw-alias-border-l2)",
		marginBottom: 10
	},
	section: {
		marginTop: 12,
		paddingTop: 10,
		borderTop: "0.5px solid var(--dsw-alias-border-l2)"
	},
	providerRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "baseline",
		flexWrap: "wrap",
		gap: "4px 12px",
		marginBottom: 8
	},
	providerName: {
		color: "var(--dsw-alias-label-primary)",
		fontWeight: 500,
		display: "inline-flex",
		flexWrap: "wrap",
		overflowWrap: "anywhere",
		alignItems: "center",
		gap: 6
	},
	currentTag: {
		fontSize: 10,
		lineHeight: "14px",
		fontWeight: 400,
		padding: "0 5px",
		borderRadius: 7,
		color: "var(--dsw-alias-label-secondary)",
		background: "var(--dsw-alias-interactive-bg-hover)"
	},
	providerMeta: {
		color: "var(--dsw-alias-label-tertiary)",
		minWidth: 0,
		overflowWrap: "anywhere",
		display: "inline-flex",
		alignItems: "baseline",
		gap: 4,
		fontSize: 11
	},
	defaultStar: { color: "var(--dsw-alias-state-warn-label)" },
	accountBlock: { marginTop: 8 },
	accountRow: {
		display: "flex",
		marginBottom: 4
	},
	details: {
		color: "var(--dsw-alias-label-tertiary)",
		display: "grid",
		gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
		gap: "4px 16px",
		margin: 0
	},
	moreWindows: { marginTop: 8 },
	moreSummary: {
		cursor: "pointer",
		color: "var(--dsw-alias-label-secondary)",
		marginBottom: 8
	},
	dt: {
		minWidth: 0,
		margin: 0,
		overflowWrap: "anywhere"
	},
	dd: {
		minWidth: 0,
		margin: 0,
		color: "var(--dsw-alias-label-secondary)",
		fontVariantNumeric: "tabular-nums",
		textAlign: "end",
		overflowWrap: "anywhere"
	},
	reset: { color: "var(--dsw-alias-label-tertiary)" },
	bar: {
		gridColumn: "1 / -1",
		height: 4,
		borderRadius: 2,
		overflow: "hidden",
		background: "var(--dsw-alias-border-l2)",
		marginBottom: 2
	},
	barFill: {
		height: "100%",
		borderRadius: 2
	}
};

//#endregion
//#region src/usage-badge/UsageBadgeDisplaySetting.tsx
/** Browser-local display preference; never changes provider or account settings. */
function UsageBadgeDisplaySetting({ t }) {
	const mode = useUsageBadgeMode();
	const [failed, setFailed] = (0, react.useState)(false);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles.card,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				style: styles.field,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("usageBadgeDisplay") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
					style: styles.select,
					"aria-label": t("usageBadgeDisplay"),
					value: mode,
					onChange: (event) => {
						const value = event.currentTarget.value;
						if (value !== "recent" && value !== "hidden") return;
						try {
							setUsageBadgeMode(value);
							setFailed(false);
						} catch (error) {
							if (!(error instanceof DOMException) || !["SecurityError", "QuotaExceededError"].includes(error.name)) throw error;
							setFailed(true);
						}
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: "recent",
						children: t("usageBadgeDisplayRecent")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: "hidden",
						children: t("usageBadgeDisplayHidden")
					})]
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles.hint,
				children: t("usageBadgeDisplayHint")
			}),
			failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "alert",
				style: {
					...styles.hint,
					color: "var(--dsw-alias-state-error-primary)"
				},
				children: t("usageBadgeDisplaySaveFailed")
			})
		]
	});
}
const styles = {
	card: {
		border: "0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4))",
		borderRadius: "var(--dsw-radius-xl, 20px)",
		background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
		padding: "12px 14px",
		display: "flex",
		flexDirection: "column",
		gap: 6
	},
	field: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		fontSize: 13,
		fontWeight: 500,
		lineHeight: "20px"
	},
	select: { width: "100%" },
	hint: {
		margin: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-tertiary)"
	}
};

//#endregion
//#region src/usage-badge/error-boundary.ts
function guarded(React, Component, label, report = (message, error) => console.error(message, error)) {
	class Boundary extends React.Component {
		state = { failed: false };
		static getDerivedStateFromError() {
			return { failed: true };
		}
		componentDidCatch(error) {
			report(`dsh-waycraft: ${label} failed to render`, error);
		}
		render() {
			return this.state.failed ? null : React.createElement(Component, this.props);
		}
	}
	const wrapped = (props) => React.createElement(Boundary, props);
	Object.defineProperty(wrapped, "name", { value: `Guarded${label.replace(/\W+/g, "")}` });
	return wrapped;
}

//#endregion
//#region src/browser.ts
function applySubscriptions(root) {
	const report = (error) => console.error("dsh-waycraft: Subscriptions setup failed", error);
	function isolate(callback) {
		try {
			const result = callback();
			if (result && typeof result.then === "function") return Promise.resolve(result).catch(report);
			return result;
		} catch (error) {
			report(error);
		}
	}
	isolate(() => root.inject([
		"connection",
		"slots",
		"locale"
	], (ctx) => isolate(() => {
		const connection = ctx.get("connection");
		const React = require("react");
		const h = React.createElement;
		const primitives$1 = require("@deepseek-ai/dsh-client-ui-primitives");
		const NS$1 = "waycraft.subscriptions";
		isolate(() => ctx.effect(() => isolate(() => ctx.locale.register(NS$1, {
			en: subscriptions$1,
			ar: subscriptions
		})), "dsh-waycraft: subscriptions dictionaries"));
		const t = ctx.locale.bind(NS$1);
		const CodexCard = createCodexCard(React, primitives$1, connection.rpc, t);
		const CopilotCard = guarded(React, createCopilotCard(React, primitives$1, connection.rpc, t), "Copilot card");
		const ClaudeCard = guarded(React, createClaudeCard(React, primitives$1, connection.rpc, t), "Claude card");
		const AntigravityCard = guarded(React, createAntigravityCard(React, primitives$1, connection.rpc, t), "Antigravity card");
		const ZenCard = guarded(React, createZenCard(React, primitives$1, connection.rpc, t), "Zen card");
		const GrokCard = guarded(React, createGrokCard(React, primitives$1, connection.rpc, t), "Grok card");
		const GuardedSetting = guarded(React, UsageBadgeDisplaySetting, "usage display setting");
		const GuardedProxy = guarded(React, ProxySettings, "proxy setting");
		const GuardedSpeed = guarded(React, SpeedSelect, "Speed control");
		const GuardedBadge = guarded(React, SubscriptionUsageBadge, "usage badge");
		const listeners = /* @__PURE__ */ new Set();
		let ApiProviders;
		const SubscriptionProviders = createApiProviders(React, null, t, primitives$1);
		isolate(() => ctx.inject([
			"remote",
			"remote.settings",
			"remote.credentials",
			"remote.llm"
		], (scope) => {
			ApiProviders = guarded(React, createApiProviders(React, scope.remote, t, primitives$1), "API providers");
			listeners.forEach((listener) => listener());
			return () => {
				ApiProviders = void 0;
				listeners.forEach((listener) => listener());
			};
		}));
		const providerCards = {
			codex: CodexCard,
			claude: ClaudeCard,
			grok: GrokCard,
			antigravity: AntigravityCard,
			copilot: CopilotCard
		};
		function UnifiedProviders() {
			const [status, setStatus] = React.useState(null);
			const [revision, setRevision] = React.useState(0);
			const [error, setError] = React.useState(false);
			const alive = React.useRef(true);
			const refresh = async () => {
				try {
					const answer = await connection.rpc.call("/api", "waycraft-subscriptions.status", {});
					if (!answer?.ok) throw new Error();
					if (alive.current) {
						setStatus(answer.value);
						setRevision((value) => value + 1);
						setError(false);
					}
				} catch {
					if (alive.current) setError(true);
				}
			};
			React.useEffect(() => {
				alive.current = true;
				refresh();
				return () => {
					alive.current = false;
				};
			}, []);
			const providers = Object.keys(providerCards).map((id) => ({
				id,
				name: {
					codex: "Codex (ChatGPT)",
					claude: "Claude",
					grok: "Grok",
					antigravity: "Antigravity",
					copilot: "GitHub Copilot"
				}[id]
			}));
			const rows = providers.filter(({ id }) => status?.providers?.[id]?.accounts?.length).map(({ id }, index) => h("li", {
				key: id,
				"data-waycraft-subscription-row": id
			}, h(providerCards[id], {
				presentation: "group",
				initialExpanded: index === 0,
				revision,
				onAccountsChange: refresh
			})));
			return h(React.Fragment, null, error ? h("p", { role: "alert" }, t("unreachable")) : null, h(SubscriptionProviders, {
				showAPI: false,
				showSubscriptionAdd: true,
				subscriptions: {
					rows,
					providers,
					renderAuth: (id, done, onFlowState) => id ? h(providerCards[id], {
						key: id,
						presentation: "auth",
						onFlowState,
						onComplete: () => {
							done();
							refresh();
						}
					}) : null
				}
			}), h("section", {
				"data-waycraft-provider-group": "free",
				className: "waycraft-provider-group",
				style: { marginBlockStart: 24 },
				"aria-label": t("freeProviders")
			}, h("h3", { className: "waycraft-provider-title" }, t("freeProviders")), h("ul", { className: "waycraft-api-rows" }, h("li", null, h(ZenCard)))));
		}
		let present = false;
		let failing = false;
		let referenceEnabled = false;
		let disposed = false;
		let sequence = 0;
		let withdraw;
		function Section() {
			React.useSyncExternalStore((fn) => {
				listeners.add(fn);
				return () => listeners.delete(fn);
			}, () => `${failing}:${referenceEnabled}:${!!ApiProviders}`);
			return h("div", {
				className: "waycraft-subscriptions-page",
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 24,
					maxInlineSize: 720,
					minInlineSize: 0,
					textAlign: "start",
					color: "var(--dsw-alias-label-primary)",
					fontSize: 14,
					lineHeight: "22px"
				}
			}, h("style", null, controlCss + `
          .waycraft-subscriptions-page .waycraft-page-settings>h3{margin:0;font-size:16px;line-height:24px;font-weight:500}
          .waycraft-subscriptions-page .waycraft-page-settings-content{display:flex;flex-direction:column;gap:12px;padding-block-start:12px}
          .waycraft-subscriptions-page .waycraft-proxy-settings{padding:14px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
          .waycraft-subscriptions-page .waycraft-proxy-settings header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
          .waycraft-subscriptions-page .waycraft-proxy-settings p{margin:8px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
        `), h("header", {
				className: "waycraft-providers-identity",
				style: {
					display: "flex",
					alignItems: "center",
					gap: 8
				}
			}, h("svg", {
				width: 20,
				height: 20,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true,
				style: { flexShrink: 0 }
			}, h("rect", {
				x: 8,
				y: 8,
				width: 8,
				height: 8,
				rx: 2
			}), h("path", { d: "M12 3v5m0 8v5M3 12h5m8 0h5M5 5l3 3m8 8 3 3M19 5l-3 3M8 16l-3 3" })), h("h2", { style: {
				margin: 0,
				fontSize: 18,
				lineHeight: "26px",
				fontWeight: 500,
				overflowWrap: "anywhere"
			} }, t("title"))), referenceEnabled ? h("p", { role: "status" }, t("coexistence")) : null, failing ? h("p", { role: "alert" }, t("unreachable")) : null, h("section", {
				"data-waycraft-settings": true,
				className: "waycraft-page-settings"
			}, h("h3", null, t("pageSettings")), h("div", { className: "waycraft-page-settings-content" }, h(GuardedProxy, {
				rpc: connection.rpc,
				t
			}), h(GuardedSetting, { t }))), h("section", { style: {
				display: "flex",
				flexDirection: "column",
				gap: 12,
				minInlineSize: 0
			} }, h("p", { style: {
				margin: 0,
				color: "var(--dsw-alias-label-secondary)",
				fontSize: 13,
				lineHeight: "20px"
			} }, t("providersHint")), h(UnifiedProviders)));
		}
		const models = () => ctx.get("modelDirectories");
		const surfaceWanted = () => !disposed && present && !referenceEnabled;
		const surfaces = [];
		let surfacesActive = false;
		function syncSurfaces() {
			if (surfaceWanted() && !surfacesActive) {
				surfacesActive = true;
				const add = (register) => isolate(() => {
					const off = register();
					if (typeof off === "function") surfaces.push(off);
				});
				for (const [name, view, inject] of [[
					"image_generate",
					ImageGenerateToolview,
					() => ({ load: createImageLoader(connection.rpc) })
				], [
					"video_generate",
					VideoGenerateToolview,
					() => ({ loadVideo: createVideoLoader(connection.rpc) })
				]]) for (const key of [
					name,
					`dsh_waycraft_${name}`,
					legacyToolviewKey(name)
				]) add(() => ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
					name: "tool.call.toolview",
					id: `waycraft-toolview-${key}`,
					key,
					locale: NS$1,
					inject
				}, guarded(React, view, name))));
				add(() => ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
					name: "conversation.input.right",
					id: "waycraft-subscription-speed",
					order: 0,
					locale: NS$1,
					inject: (sessionId) => ({
						loadSpeed: createSpeedLoader(connection, models, sessionId),
						setSpeed: createSpeedSetter(connection, sessionId)
					})
				}, GuardedSpeed)));
				add(() => ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
					name: "conversation.composer.dock",
					id: "waycraft-subscription-usage",
					order: 10,
					locale: NS$1,
					inject: (sessionId) => ({
						rpc: connection.rpc,
						currentModel: createCurrentModelReader(models, sessionId)
					})
				}, GuardedBadge)));
			} else if (!surfaceWanted() && surfacesActive) {
				surfacesActive = false;
				for (const off of surfaces.splice(0)) isolate(off);
			}
		}
		isolate(() => ctx.inject(["commandUi"], (scope) => isolate(() => {
			const command = scope.get("commandUi");
			scope.effect(() => command.register({
				name: "fast",
				description: fastCommandDescription(() => t("commandFast")),
				available: () => surfaceWanted(),
				ui: {
					kind: "popupSelect",
					options: async (session) => {
						if (!surfaceWanted()) throw new Error(t("commandFastUnavailable"));
						const state = await createSpeedLoader(connection, models, session.sessionId)();
						if (!state.visible) throw new Error(t("commandFastUnavailable"));
						return [{
							id: "standard",
							label: t("speedStandard"),
							detail: t("speedStandardDescription")
						}, {
							id: "fast",
							label: t("speedFast"),
							detail: t("speedFastDescription")
						}].map((option) => ({
							...option,
							active: option.id === state.tier
						}));
					},
					onSelect: async (option, session) => {
						if (!surfaceWanted()) return;
						await createSpeedSetter(connection, session.sessionId)(option.id);
					}
				}
			}), "dsh-waycraft: /fast contribution");
		})));
		function update() {
			isolate(syncSurfaces);
			if (present && !withdraw) withdraw = ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "waycraft-subscriptions",
				order: 90,
				label: () => t("title")
			}, Section));
			else if (!present && withdraw) {
				withdraw();
				withdraw = void 0;
			}
			listeners.forEach((listener) => listener());
		}
		async function probe() {
			const current = ++sequence;
			probeReference(current);
			try {
				const result = await connection.rpc.call("/api", "waycraft-subscriptions.status", {});
				if (disposed || current !== sequence) return;
				present = true;
				failing = !(result?.ok && result.value?.component === "subscriptions");
			} catch (error) {
				if (disposed || current !== sequence) return;
				if (error instanceof Error && error.message === "transport failure for /api/waycraft-subscriptions.status: HTTP 404") {
					present = false;
					failing = false;
				} else {
					present = true;
					failing = true;
				}
			}
			isolate(update);
		}
		async function probeReference(current) {
			let enabled = false;
			try {
				enabled = (await connection.rpc.call("/api", "subscriptions-auth.proxyGet", {}))?.ok === true;
			} catch {}
			if (disposed || current !== sequence) return;
			referenceEnabled = enabled;
			isolate(update);
		}
		isolate(() => ctx.effect(() => isolate(() => {
			probe();
			const unsubscribe = connection.state.subscribe(() => {
				if (connection.state.getSnapshot() === "connected") probe();
			});
			const timer = setInterval(() => {
				probe();
			}, 3e3);
			return () => {
				disposed = true;
				sequence++;
				clearInterval(timer);
				unsubscribe();
				isolate(syncSurfaces);
				withdraw?.();
				listeners.clear();
			};
		}), "dsh-waycraft: subscriptions presence"));
	})));
}

//#endregion
exports.applyMcp = applyMcp;
exports.applySkills = applySkills;
exports.applySubscriptions = applySubscriptions;
return module.exports; };