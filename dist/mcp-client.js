const waycraftMcpFactory = (require) => {
var module = { exports: {} }; var exports = module.exports;

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
	let primitives = {};
	try {
		primitives = require("@deepseek-ai/dsh-client-ui-primitives") || {};
	} catch {}
	function tooltip(label, anchor) {
		if (!primitives.Tooltip) return anchor;
		return h(primitives.Tooltip, {
			label,
			side: "bottom",
			portal: true
		}, React.cloneElement(anchor, { title: void 0 }));
	}
	const en = {
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
		en,
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
			if (primitives.useModalLayer) return;
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
		primitives.useModalLayer?.(ref, !confirmDiscard, requestClose);
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
		const onKeyDown = primitives.useModalLayer ? void 0 : (event) => {
			if (confirmDiscard) return;
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
	function useModal(onEscape, open = true) {
		const ref = React.useRef(null);
		primitives.useModalLayer?.(ref, open, onEscape);
		const [opener] = React.useState(() => typeof document !== "undefined" ? document.activeElement : null);
		React.useEffect(() => {
			if (primitives.useModalLayer) return;
			(ref.current?.querySelector?.(".waycraft-mcp-dialog-footer button:not([disabled])") || ref.current)?.focus?.();
			return () => {
				try {
					opener?.focus?.();
				} catch {}
			};
		}, []);
		return {
			ref,
			onKeyDown: primitives.useModalLayer ? void 0 : (event) => {
				if (!open) return;
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
			}
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
		const { ref, onKeyDown } = useModal(props.onClose, !props.suspended);
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
		const actions = React.Children.toArray(props.children).filter(Boolean);
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
		return h(primitives.Menu, {
			open,
			anchor,
			onClose: close,
			align: "end",
			portal: true,
			autoFocus: true,
			items: actions.map((child, i) => ({
				id: String(i),
				label: child.props["aria-label"],
				icon: child.props.children,
				disabled: child.props.disabled,
				danger: String(child.props.className || "").includes("danger")
			})),
			onSelect: (id) => {
				close();
				actions[Number(id)]?.props.onClick();
			}
		});
	}
	function MoreMenu(props) {
		return primitives.Menu ? h(NativeMoreMenu, props) : h(FallbackMoreMenu, props);
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
		if (primitives.Toast && notice.kind !== "err") return h(primitives.Toast, {
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
		const tabScope = React.useId();
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
			id: `${tabScope}-detail-tab-${id}`,
			"aria-controls": `${tabScope}-detail-panel-${id}`,
			"aria-selected": tab === id,
			tabIndex: tab === id ? 0 : -1,
			onKeyDown: (e) => {
				if ([
					"ArrowLeft",
					"ArrowRight",
					"Home",
					"End"
				].includes(e.key)) {
					e.preventDefault();
					const ids = [
						"overview",
						"tools",
						"configuration",
						"security"
					];
					const step = (e.key === "ArrowRight" ? 1 : -1) * (isArabic() ? -1 : 1);
					const next = e.key === "Home" ? 0 : e.key === "End" ? 3 : (ids.indexOf(id) + step + ids.length) % ids.length;
					setTab(ids[next]);
					e.currentTarget.parentElement?.querySelectorAll?.("[role=\"tab\"]")?.[next]?.focus?.();
				}
			},
			onClick: () => setTab(id)
		}, t(id === "security" ? "security" : id)))), tab === "overview" ? h("div", {
			role: "tabpanel",
			id: `${tabScope}-detail-panel-${tab}`,
			"aria-labelledby": `${tabScope}-detail-tab-${tab}`,
			className: "waycraft-mcp-panel"
		}, h("dl", { className: "waycraft-mcp-kv" }, h("dt", null, t("status")), h("dd", null, statusLabel(current$1)), h("dt", null, t("trustState")), h("dd", null, trustLabel(current$1.trust)), h("dt", null, t("transport")), h("dd", null, ltr(current$1.config?.transport)), h("dt", null, t("savedState")), h("dd", null, savedLabel(current$1)), h("dt", null, t("runtimeState")), h("dd", null, t("statusRestart")), h("dt", null, t("testOutcome")), h("dd", null, testLabel(testResults[current$1.serverName]?.config === configIdentity(current$1) ? testResults[current$1.serverName] : void 0)))) : null, tab === "tools" ? h("div", {
			role: "tabpanel",
			id: `${tabScope}-detail-panel-${tab}`,
			"aria-labelledby": `${tabScope}-detail-tab-${tab}`,
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
			id: `${tabScope}-detail-panel-${tab}`,
			"aria-labelledby": `${tabScope}-detail-tab-${tab}`,
			className: "waycraft-mcp-panel"
		}, h("pre", { className: "waycraft-mcp-pre" }, JSON.stringify(current$1.config || {}, null, 2)), current$1.limitation || current$1.trash?.limitation ? h("p", {
			role: "status",
			className: "waycraft-mcp-note"
		}, t("limitation"), ": ", current$1.limitation || current$1.trash?.limitation) : null) : null, tab === "security" ? h("div", {
			role: "tabpanel",
			id: `${tabScope}-detail-panel-${tab}`,
			"aria-labelledby": `${tabScope}-detail-tab-${tab}`,
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
			id: `${tabScope}-area-tab-${id}`,
			"aria-controls": `${tabScope}-area-panel-${id}`,
			"aria-selected": area === id,
			tabIndex: area === id ? 0 : -1,
			onKeyDown: (e) => {
				if ([
					"ArrowLeft",
					"ArrowRight",
					"Home",
					"End"
				].includes(e.key)) {
					e.preventDefault();
					const ids = [
						"servers",
						"discover",
						"trash"
					];
					const step = (e.key === "ArrowRight" ? 1 : -1) * (isArabic() ? -1 : 1);
					const next = e.key === "Home" ? 0 : e.key === "End" ? 2 : (ids.indexOf(id) + step + ids.length) % ids.length;
					setArea(ids[next]);
					e.currentTarget.parentElement?.querySelectorAll?.("[role=\"tab\"]")?.[next]?.focus?.();
				}
			},
			onClick: () => setArea(id)
		}, icon(ICON[id === "servers" ? "servers" : id === "discover" ? "search" : "trash"]), label, id === "trash" && trashed.length ? h("span", { className: "waycraft-mcp-badge" }, trashed.length) : ""))), area === "servers" ? h("div", {
			role: "tabpanel",
			id: `${tabScope}-area-panel-servers`,
			"aria-labelledby": `${tabScope}-area-tab-servers`
		}, serversArea) : null, form ? h(ServerFormDialog, {
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
		}, importArea) : null, area === "discover" ? h("div", {
			className: "waycraft-mcp-stack",
			role: "tabpanel",
			id: `${tabScope}-area-panel-discover`,
			"aria-labelledby": `${tabScope}-area-tab-discover`
		}, registryArea, h("details", null, h("summary", null, t("discoverTitle")), discoveryArea), h("button", {
			type: "button",
			onClick: () => setImportOpen(true)
		}, t("importTitle"))) : null, area === "trash" ? h("div", {
			role: "tabpanel",
			id: `${tabScope}-area-panel-trash`,
			"aria-labelledby": `${tabScope}-area-tab-trash`
		}, trashArea) : null, confirmUi);
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
exports.applyMcp = applyMcp;
return module.exports; };