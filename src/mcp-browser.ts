// Waycraft MCP Manager — browser-side server-centric UI (#174, #175).
// V1: read-only tool management, no Global/Project scope selectors, no per-tool controls.
// Discovery/import results are candidates only; explicit approval required; host auth enforced.
export function applyMcp(root: any): void {
  const fail = (error: unknown) =>
    console.error('dsh-waycraft: MCP manager setup failed', error);
  try {
    Promise.resolve(
      root.inject(['slots', 'locale', 'connection'], (ctx: any) => {
        try { setupMcp(ctx, fail); } catch (error) { fail(error); }
      }),
    ).catch(fail);
  } catch (error) { fail(error); }
}

const MCP_ROUTE = '/api/waycraft-mcp.manage';
const MCP_HEADER = 'x-waycraft-mcp';
const NS = 'waycraft.mcp';

function setupMcp(ctx: any, fail: (error: unknown) => void): void {
  const effect = (run: () => any, label: string) => {
    try { const r = ctx.effect(run, label); Promise.resolve(r).catch(fail); return r; }
    catch (error) { fail(error); }
  };
  const React = require('react');
  const h = React.createElement;

  const en = {
    title: 'MCP servers',
    description: 'Manage MCP servers for this DSH profile. Management actions require Owner authorization.',
    areaServers: 'Servers',
    areaDiscoverImport: 'Discover & Import',
    areaTrash: 'Trash',
    search: 'Search servers',
    filterAll: 'All',
    filterConnected: 'Connected (last test)',
    filterDisconnected: 'Disconnected (last test)',
    filterNeedsTrust: 'Needs trust review',
    filterTrashed: 'Trash',
    addServer: 'Add server',
    refresh: 'Refresh',
    empty: 'No MCP servers configured.',
    emptyTrash: 'Trash is empty.',
    loading: 'Loading MCP servers…',
    error: 'Unable to load MCP servers.',
    unauthorized: 'Owner authorization required. Paired clients cannot manage MCP servers.',
    retry: 'Retry',
    discoverTitle: 'Discover MCP configs',
    discoverNote: 'Scans only Owner-approved folders for known MCP config files. Results are candidates only; no servers are executed or activated.',
    discoverRoots: 'Approved search roots (one per line)',
    discoverScan: 'Scan approved roots',
    discoverEmpty: 'No discovery results yet.',
    discoverCandidate: 'Candidate',
    discoverMalformed: 'Malformed',
    discoverOversized: 'Oversized',
    discoverUnreadable: 'Unreadable',
    discoverSkipped: 'Skipped',
    discoverCandidatesNote: 'Candidates are presented for explicit review and registration. Discovery does not auto-activate servers.',
    importTitle: 'Import MCP configuration',
    importNote: 'Paste supported JSON. Preview is required before explicit registration approval. Import never executes servers and does not imply trust.',
    importJson: 'Import JSON',
    importPreview: 'Preview import',
    importApproveRegister: 'Register approved candidates',
    importNoPreview: 'Preview the import before registration.',
    importSelect: 'Approve',
    importConflictSkip: 'Skip existing',
    importConflictReplace: 'Replace existing (explicit)',
    importValid: 'Valid',
    importInvalid: 'Invalid',
    importConflict: 'Conflict',
    importCredRefs: 'Credential refs',
    importRegistered: 'Registration result',
    trashNote: 'Trash is operationally meaningful: trashed servers are inactive and removed from the active list. Restore revalidates trust; permanent delete requires explicit confirmation.',
    trashMoveAction: 'Move selected to Trash',
    trashRestoreAction: 'Restore selected',
    trashPermanentAction: 'Permanently delete selected',
    overview: 'Overview',
    tools: 'Tools',
    configuration: 'Configuration',
    security: 'Security & activity',
    status: 'Status',
    connectionState: 'Connection (observed)',
    trustState: 'Trust',
    ownership: 'Ownership',
    transport: 'Transport',
    actions: 'Actions',
    testConnection: 'Test connection',
    approveTrust: 'Approve reviewed config',
    trustInvalidated: 'Config changed; review and approve again before operational actions.',
    trustUntrusted: 'Untrusted. Saving does not imply trust.',
    trustTrusted: 'Trusted for reviewed config fingerprint.',
    moveToTrash: 'Move to Trash',
    restore: 'Restore',
    permanentDelete: 'Permanently delete',
    confirmTrash: 'Move this server to Trash? It becomes operationally inactive and can be restored.',
    confirmPermanent: 'Permanently delete this server configuration? This cannot be undone. Shared credential references are not deleted.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    configDesiredDisabled: 'Config disabled (desired state)',
    configDesiredEnabled: 'Config enabled (desired state)',
    runtimeNote: 'V1 shows server configuration, trust, and observed test results. It does not claim runtime tool enforcement guarantees beyond verified host behavior.',
    disconnectedNote: 'A disconnected/untested server is not implied to be permanently disabled.',
    readOnlyTools: 'Read-only. No per-tool enable/disable controls in V1.',
    noScopeSelectors: 'No Global/Project scope selectors in V1.',
    listTools: 'List cached tools',
    refreshTools: 'Refresh tools (explicit)',
    toolsNever: 'No cached enumeration yet. Use explicit refresh/test.',
    toolsFresh: 'Fresh',
    toolsStale: 'Stale',
    toolsError: 'Enumeration error',
    toolName: 'Tool',
    toolDescription: 'Description',
    schema: 'Input schema',
    noTools: 'No tools cached.',
    save: 'Save',
    serverName: 'Server name',
    command: 'Command',
    args: 'Arguments (JSON array)',
    url: 'URL',
    cwd: 'Working directory',
    limitation: 'Limitation',
    trashedAt: 'Moved to Trash',
    fingerprint: 'Reviewed fingerprint',
    conflict: 'Configuration changed externally. Reload before saving.',
    opSuccess: 'Done.',
    opFailed: 'Action failed.',
    ownershipWaycraft: 'Waycraft-managed',
    ownershipPreexisting: 'Pre-existing DSH config',
    ownershipOther: 'Externally owned',
    ownershipUnknown: 'Unknown',
    tabs: 'Server details',
    serverList: 'MCP server list',
    trashList: 'Trashed MCP servers',
  };
  const ar = {
    title: 'خوادم MCP',
    description: 'إدارة خوادم MCP لملف DSH هذا. إجراءات الإدارة تتطلب تفويض المالك.',
    areaServers: 'الخوادم',
    areaDiscoverImport: 'الاكتشاف والاستيراد',
    areaTrash: 'سلة المهملات',
    search: 'بحث في الخوادم',
    filterAll: 'الكل',
    filterConnected: 'متصل (آخر اختبار)',
    filterDisconnected: 'غير متصل (آخر اختبار)',
    filterNeedsTrust: 'يحتاج مراجعة الثقة',
    filterTrashed: 'سلة المهملات',
    addServer: 'إضافة خادم',
    refresh: 'تحديث',
    empty: 'لا توجد خوادم MCP مُهيأة.',
    emptyTrash: 'سلة المهملات فارغة.',
    loading: 'جارٍ تحميل خوادم MCP…',
    error: 'تعذّر تحميل خوادم MCP.',
    unauthorized: 'مطلوب تفويض المالك. لا يمكن للعملاء المقترنين إدارة خوادم MCP.',
    retry: 'إعادة المحاولة',
    discoverTitle: 'اكتشاف إعدادات MCP',
    discoverNote: 'يفحص فقط المجلدات التي وافق عليها المالك بحثًا عن ملفات إعداد MCP المعروفة. النتائج مرشحة فقط؛ لا يتم تنفيذ أي خادم أو تفعيله.',
    discoverRoots: 'جذور البحث المعتمدة (سطر لكل جذر)',
    discoverScan: 'فحص الجذور المعتمدة',
    discoverEmpty: 'لا توجد نتائج اكتشاف بعد.',
    discoverCandidate: 'مرشح',
    discoverMalformed: 'تالف',
    discoverOversized: 'كبير جدًا',
    discoverUnreadable: 'غير قابل للقراءة',
    discoverSkipped: 'تم التخطي',
    discoverCandidatesNote: 'تُعرض المرشحات للمراجعة والتسجيل الصريح. الاكتشاف لا يفعّل الخوادم تلقائيًا.',
    importTitle: 'استيراد إعداد MCP',
    importNote: 'ألصق JSON مدعومًا. المعاينة مطلوبة قبل موافقة التسجيل الصريحة. الاستيراد لا ينفّذ الخوادم ولا يعني الثقة.',
    importJson: 'JSON للاستيراد',
    importPreview: 'معاينة الاستيراد',
    importApproveRegister: 'تسجيل المرشحين المعتمدين',
    importNoPreview: 'عاين الاستيراد قبل التسجيل.',
    importSelect: 'اعتماد',
    importConflictSkip: 'تخطي الموجود',
    importConflictReplace: 'استبدال الموجود (صريح)',
    importValid: 'صالح',
    importInvalid: 'غير صالح',
    importConflict: 'تعارض',
    importCredRefs: 'مراجع الاعتماد',
    importRegistered: 'نتيجة التسجيل',
    trashNote: 'سلة المهملات ذات معنى تشغيلي: الخوادم المنقولة إليها غير نشطة ومزالة من القائمة النشطة. الاستعادة تعيد التحقق من الثقة؛ الحذف النهائي يتطلب تأكيدًا صريحًا.',
    trashMoveAction: 'نقل المحدد إلى سلة المهملات',
    trashRestoreAction: 'استعادة المحدد',
    trashPermanentAction: 'حذف المحدد نهائيًا',
    overview: 'نظرة عامة',
    tools: 'الأدوات',
    configuration: 'الإعدادات',
    security: 'الأمان والنشاط',
    status: 'الحالة',
    connectionState: 'الاتصال (مُلاحظ)',
    trustState: 'الثقة',
    ownership: 'الملكية',
    transport: 'النقل',
    actions: 'الإجراءات',
    testConnection: 'اختبار الاتصال',
    approveTrust: 'اعتماد الإعداد المُراجع',
    trustInvalidated: 'تغيّر الإعداد؛ راجع واعتمد مرة أخرى قبل الإجراءات التشغيلية.',
    trustUntrusted: 'غير موثوق. الحفظ لا يعني الثقة.',
    trustTrusted: 'موثوق لبصمة الإعداد المُراجَع.',
    moveToTrash: 'نقل إلى سلة المهملات',
    restore: 'استعادة',
    permanentDelete: 'حذف نهائي',
    confirmTrash: 'نقل هذا الخادم إلى سلة المهملات؟ سيصبح غير نشط تشغيليًا ويمكن استعادته.',
    confirmPermanent: 'حذف إعداد هذا الخادم نهائيًا؟ لا يمكن التراجع. لن تُحذف مراجع بيانات الاعتماد المشتركة.',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    configDesiredDisabled: 'الإعداد معطّل (حالة مرغوبة)',
    configDesiredEnabled: 'الإعداد مفعّل (حالة مرغوبة)',
    runtimeNote: 'يعرض V1 إعداد الخادم والثقة ونتائج الاختبار الملاحظة. ولا يدّعي ضمانات تنفيذ أدوات وقت التشغيل خارج السلوك المضيف المُتحقق منه.',
    disconnectedNote: 'الخادم غير المتصل/غير المختبَر لا يعني أنه معطّل نهائيًا.',
    readOnlyTools: 'للقراءة فقط. لا توجد عناصر تحكم تفعيل/تعطيل لكل أداة في V1.',
    noScopeSelectors: 'لا توجد محددات نطاق عام/مشروع في V1.',
    listTools: 'عرض الأدوات المخزنة مؤقتًا',
    refreshTools: 'تحديث الأدوات (صريح)',
    toolsNever: 'لا يوجد تعداد مخزن مؤقتًا بعد. استخدم التحديث/الاختبار الصريح.',
    toolsFresh: 'حديث',
    toolsStale: 'قديم',
    toolsError: 'خطأ في التعداد',
    toolName: 'الأداة',
    toolDescription: 'الوصف',
    schema: 'مخطط الإدخال',
    noTools: 'لا توجد أدوات مخزنة مؤقتًا.',
    save: 'حفظ',
    serverName: 'اسم الخادم',
    command: 'الأمر',
    args: 'المعاملات (مصفوفة JSON)',
    url: 'الرابط',
    cwd: 'مجلد العمل',
    limitation: 'قيد',
    trashedAt: 'نُقل إلى سلة المهملات',
    fingerprint: 'بصمة المراجعة',
    conflict: 'تغيّر الإعداد خارجيًا. أعد التحميل قبل الحفظ.',
    opSuccess: 'تم.',
    opFailed: 'فشل الإجراء.',
    ownershipWaycraft: 'تُديره Waycraft',
    ownershipPreexisting: 'إعداد DSH موجود مسبقًا',
    ownershipOther: 'مملوك خارجيًا',
    ownershipUnknown: 'غير معروف',
    tabs: 'تفاصيل الخادم',
    serverList: 'قائمة خوادم MCP',
    trashList: 'خوادم MCP في سلة المهملات',
  };

  effect(() => ctx.locale.register(NS, { en, ar }), 'dsh-waycraft: mcp dictionaries');
  const t = ctx.locale.bind(NS);
  const isArabic = () => ctx.locale.language?.getSnapshot?.() === 'ar';

  async function rpc(action: string, body: any = {}) {
    const response = await fetch(MCP_ROUTE, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [MCP_HEADER]: '1' },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      const err: any = new Error(data?.error || 'unauthorized');
      err.code = data?.code || 'unauthorized'; err.status = response.status; err.data = data; throw err;
    }
    if (!response.ok || data?.ok === false) {
      const err: any = new Error(data?.error || data?.message || `HTTP ${response.status}`);
      err.code = data?.code; err.status = response.status; err.data = data; throw err;
    }
    return data;
  }

  function ltr(value: any) { return h('bdi', { dir: 'ltr', style: { unicodeBidi: 'isolate' } }, value == null ? '' : String(value)); }
  function statusLabel(server: any) {
    if (server?.trash?.trashed) return t('filterTrashed');
    if (server?.disabled) return t('configDesiredDisabled');
    return t('configDesiredEnabled');
  }
  function trustLabel(trust: any) {
    const st = trust?.status;
    if (st === 'trusted') return t('trustTrusted');
    if (st === 'invalidated') return t('trustInvalidated');
    return t('trustUntrusted');
  }
  function ownershipLabel(o: string) {
    if (o === 'waycraft') return t('ownershipWaycraft');
    if (o === 'preexisting-dsh') return t('ownershipPreexisting');
    if (o === 'other') return t('ownershipOther');
    return t('ownershipUnknown');
  }

  const STYLE = `
/* ===== Base & tokens (aligned with waycraft-skills) ===== */
.waycraft-mcp{container-type:inline-size;inline-size:100%;max-inline-size:720px;min-inline-size:0;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.waycraft-mcp *{box-sizing:border-box;min-inline-size:0}
.waycraft-mcp bdi{unicode-bidi:isolate;direction:ltr}

/* ===== Header ===== */
.waycraft-mcp-header{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-mcp-title{margin:0;flex:1 1 auto;font-size:18px;line-height:26px;font-weight:600;color:var(--dsw-alias-label-primary)}

/* ===== Toolbar / filters ===== */
.waycraft-mcp-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.waycraft-mcp-toolbar input{min-block-size:32px;padding-inline:12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}
.waycraft-mcp-toolbar input::placeholder{color:var(--dsw-alias-label-tertiary)}
.waycraft-mcp-toolbar select{appearance:none;-webkit-appearance:none;block-size:32px;min-block-size:32px;padding-block:0;padding-inline:12px 32px;border-radius:var(--dsw-radius-md,12px);background-color:var(--dsw-alias-bg-layer-1);background-repeat:no-repeat;background-position:calc(100% - 15px) 14px,calc(100% - 10px) 14px;background-size:5px 5px,5px 5px;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-tertiary) 50%),linear-gradient(135deg,var(--dsw-alias-label-tertiary) 50%,transparent 50%);max-inline-size:100%;cursor:pointer;font:inherit;color:inherit;border:0.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2))}
.waycraft-mcp-toolbar select:dir(rtl),.waycraft-mcp-toolbar [dir=rtl] select{background-position:15px 14px,10px 14px;padding-inline:32px 12px}
.waycraft-mcp-toolbar select:focus{border-color:var(--dsw-alias-state-business-primary)}
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
.waycraft-mcp-seg button[aria-pressed="true"]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-weight:600}
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
.waycraft-mcp-field-error{margin:0;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-state-error-bg,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}
.waycraft-mcp-confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px;border:0.5px solid var(--dsw-alias-state-error-primary, var(--dsw-alias-border-l2));border-radius:10px}

/* ===== Badges ===== */
.waycraft-mcp-badge{white-space:nowrap;display:inline-flex;align-items:center;gap:4px;padding-inline:8px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xs,4px);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-weight:400}
.waycraft-mcp-badge-warn{background:var(--dsw-alias-state-warning-bg,var(--dsw-alias-bg-layer-3));border-color:var(--dsw-alias-state-warning-border,var(--dsw-alias-border-l2));color:var(--dsw-alias-state-warning-primary)}

/* ===== Switch (toggle) ===== */
.waycraft-mcp-switch{box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:flex-start;flex:0 0 auto;inline-size:36px;min-inline-size:36px;block-size:20px;min-block-size:0;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);font-size:0;line-height:0;cursor:pointer}
.waycraft-mcp-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}
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

/* ===== Stats ===== */
.waycraft-mcp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-mcp-stat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.waycraft-mcp-stat+.waycraft-mcp-stat{border-inline-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-mcp-stat strong{font-size:18px;line-height:26px;color:var(--dsw-alias-label-primary)}

/* ===== Source card ===== */
.waycraft-mcp-source{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-mcp-source>summary{display:flex;align-items:center;gap:8px;min-block-size:44px;padding:8px 16px;cursor:pointer;font-weight:600;list-style:none}
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

  function McpPanel() {
    const [state, setState] = React.useState({ kind: 'loading' } as any);
    const [servers, setServers] = React.useState([] as any[]);
    const [trashed, setTrashed] = React.useState([] as any[]);
    const [fingerprint, setFingerprint] = React.useState('');
    const [area, setArea] = React.useState('servers'); // servers | discover | trash
    const [filter, setFilter] = React.useState('all');
    const [query, setQuery] = React.useState('');
    const [selected, setSelected] = React.useState(null as string|null);
    const [tab, setTab] = React.useState('overview');
    const [busy, setBusy] = React.useState('');
    const [notice, setNotice] = React.useState(null as any);
    const [confirm, setConfirmState] = React.useState(null as any);
    const [toolCache, setToolCache] = React.useState({} as Record<string,any>);
    // #175 discovery/import (candidates only, explicit approval, no auto-activation)
    const [discoverRoots, setDiscoverRoots] = React.useState('');
    const [discovery, setDiscovery] = React.useState(null as any);
    const [importText, setImportText] = React.useState('');
    const [importPreview, setImportPreview] = React.useState(null as any);
    const [importApprovals, setImportApprovals] = React.useState({} as Record<string,{approved:boolean,onConflict:'skip'|'replace'}>);
    const [importResult, setImportResult] = React.useState(null as any);
    const alive = React.useRef(true);

    const load = React.useCallback(async () => {
      if (state.kind === 'loading' || servers.length === 0) setState({ kind: 'loading' });
      setNotice(null);
      try {
        const data = await rpc('list');
        if (!alive.current) return;
        setServers(Array.isArray(data.servers) ? data.servers : []);
        setTrashed(Array.isArray(data.trashedServers) ? data.trashedServers : []);
        setFingerprint(data.fingerprint || '');
        setState({ kind: 'ready' });
      } catch (e: any) {
        if (!alive.current) return;
        if (e?.code === 'unauthorized' || e?.status === 401 || e?.status === 403) setState({ kind: 'unauthorized' });
        else setState({ kind: 'error', message: e?.message || '' });
      }
    }, []);

    React.useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; }; }, [load]);

    const run = async (label: string, fn: () => Promise<any>, after?: (d:any)=>void) => {
      setBusy(label); setNotice(null);
      try { const d = await fn(); if (!alive.current) return; after?.(d); setNotice({ kind: 'ok', text: t('opSuccess') }); await load(); }
      catch (e: any) {
        if (!alive.current) return;
        const preview = e?.data?.preview;
        if (preview) setImportPreview(preview);
        const issue = preview?.issues?.[0]?.message;
        setNotice({ kind: 'err', text: issue ? `${e?.message || t('opFailed')}: ${issue}` : (e?.message || t('opFailed')), code: e?.code || (e?.status ? `HTTP ${e.status}` : undefined) });
      }
      finally { if (alive.current) setBusy(''); }
    };

    const matches = (s: any) => {
      const q = query.trim().toLowerCase();
      if (q && !String(s.serverName||'').toLowerCase().includes(q)) return false;
      if (filter === 'all') return true;
      if (filter === 'needsTrust') return ['untrusted','invalidated'].includes(s.trust?.status);
      return true;
    };
    const visibleServers = servers.filter(matches);
    const current = servers.find((s:any)=>s.serverName===selected) || visibleServers[0] || trashed.find((s:any)=>s.serverName===selected) || null;

    if (state.kind === 'loading') return h('div', { className: 'waycraft-mcp', dir: isArabic()?'rtl':'ltr' }, h('style', null, STYLE), h('p', { role: 'status' }, t('loading')));
    if (state.kind === 'unauthorized') return h('div', { className: 'waycraft-mcp', dir: isArabic()?'rtl':'ltr' }, h('style', null, STYLE), h('p', { role: 'alert' }, t('unauthorized')));
    if (state.kind === 'error') return h('div', { className: 'waycraft-mcp', dir: isArabic()?'rtl':'ltr' }, h('style', null, STYLE), h('p', { role: 'alert' }, t('error')), h('p', { className: 'waycraft-mcp-note' }, ltr(state.message||'')), h('button', { type: 'button', onClick: load }, t('retry')));

    const confirmUi = confirm ? h('div', { className: 'waycraft-mcp-confirm', role: 'alertdialog', 'aria-label': confirm.label },
      h('span', null, confirm.label),
      h('button', { type: 'button', className: confirm.danger ? 'waycraft-mcp-danger' : '', disabled: !!busy, onClick: () => { const c=confirm; setConfirmState(null); void run(c.label, c.fn); } }, t('confirm')),
      h('button', { type: 'button', disabled: !!busy, onClick: () => setConfirmState(null) }, t('cancel')),
    ) : null;

    const renderCandidate = (c:any, key:string) => h('li', { key, className: 'waycraft-mcp-panel' },
      h('div', { className: 'waycraft-mcp-row' },
        h('strong', null, ltr(c.serverName)),
        h('span', { className: 'waycraft-mcp-meta' }, c.valid ? t('importValid') : t('importInvalid'), c.conflict ? ` · ${t('importConflict')}` : '', c.credentialRefs?.length ? ` · ${t('importCredRefs')}: ${c.credentialRefs.length}` : '')),
      c.conflict ? h('p', { className: 'waycraft-mcp-note', role: 'status' }, c.conflict.message || t('importConflict')) : null,
      c.scopeNote ? h('p', { className: 'waycraft-mcp-note' }, c.scopeNote) : null,
      c.issues?.length ? h('p', { className: 'waycraft-mcp-note', role: 'status' }, c.issues.map((i:any)=>i.message||i.code).join('; ')) : null,
      h('label', { style: { display:'flex', gap:'8px', alignItems:'center' } },
        h('input', { type: 'checkbox', checked: !!importApprovals[c.serverName]?.approved, disabled: !c.valid, onChange: (e:any)=>setImportApprovals((m:any)=>({ ...m, [c.serverName]: { approved: e.target.checked, onConflict: m[c.serverName]?.onConflict || 'skip' } })) }),
        t('importSelect')),
      c.conflict?.kind === 'duplicate_existing' ? h('select', { 'aria-label': t('importConflict'), value: importApprovals[c.serverName]?.onConflict || 'skip', onChange: (e:any)=>setImportApprovals((m:any)=>({ ...m, [c.serverName]: { approved: !!m[c.serverName]?.approved, onConflict: e.target.value } })) },
        h('option', { value: 'skip' }, t('importConflictSkip')), h('option', { value: 'replace' }, t('importConflictReplace'))) : null,
      h('pre', { className: 'waycraft-mcp-pre' }, JSON.stringify(c.config||{}, null, 2))
    );

    const discoveryArea = h('section', { 'aria-label': t('discoverTitle'), className: 'waycraft-mcp-card' },
      h('div', { className: 'waycraft-mcp-card-body' },
        h('strong', null, t('discoverTitle')),
        h('p', { className: 'waycraft-mcp-notice' }, t('discoverNote')),
        h('p', { className: 'waycraft-mcp-notice' }, t('discoverCandidatesNote')),
        h('label', null, t('discoverRoots'), h('textarea', { value: discoverRoots, onInput: (e:any)=>setDiscoverRoots(e.target.value), rows: 3, style: { width:'100%', minBlockSize:'72px', padding:'8px', border:'0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2)', borderRadius:'var(--dsw-radius-md,12px)', background:'var(--dsw-alias-bg-layer-1)', color:'inherit', direction:'ltr', font:'inherit' } })),
        h('div', { className: 'waycraft-mcp-row' },
          h('button', { type: 'button', disabled: !!busy, onClick: () => void run('discover', async () => {
            const roots = discoverRoots.split(/\n+/).map((s:string)=>s.trim()).filter(Boolean);
            if (!roots.length) throw new Error(t('discoverRoots'));
            const d = await rpc('discover', { roots });
            setDiscovery(d.discovery || d);
            return d;
          }) }, t('discoverScan'))),
      ),
      discovery ? h('div', { className: 'waycraft-mcp-card' },
        h('div', { className: 'waycraft-mcp-card-body' },
          h('p', { className: 'waycraft-mcp-meta' }, t('discoverCandidate'), ': ', String(discovery.stats?.candidates||0), ' · ', t('discoverMalformed'), ': ', String(discovery.stats?.malformed||0), ' · ', t('discoverOversized'), ': ', String(discovery.stats?.oversized||0)),
          (discovery.files||[]).length ? (discovery.files||[]).map((f:any,i:number)=>h('article', { key: f.path||i, className: 'waycraft-mcp-card' },
            h('div', { className: 'waycraft-mcp-card-body' },
              h('div', { className: 'waycraft-mcp-row' }, h('strong', null, ltr(f.relativePath||f.path||'')), h('span', { className: 'waycraft-mcp-meta' }, f.status)),
              f.message ? h('p', { className: 'waycraft-mcp-notice' }, f.message) : null,
              f.preview?.candidates?.length ? h('ul', { className: 'waycraft-mcp-list' }, f.preview.candidates.map((c:any,j:number)=>renderCandidate(c, `${f.path}:${j}`))) : null
            )
          )) : h('p', { className: 'waycraft-mcp-notice' }, t('discoverEmpty'))
        )
      ) : h('p', { className: 'waycraft-mcp-notice' }, t('discoverEmpty'))
    );

    const importArea = h('section', { 'aria-label': t('importTitle'), className: 'waycraft-mcp-card' },
      h('div', { className: 'waycraft-mcp-card-body' },
        h('strong', null, t('importTitle')),
        h('p', { className: 'waycraft-mcp-notice' }, t('importNote')),
        h('label', null, t('importJson'), h('textarea', { value: importText, onInput: (e:any)=>{ setImportText(e.target.value); setImportPreview(null); setImportResult(null); }, rows: 6, style: { width:'100%', minBlockSize:'120px', padding:'8px', border:'0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2)', borderRadius:'var(--dsw-radius-md,12px)', background:'var(--dsw-alias-bg-layer-1)', color:'inherit', direction:'ltr', font:'12px/18px monospace' } })),
        h('div', { className: 'waycraft-mcp-row' },
          h('button', { type: 'button', disabled: !!busy, onClick: () => void run('import-preview', async () => {
            let input:any = importText;
            try { input = JSON.parse(importText); } catch {}
            const d = await rpc('import_preview', { input });
            setImportPreview(d.preview || d);
            setImportApprovals({});
            setImportResult(null);
            return d;
          }) }, t('importPreview')),
          h('button', { type: 'button', className: 'waycraft-mcp-primary', disabled: !!busy || !importPreview?.ok, onClick: () => void run('import-register', async () => {
            const approvals = Object.entries(importApprovals).filter(([,v]:any)=>v?.approved).map(([serverName,v]:any)=>({ serverName, approved: true, onConflict: v.onConflict || 'skip' }));
            if (!approvals.length) throw new Error(t('importNoPreview'));
            const d = await rpc('import_register', { preview: importPreview, approvals });
            setImportResult(d.import || d);
            setImportPreview(null); setImportApprovals({});
            return d;
          }) }, t('importApproveRegister'))),
      ),
      !importPreview ? h('p', { className: 'waycraft-mcp-notice' }, t('importNoPreview')) : h('div', { className: 'waycraft-mcp-card' },
        h('div', { className: 'waycraft-mcp-card-body' },
          h('p', { className: 'waycraft-mcp-meta' }, t('importValid'), ': ', String(importPreview.stats?.valid||0), ' · ', t('importInvalid'), ': ', String(importPreview.stats?.invalid||0), ' · ', t('importConflict'), ': ', String(importPreview.stats?.conflicts||0)),
          importPreview.scope?.note ? h('p', { className: 'waycraft-mcp-notice' }, importPreview.scope.note) : null,
          (importPreview.issues||[]).length ? h('div', { role: 'alert', className: 'waycraft-mcp-alert' }, (importPreview.issues||[]).map((iss:any,i:number)=>h('div',{key:i}, ltr(iss.path||''), iss.path?': ':'', iss.message||String(iss)))) : null,
          h('ul', { className: 'waycraft-mcp-list' }, (importPreview.candidates||[]).map((c:any,i:number)=>renderCandidate(c, `import:${i}`)))),
        ),
      importResult ? h('div', { role: 'status', className: 'waycraft-mcp-alert' }, t('importRegistered'), ': ', ltr(JSON.stringify(importResult.stats||importResult))) : null
    );

    const switchControl = (props: { checked: boolean; disabled?: boolean; label: string; onToggle: () => void; bare?: boolean; text?: string }) =>
      h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': props.checked,
        'aria-disabled': props.disabled,
        'aria-label': props.label,
        className: 'waycraft-mcp-switch' + (props.bare ? '' : ''),
        disabled: props.disabled,
        onClick: props.onToggle,
      }, h('span', { className: 'waycraft-mcp-switch-thumb', 'aria-hidden': 'true' }));

    const serverRow = (s:any, inTrash:boolean) => h('article', { key: s.serverName, className: 'waycraft-mcp-card', 'data-waycraft-server': s.serverName },
      h('div', { className: 'waycraft-mcp-card-body' },
        h('div', { className: 'waycraft-mcp-row' },
          h('div', { className: 'waycraft-mcp-row-main' },
            h('div', { className: 'waycraft-mcp-row-title' },
              h('strong', null, ltr(s.serverName)),
              s.trash?.trashed ? h('span', { className: 'waycraft-mcp-badge waycraft-mcp-badge-warn' }, t('filterTrashed')) : null,
              !s.trash?.trashed && s.disabled ? h('span', { className: 'waycraft-mcp-badge waycraft-mcp-badge-warn' }, t('configDesiredDisabled')) : null,
            ),
            h('p', { className: 'waycraft-mcp-row-desc' }, t('ownership'), ': ', ownershipLabel(s.ownership), ' · ', t('transport'), ': ', ltr(s.config?.transport)),
          ),
          h('div', { className: 'waycraft-mcp-row-actions' },
            !inTrash
              ? h(React.Fragment, null,
                  h('button', { type: 'button', disabled: !!busy, onClick: () => { setSelected(s.serverName); setTab('overview'); setArea('servers'); }, 'aria-pressed': selected===s.serverName }, t('overview')),
                  h('button', { type: 'button', disabled: !!busy, onClick: () => void run('test', () => rpc('test_connection', { serverName: s.serverName, expectedFingerprint: fingerprint }), (d)=>setToolCache((m:any)=>({...m,[s.serverName]:d.test||m[s.serverName]}))) }, t('testConnection')),
                  ['untrusted','invalidated'].includes(s.trust?.status) ? h('button', { type: 'button', disabled: !!busy, onClick: () => void run('trust', () => rpc('approve_trust', { serverName: s.serverName, reviewedConfigFingerprint: s.reviewedConfigFingerprint, expectedFingerprint: fingerprint })) }, t('approveTrust')) : null,
                  h('button', { type: 'button', className: 'waycraft-mcp-danger', disabled: !!busy, onClick: () => setConfirmState({ label: t('confirmTrash'), danger: true, fn: () => rpc('trash', { serverName: s.serverName, expectedFingerprint: fingerprint }) }) }, t('moveToTrash')),
                  switchControl({ checked: !s.disabled, disabled: !!busy, label: `${t('toggle')}: ${s.serverName}`, onToggle: () => rpc('update', { serverName: s.serverName, expectedFingerprint: fingerprint, disabled: !s.disabled }), bare: true }),
                )
              : h(React.Fragment, null,
                  h('button', { type: 'button', disabled: !!busy, onClick: () => setConfirmState({ label: `${t('restore')}: ${s.serverName}?`, fn: () => rpc('restore', { serverName: s.serverName, expectedFingerprint: fingerprint }) }) }, t('restore')),
                  h('button', { type: 'button', className: 'waycraft-mcp-danger', disabled: !!busy, onClick: () => setConfirmState({ label: t('confirmPermanent'), danger: true, fn: () => rpc('permanent_delete', { serverName: s.serverName, expectedFingerprint: fingerprint, confirm: true }) }) }, t('permanentDelete')),
                )
          ),
        ),
        h('dl', { className: 'waycraft-mcp-meta' },
          h('dt', null, t('trustState')), h('dd', null, trustLabel(s.trust)),
        ),
      )
    );

    const detail = (area === 'servers' && current && !current.trash?.trashed) ? h('section', { 'aria-label': t('tabs'), className: 'waycraft-mcp-card' },
      h('div', { className: 'waycraft-mcp-card-body' },
        h('div', { className: 'waycraft-mcp-row' }, h('strong', null, ltr(current.serverName)), h('span', { className: 'waycraft-mcp-meta' }, ownershipLabel(current.ownership))),
        h('div', { className: 'waycraft-mcp-seg', role: 'tablist', 'aria-label': t('tabs') },
          ['overview','tools','configuration','security'].map(id => h('button', { key: id, type: 'button', role: 'tab', 'aria-selected': tab===id, tabIndex: tab===id?0:-1, onClick: ()=>setTab(id) }, t(id==='security'?'security':id)))),
        tab === 'overview' ? h('div', { role: 'tabpanel', className: 'waycraft-mcp-panel' },
        h('dl', { className: 'waycraft-mcp-kv' },
          h('dt',null,t('status')), h('dd',null,statusLabel(current)),
          h('dt',null,t('trustState')), h('dd',null,trustLabel(current.trust)),
          h('dt',null,t('transport')), h('dd',null,ltr(current.config?.transport)),
          h('dt',null,t('connectionState')), h('dd',null,t('disconnectedNote')),
        ),
        h('p', { className: 'waycraft-mcp-note' }, t('runtimeNote')),
        h('p', { className: 'waycraft-mcp-note' }, t('noScopeSelectors')),
      ) : null,
      tab === 'tools' ? h('div', { role: 'tabpanel', className: 'waycraft-mcp-panel' },
        h('p', { className: 'waycraft-mcp-note' }, t('readOnlyTools')),
        h('div', { className: 'waycraft-mcp-row' },
          h('button', { type: 'button', disabled: !!busy || !!current.trash?.trashed, onClick: () => void run('tools', async () => { const d = await rpc('list_tools', { serverName: current.serverName }); setToolCache((m:any)=>({...m,[current.serverName]:d})); return d; }) }, t('listTools')),
          h('button', { type: 'button', disabled: !!busy || !!current.trash?.trashed, onClick: () => void run('refresh', async () => { const d = await rpc('refresh_tools', { serverName: current.serverName, expectedFingerprint: fingerprint }); setToolCache((m:any)=>({...m,[current.serverName]:d})); return d; }) }, t('refreshTools'))),
        (() => { const tc = toolCache[current.serverName]; const tools = tc?.tools || tc?.cache?.tools || []; if (!tc) return h('p',{className:'waycraft-mcp-note'},t('toolsNever')); if (!tools.length) return h('p',{className:'waycraft-mcp-note'},t('noTools')); return h('div',{className:'waycraft-mcp-tools'}, h('table',null, h('thead',null,h('tr',null,h('th',null,t('toolName')),h('th',null,t('toolDescription')))), h('tbody',null,...tools.map((tool:any)=>h('tr',{key:tool.name},h('td',null,ltr(tool.name)),h('td',null,tool.description||'')))))); })()
      ) : null,
      tab === 'configuration' ? h('div', { role: 'tabpanel', className: 'waycraft-mcp-panel' },
        h('pre', { className: 'waycraft-mcp-pre' }, JSON.stringify(current.config||{}, null, 2)),
        current.limitation || current.trash?.limitation ? h('p', { role: 'status', className: 'waycraft-mcp-note' }, t('limitation'), ': ', current.limitation || current.trash?.limitation) : null
      ) : null,
      tab === 'security' ? h('div', { role: 'tabpanel', className: 'waycraft-mcp-panel' },
        h('dl', { className: 'waycraft-mcp-kv' },
          h('dt',null,t('trustState')), h('dd',null,trustLabel(current.trust)),
          h('dt',null,t('fingerprint')), h('dd',null,ltr(current.reviewedConfigFingerprint || current.trust?.reviewedFingerprint || '')),
          h('dt',null,t('ownership')), h('dd',null,ownershipLabel(current.ownership)),
        ),
        current.trash?.trashed ? h('p',{className:'waycraft-mcp-note'},t('trashedAt'),': ',ltr(current.trash.trashedAt||'')) : null,
        current.trash?.limitation ? h('p',{role:'status',className:'waycraft-mcp-note'},t('limitation'),': ',current.trash.limitation) : null,
      ) : null,
    )
    ) : null;

    const serversArea = h('div', null,
      h('div', { className: 'waycraft-mcp-toolbar', role: 'search' },
        h('input', { 'aria-label': t('search'), placeholder: t('search'), value: query, onInput: (e:any)=>setQuery(e.target.value) }),
        h('select', { 'aria-label': t('filterAll'), value: filter, onChange: (e:any)=>setFilter(e.target.value) },
          h('option',{value:'all'},t('filterAll')), h('option',{value:'needsTrust'},t('filterNeedsTrust'))),
        h('button', { type: 'button', className: 'waycraft-mcp-icon-btn', 'aria-label': t('refreshAria'), disabled: !!busy, onClick: load, title: t('refresh') }, h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'currentColor' }, h('path', { d: 'M17.65 6.35A7.958 7.958 0 0 1 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 0 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z' }))),
        h('button', { type: 'button', className: 'waycraft-mcp-icon-btn', 'aria-label': t('addServer'), disabled: !!busy, onClick: () => { setArea('discover-import'); setTab('import'); }, title: t('addServer') }, h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'currentColor' }, h('path', { d: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' })))),
      h('ul', { className: 'waycraft-mcp-list', 'aria-label': t('serverList') }, visibleServers.length ? visibleServers.map((s:any)=>serverRow(s,false)) : h('li', { className: 'waycraft-mcp-note' }, t('empty'))),
      detail
    );

    const trashArea = h('div', null,
      h('p', { className: 'waycraft-mcp-note' }, t('trashNote')),
      h('ul', { className: 'waycraft-mcp-list', 'aria-label': t('trashList') }, trashed.length ? trashed.map((s:any)=>serverRow(s,true)) : h('li', { className: 'waycraft-mcp-note' }, t('emptyTrash')))
    );

    return h('div', { className: 'waycraft-mcp', dir: isArabic()?'rtl':'ltr', 'data-waycraft-mcp-ui': '175' },
      h('style', null, STYLE),
      h('div', { className: 'waycraft-mcp-header' }, h('h2', { className: 'waycraft-mcp-title' }, t('title'))),
      h('p', { className: 'waycraft-mcp-notice' }, t('description')),
      h('p', { className: 'waycraft-mcp-notice' }, t('runtimeNote')),
      notice ? h('p', { role: notice.kind==='err'?'alert':'status', className: 'waycraft-mcp-alert' }, notice.text, notice.code ? ` (${notice.code})` : '') : null,
      confirmUi,
      h('div', { className: 'waycraft-mcp-seg', role: 'tablist', 'aria-label': t('title') },
        [['servers',t('areaServers')],['discover',t('areaDiscoverImport')],['trash',t('areaTrash')]].map(([id,label]:any)=>h('button',{key:id,type:'button',role:'tab','aria-selected':area===id,tabIndex:area===id?0:-1,onClick:()=>setArea(id)},label, id==='trash' && trashed.length ? h('span',{className:'waycraft-mcp-badge'},trashed.length) : ''))),
      area === 'servers' ? serversArea : null,
      area === 'discover' ? h('div', null, discoveryArea, importArea) : null,
      area === 'trash' ? trashArea : null
    );
  }

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      { name: 'settings.section', id: 'waycraft-mcp', order: 92, label: () => t('title') },
      McpPanel,
    ),
  );
}
