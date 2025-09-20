// src/components/awy/AWYWidget.tsx
'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AWYWidget;
var react_1 = require("react");
var AuthContext_1 = require("@/lib/supabase/AuthContext");
var feature_flags_1 = require("@/lib/feature-flags");
var authedFetch_1 = require("@/lib/api/authedFetch");
var AWYSetupHint_1 = require("./AWYSetupHint");
var ringClass = function (s) {
    switch (s) {
        case 'busy':
            return 'bg-amber-500';
        case 'online':
            return 'bg-green-500';
        default:
            return 'bg-gray-400 opacity-60';
    }
};
var computeBottomRight = function () { return ({ bottom: 24, right: 24 }); };
function api(input, init) {
    return __awaiter(this, void 0, void 0, function () {
        var response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, authedFetch_1.authedFetch)(input, __assign(__assign({}, init), { headers: __assign({ 'Content-Type': 'application/json' }, init === null || init === void 0 ? void 0 : init.headers) }))];
                case 1:
                    response = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, response.json()];
                case 3: return [2 /*return*/, (_b.sent())];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, {}];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/** Normalize unknown presence payloads into a PresenceMap.
 * Supports:
 *  - { [idOrEmail]: 'online' | 'offline' | 'busy' }
 *  - { [idOrEmail]: { status: 'online' | ... } }
 *  - { lovedOnes: [{ email, online|connected|status }] }
 *  - [{ email|loved_email, online|connected|status }]
 */
function toPresenceMap(raw) {
    var _a, _b, _c, _d;
    if (!raw)
        return {};
    // Plain map object (by id or email)
    if (typeof raw === 'object' && !Array.isArray(raw) && !('lovedOnes' in raw)) {
        var out = {};
        for (var _i = 0, _e = Object.entries(raw); _i < _e.length; _i++) {
            var _f = _e[_i], k = _f[0], v = _f[1];
            if (!k)
                continue;
            if (typeof v === 'string') {
                out[(_b = (_a = k.toLowerCase) === null || _a === void 0 ? void 0 : _a.call(k)) !== null && _b !== void 0 ? _b : k] =
                    v.toLowerCase() in { online: 1, offline: 1, busy: 1 }
                        ? v.toLowerCase()
                        : 'offline';
            }
            else if (v && typeof v === 'object' && 'status' in v) {
                var s = String(v.status || '').toLowerCase();
                out[(_d = (_c = k.toLowerCase) === null || _c === void 0 ? void 0 : _c.call(k)) !== null && _d !== void 0 ? _d : k] =
                    s in { online: 1, offline: 1, busy: 1 } ? s : 'offline';
            }
        }
        return out;
    }
    // lovedOnes array { email, online|connected|status }
    if (raw && typeof raw === 'object' && Array.isArray(raw.lovedOnes)) {
        var map = {};
        for (var _g = 0, _h = raw.lovedOnes; _g < _h.length; _g++) {
            var lo = _h[_g];
            var key = String((lo === null || lo === void 0 ? void 0 : lo.email) || '').toLowerCase();
            if (!key)
                continue;
            var s = (lo === null || lo === void 0 ? void 0 : lo.online) === true || (lo === null || lo === void 0 ? void 0 : lo.connected) === true
                ? 'online'
                : String((lo === null || lo === void 0 ? void 0 : lo.status) || '').toLowerCase() === 'online'
                    ? 'online'
                    : 'offline';
            map[key] = s;
        }
        return map;
    }
    // Array of entries with email/loved_email OR id/status
    if (Array.isArray(raw)) {
        var map = {};
        for (var _j = 0, raw_1 = raw; _j < raw_1.length; _j++) {
            var it = raw_1[_j];
            var idKey = (it && (it.id || it.user_id));
            var emailKey = String((it === null || it === void 0 ? void 0 : it.email) || (it === null || it === void 0 ? void 0 : it.loved_email) || '').toLowerCase();
            var s = (it === null || it === void 0 ? void 0 : it.online) === true || (it === null || it === void 0 ? void 0 : it.connected) === true
                ? 'online'
                : String((it === null || it === void 0 ? void 0 : it.status) || '').toLowerCase() === 'online'
                    ? 'online'
                    : 'offline';
            if (idKey)
                map[idKey] = s;
            if (emailKey)
                map[emailKey] = s;
        }
        return map;
    }
    return {};
}
function AWYWidget() {
    var _this = this;
    var user = ((0, AuthContext_1.useAuth)() || { user: null }).user;
    var authed = Boolean(user === null || user === void 0 ? void 0 : user.id);
    var _a = (0, react_1.useState)(false), mounted = _a[0], setMounted = _a[1];
    var _b = (0, react_1.useState)(false), open = _b[0], setOpen = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)([]), connections = _d[0], setConnections = _d[1];
    var _e = (0, react_1.useState)({}), presence = _e[0], setPresence = _e[1];
    (0, react_1.useEffect)(function () { return setMounted(true); }, []);
    var featureEnabled = (0, feature_flags_1.isAWYEnabled)();
    var enabled = featureEnabled && authed;
    // Allow other components (e.g., a floating heart) to open this panel
    (0, react_1.useEffect)(function () {
        if (!mounted || !enabled)
            return;
        var handler = function () { return setOpen(true); };
        window.addEventListener('awy:open', handler);
        return function () { return window.removeEventListener('awy:open', handler); };
    }, [mounted, enabled, authed]);
    // initial load + presence polling
    (0, react_1.useEffect)(function () {
        (0, react_1.useEffect)(function () {
            if (!mounted || !enabled) {
                if (!authed) {
                    setConnections([]);
                    setPresence({});
                }
                setLoading(false);
                return;
            }
            var stop = false;
            var loadConnections = function () { return __awaiter(_this, void 0, void 0, function () {
                var data, rows, list, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, 3, 4]);
                            setLoading(true);
                            return [4 /*yield*/, api('/api/awy/connections')];
                        case 1:
                            data = _a.sent();
                            if ((data === null || data === void 0 ? void 0 : data.ok) === false) {
                                if (!stop)
                                    setConnections([]);
                                return [2 /*return*/];
                            }
                            rows = Array.isArray(data === null || data === void 0 ? void 0 : data.connections) ? data.connections : [];
                            list = rows.map(function (row) {
                                var _a, _b, _c, _d, _e, _f;
                                return ({
                                    id: (_a = row.id) !== null && _a !== void 0 ? _a : "".concat(row.peer_id || row.email || row.loved_email || 'unknown'),
                                    peer_id: (_b = row.peer_id) !== null && _b !== void 0 ? _b : null,
                                    email: String(row.email || row.loved_email || '').toLowerCase(),
                                    relationship: (_d = (_c = row.relationship_label) !== null && _c !== void 0 ? _c : row.relationship) !== null && _d !== void 0 ? _d : null,
                                    display_name: (_e = row.display_name) !== null && _e !== void 0 ? _e : null,
                                    status: (_f = row.status) !== null && _f !== void 0 ? _f : null,
                                });
                            });
                            if (!stop)
                                setConnections(list);
                            return [3 /*break*/, 4];
                        case 2:
                            e_1 = _a.sent();
                            console.error('[AWY] load connections failed:', e_1);
                            if (!stop)
                                setConnections([]);
                            return [3 /*break*/, 4];
                        case 3:
                            if (!stop)
                                setLoading(false);
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            }); };
            var loadPresence = function () { return __awaiter(_this, void 0, void 0, function () {
                var p, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, api('/api/awy/presence')];
                        case 1:
                            p = _a.sent();
                            if ((p === null || p === void 0 ? void 0 : p.ok) === false) {
                                return [2 /*return*/];
                            }
                            if (!stop)
                                setPresence(toPresenceMap(p));
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _a.sent();
                            // Presence not critical; keep quiet in UI
                            // eslint-disable-next-line no-console
                            console.debug('[AWY] presence fetch failed:', e_2);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            loadConnections().then(loadPresence);
            var id = setInterval(loadPresence, 20000);
            return function () {
                stop = true;
                clearInterval(id);
            };
        }, [mounted, enabled, authed]);
        var presenceFor = function (c) {
            // Prefer peer_id (user_id-based presence), then fall back to email-based presence
            return (c.peer_id && presence[c.peer_id]) || presence[c.email];
        };
        var onlineCount = (0, react_1.useMemo)(function () {
            return connections.reduce(function (n, c) {
                var s = presenceFor(c);
                return n + (s === 'online' || s === 'busy' ? 1 : 0);
            }, 0);
        }, [connections, presence]);
        var startCall = function (email) { return __awaiter(_this, void 0, void 0, function () {
            var res, url, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api('/api/awy/calls', { method: 'POST', body: JSON.stringify({ email: email }) })];
                    case 1:
                        res = _a.sent();
                        url = res.roomUrl || res.url || (res.callId ? "/assistant/call/".concat(res.callId) : null);
                        if (url) {
                            window.location.href = url;
                        }
                        else {
                            alert('Call created, but no room URL was returned.');
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_3 = _a.sent();
                        console.error('[AWY] call start failed:', e_3);
                        alert((e_3 === null || e_3 === void 0 ? void 0 : e_3.message) || 'Could not start the call. Please try again.');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        if (!mounted || !enabled)
            return null;
        var noConnections = !loading && connections.length === 0;
        var pos = computeBottomRight();
        return (<>
      {/* Toggle button */}
      <button aria-label="Open AWY" onClick={function () { return setOpen(function (v) { return !v; }); }} className="fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl hover:bg-violet-700 focus:outline-none" style={{ bottom: pos.bottom, right: pos.right }}>
        {/* little presence indicator */}
        <span className={"absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white ".concat(onlineCount > 0 ? 'bg-green-500' : 'bg-gray-400 opacity-70')} title={onlineCount > 0 ? "".concat(onlineCount, " online") : 'No one online'}/>
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Zm0 2c-3.33 0-6 2.24-6 5v1h12v-1c0-2.76-2.67-5-6-5Z"/>
        </svg>
      </button>

      {/* Panel */}
      {open && (<div className="fixed z-[60] w-[320px] rounded-xl border bg-white/95 p-3 shadow-2xl backdrop-blur" style={{ bottom: pos.bottom + 72, right: pos.right - 6 }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Always With You</div>
            <button onClick={function () { return setOpen(false); }} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
              Close
            </button>
          </div>

          {loading ? (<div className="py-6 text-center text-sm text-gray-500">Loading...</div>) : noConnections ? (<div className="py-4">
              <div className="mb-2 text-sm text-gray-600">
                You haven't added any loved ones yet.
              </div>
              <AWYSetupHint_1.default />
            </div>) : (<ul className="space-y-2">
              {connections.map(function (c) {
                        var st = presenceFor(c);
                        var initials = (c.display_name || c.email || '?')
                            .split(/[^A-Za-z0-9]+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(function (s) { var _a; return (_a = s[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase(); })
                            .join('') || '?';
                        return (<li key={c.id} className="flex items-center justify-between rounded-lg border px-2 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                          {initials}
                        </div>
                        <span className={"absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ".concat(ringClass(st))} title={st || 'offline'}/>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {c.display_name || c.relationship || 'Loved one'}
                        </div>
                        <div className="truncate text-xs text-gray-600">{c.email}</div>
                      </div>
                    </div>

                    <button className="ml-2 shrink-0 rounded bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300" onClick={function () { return startCall(c.email); }} disabled={!st || st === 'offline'} title={st === 'offline' ? 'User is offline' : 'Start a call'}>
                      Call
                    </button>
                  </li>);
                    })}
            </ul>)}
        </div>)}
    </>);
    });
}
