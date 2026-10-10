import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

const stored = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem('superadmin_session') || 'null')
    return session?.user?.system_role === 'SUPER_ADMIN' && session?.token ? session : null
  } catch { return null }
}
const date = value => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const expiry = value => value ? date(value) : 'Không thời hạn'
const statuses = { ACTIVE: 'Hoạt động', EXPIRED: 'Hết hạn', DISABLED: 'Đã vô hiệu hóa' }
const blankCreate = () => ({ spaName: '', managerUsername: '', managerFullname: '', managerPassword: '', confirm: '', years: 'lifetime' })

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const { data } = await api.login({ username: username.trim(), password })
      if (data?.user?.system_role !== 'SUPER_ADMIN' || !data.token) {
        setError('Tài khoản không có quyền quản trị hệ thống.')
        return
      }
      onLogin(data)
    } catch (err) { setError(err.message) }
    finally { setBusy(false); setPassword('') }
  }
  return <main className="login-page">
    <div className="login-intro"><span className="brand-mark">✳</span><p className="eyebrow">SPA MANAGEMENT / SUPERADMIN</p><h1>Quản lý Spa,<br /><em>thật gọn gàng.</em></h1><p>Một nơi để theo dõi, thiết lập và chăm sóc tất cả không gian Spa trong hệ thống.</p><div className="intro-bottom">NỀN TẢNG QUẢN TRỊ SPA <span>© 2026</span></div></div>
    <div className="login-side"><form className="login-card" onSubmit={submit}><span className="small-icon">✳</span><p className="eyebrow">CHÀO MỪNG TRỞ LẠI</p><h2>Đăng nhập quản trị</h2><p className="muted">Dành riêng cho quản trị viên hệ thống.</p><label>Tên đăng nhập<input autoFocus required value={username} onChange={e => setUsername(e.target.value)} placeholder="Nhập tên đăng nhập" /></label><label>Mật khẩu<div className="password-field"><input required type={visible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" /><button type="button" className="text-button" onClick={() => setVisible(!visible)}>{visible ? 'Ẩn' : 'Hiện'}</button></div></label>{error && <p className="error" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập →'}</button><p className="login-hint">Chỉ tài khoản Superadmin mới có thể truy cập.</p></form></div>
  </main>
}

function Modal({ title, children, onClose, wide = false }) {
  return <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-head"><div><p className="eyebrow">QUẢN TRỊ SPA</p><h2>{title}</h2></div><button className="icon-btn" aria-label="Đóng" onClick={onClose}>×</button></header>{children}</div></div>
}

function CreateForm({ run, token, close, busy }) {
  const [form, setForm] = useState(blankCreate)
  const [error, setError] = useState('')
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }))
  async function submit(e) {
    e.preventDefault()
    if (form.managerPassword.trim().length < 6 || form.managerPassword.trim().length > 255 || form.managerPassword !== form.confirm) { setError('Mật khẩu cần từ 6–255 ký tự và hai ô phải khớp nhau.'); return }
    const payload = { spaName: form.spaName.trim(), managerUsername: form.managerUsername.trim(), managerFullname: form.managerFullname.trim(), managerPassword: form.managerPassword, years: form.years }
    try { await run(() => api.create(token, payload), 'Tạo Spa thành công.', true); close() }
    catch (err) { setError(err.message) }
    finally { setForm(previous => ({ ...previous, managerPassword: '', confirm: '' })) }
  }
  return <Modal title="Tạo Spa mới" onClose={close}><form onSubmit={submit} className="form-body"><p className="muted">Thiết lập không gian mới cùng tài khoản Manager đầu tiên.</p><label>Tên Spa *<input required maxLength={100} value={form.spaName} onChange={e => update('spaName', e.target.value)} placeholder="Ví dụ: Spa Ngọc Lan" /></label><div className="divider">TÀI KHOẢN MANAGER</div><p className="muted tiny">Tên đăng nhập phải duy nhất trên toàn hệ thống.</p><label>Tên đăng nhập *<input required maxLength={100} value={form.managerUsername} onChange={e => update('managerUsername', e.target.value)} /></label><label>Họ và tên *<input required maxLength={255} value={form.managerFullname} onChange={e => update('managerFullname', e.target.value)} /></label><div className="two-col"><label>Mật khẩu *<input required type="password" minLength={6} maxLength={255} value={form.managerPassword} onChange={e => update('managerPassword', e.target.value)} /></label><label>Xác nhận mật khẩu *<input required type="password" value={form.confirm} onChange={e => update('confirm', e.target.value)} /></label></div><label>Thời hạn sử dụng<select value={form.years} onChange={e => update('years', e.target.value)}><option value="lifetime">Không thời hạn</option>{[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n} năm</option>)}</select></label>{error && <p className="error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="secondary" disabled={busy} onClick={close}>Hủy</button><button className="primary" disabled={busy}>{busy ? 'Đang khởi tạo…' : 'Tạo Spa →'}</button></div></form></Modal>
}

function Detail({ tenantId, token, run, busy, close, revision, notify, logout }) {
  const [tenant, setTenant] = useState(null)
  const [managers, setManagers] = useState([])
  const [error, setError] = useState('')
  const [managerError, setManagerError] = useState('')
  const [tab, setTab] = useState('info')
  const [edit, setEdit] = useState(false)
  const [name, setName] = useState('')
  const [expiryMode, setExpiryMode] = useState('keep')
  const [dateTime, setDateTime] = useState('')
  const [years, setYears] = useState('1')
  const [formError, setFormError] = useState('')
  const [resetUser, setResetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [confirmName, setConfirmName] = useState('')
  const [confirmUsername, setConfirmUsername] = useState('')

  const reload = useCallback(async () => {
    setError(''); setManagerError('')
    try {
      const [detail, managerList] = await Promise.allSettled([api.detail(token, tenantId), api.managers(token, tenantId)])
      if (detail.status === 'rejected') throw detail.reason
      setTenant(detail.value.data)
      if (managerList.status === 'fulfilled') setManagers(managerList.value.data || [])
      else if (managerList.reason.status === 401 || managerList.reason.status === 403) logout()
      else { setManagers([]); setManagerError(managerList.reason.message) }
    } catch (err) {
      if (err.status === 401 || err.status === 403) logout()
      else if (err.status === 404) { notify('Spa không còn tồn tại.'); close() }
      else setError(err.message)
    }
  }, [token, tenantId, close, notify, logout])
  useEffect(() => { reload() }, [reload, revision])

  async function save(e) {
    e.preventDefault(); setFormError('')
    const body = {}
    if (name.trim() !== tenant.spa_name) body.spaName = name.trim()
    if (expiryMode === 'lifetime') body.expireAt = null
    if (expiryMode === 'date') {
      if (!dateTime || Number.isNaN(new Date(dateTime).getTime())) { setFormError('Vui lòng chọn ngày giờ hợp lệ.'); return }
      body.expireAt = new Date(dateTime).toISOString()
    }
    if (!Object.keys(body).length) { setFormError('Chưa có thay đổi nào.'); return }
    try { await run(() => api.update(token, tenantId, body), 'Đã cập nhật Spa.'); setEdit(false) }
    catch (err) { setFormError(err.message) }
  }
  async function renew(e) {
    e.preventDefault(); setFormError('')
    if (!Number.isInteger(Number(years)) || Number(years) < 1 || Number(years) > 100) { setFormError('Số năm phải từ 1 đến 100.'); return }
    try { await run(() => api.renew(token, tenantId, Number(years)), 'Đã gia hạn Spa.'); setEdit(false) }
    catch (err) { setFormError(err.message) }
  }
  async function changeStatus() {
    if (confirmName.trim() !== tenant.spa_name) return
    try {
      await run(() => tenant.status === 'DISABLED' ? api.restore(token, tenantId) : api.disable(token, tenantId), tenant.status === 'DISABLED' ? 'Đã khôi phục Spa. Kiểm tra thời hạn trước khi Manager đăng nhập.' : 'Đã vô hiệu hóa Spa.')
      setConfirmation(null); setConfirmName('')
    } catch (err) { setFormError(err.message) }
  }
  async function reset(e) {
    e.preventDefault(); setFormError('')
    if (newPassword.trim().length < 6 || newPassword.trim().length > 255 || newPassword !== confirmPassword) { setFormError('Mật khẩu cần từ 6–255 ký tự và hai ô phải khớp nhau.'); return }
    if (confirmName.trim() !== tenant.spa_name || confirmUsername.trim() !== resetUser.username) { setFormError('Vui lòng nhập đúng tên Spa và username để xác nhận.'); return }
    try { await run(() => api.resetPassword(token, tenantId, resetUser.id, newPassword), 'Đã cấp mật khẩu mới. Hãy chuyển cho Manager qua kênh bảo mật riêng.'); setResetUser(null); setConfirmName(''); setConfirmUsername('') }
    catch (err) { setFormError(err.message) }
    finally { setNewPassword(''); setConfirmPassword('') }
  }
  const fields = tenant && [['Tên Spa', tenant.spa_name], ['Trạng thái', statuses[tenant.status] || tenant.status], ['Hạn dùng', expiry(tenant.expire_at)], ['Manager đại diện', tenant.manager_fullname || 'Chưa có Manager'], ['Tên đăng nhập', tenant.manager_username || '—'], ['Database', tenant.database_name], ['Ngày tạo', date(tenant.created_at)], ['Người tạo', tenant.created_by || '—'], ['Cập nhật lần cuối', date(tenant.updated_at)], ['Người cập nhật', tenant.updated_by || '—'], ['Ngày vô hiệu hóa', date(tenant.deleted_at)], ['Người vô hiệu hóa', tenant.deleted_by || '—']]
  return <Modal title={tenant?.spa_name || 'Chi tiết Spa'} onClose={close} wide><div className="detail-body">
    {error ? <div className="message error">{error} <button onClick={reload}>Thử lại</button></div> : !tenant ? <p>Đang tải chi tiết…</p> : <>
      <div className="detail-top"><span className={`badge ${tenant.status?.toLowerCase()}`}>● {statuses[tenant.status] || tenant.status}</span><span className="muted">Mã Spa #{tenant.tenant_id}</span></div>
      <div className="tabs"><button className={tab === 'info' ? 'selected' : ''} onClick={() => setTab('info')}>Thông tin Spa</button><button className={tab === 'managers' ? 'selected' : ''} onClick={() => setTab('managers')}>Tài khoản Manager ({managers.length})</button></div>
      {tab === 'info' ? <>
        <div className="info-grid">{fields.map(([label, value]) => <div key={label}><span className="field-label">{label}</span><strong>{value}</strong></div>)}</div>
        {tenant.status === 'EXPIRED' && <div className="notice">Spa đã hết hạn. Gia hạn hoặc chuyển sang không thời hạn để Manager có thể đăng nhập.</div>}
        <div className="detail-actions">{tenant.status !== 'DISABLED' && <><button className="secondary" onClick={() => { setEdit(!edit); setName(tenant.spa_name); setExpiryMode('keep'); setFormError('') }}>✎ Sửa thông tin / thời hạn</button><button className="danger-outline" disabled={busy} onClick={() => { setConfirmation('disable'); setFormError('') }}>Vô hiệu hóa</button></>}{tenant.status === 'DISABLED' && <button className="primary" disabled={busy} onClick={() => { setConfirmation('restore'); setFormError('') }}>Khôi phục Spa</button>}</div>
        {edit && tenant.status !== 'DISABLED' && <div className="edit-panel"><h3>Chỉnh sửa Spa</h3><form onSubmit={save}><label>Tên Spa<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label><label>Thời hạn<select value={expiryMode} onChange={e => setExpiryMode(e.target.value)}><option value="keep">Giữ nguyên</option><option value="lifetime">Không thời hạn</option><option value="date">Chọn ngày giờ cụ thể</option></select></label>{expiryMode === 'date' && <label>Ngày và giờ hết hạn<input required type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} /></label>}<button className="primary" disabled={busy}>Lưu thay đổi</button></form>{tenant.expire_at && <form onSubmit={renew} className="renew-form"><h3>Gia hạn thêm năm</h3><p className="muted tiny">Backend sẽ tự tính từ hạn hiện tại hoặc thời điểm bây giờ.</p><div className="inline"><input type="number" min="1" max="100" required value={years} onChange={e => setYears(e.target.value)} aria-label="Số năm" /><button className="secondary" disabled={busy}>Gia hạn</button></div></form>}{formError && <p className="error" role="alert">{formError}</p>}</div>}
        {confirmation && <div className="confirm-panel"><h3>{confirmation === 'disable' ? 'Xác nhận vô hiệu hóa' : 'Xác nhận khôi phục'}</h3><p>{confirmation === 'disable' ? 'Tất cả tài khoản của Spa sẽ không thể đăng nhập. Dữ liệu không bị xóa và có thể khôi phục.' : 'Tất cả tài khoản của Spa sẽ được khôi phục, kể cả tài khoản từng bị khóa riêng lẻ. Nếu Spa đã hết hạn, Manager vẫn chưa thể đăng nhập cho tới khi được gia hạn.'}</p><label>Nhập chính xác tên Spa “{tenant.spa_name}”<input value={confirmName} onChange={e => setConfirmName(e.target.value)} /></label>{formError && <p className="error">{formError}</p>}<div className="inline"><button className="secondary" onClick={() => { setConfirmation(null); setConfirmName('') }}>Hủy</button><button className={confirmation === 'disable' ? 'danger' : 'primary'} disabled={busy || confirmName.trim() !== tenant.spa_name} onClick={changeStatus}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</button></div></div>}
      </> : <div className="manager-list">{managerError && <p className="error">{managerError} <button onClick={reload}>Thử lại</button></p>}{!managerError && managers.length === 0 && <p className="muted">Chưa có tài khoản Manager.</p>}{managers.map(manager => <div className="manager-row" key={manager.id}><div className="avatar">{(manager.fullname || manager.username || '?').charAt(0).toUpperCase()}</div><div className="manager-info"><strong>{manager.fullname}</strong><small>@{manager.username} · {manager.deleted_at ? 'Đã vô hiệu hóa' : 'Hoạt động'}</small></div>{!manager.deleted_at && tenant.status !== 'DISABLED' && <button className="secondary small" onClick={() => { setResetUser(manager); setFormError(''); setConfirmName(''); setConfirmUsername('') }}>Cấp lại mật khẩu</button>}</div>)}{resetUser && <form className="confirm-panel" onSubmit={reset}><h3>Cấp lại mật khẩu · @{resetUser.username}</h3><p className="muted">Mật khẩu cũ sẽ không còn dùng được. Hãy chuyển mật khẩu mới qua kênh an toàn.</p><label>Mật khẩu mới<input type="password" required minLength={6} maxLength={255} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label><label>Xác nhận mật khẩu<input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label><label>Nhập tên Spa “{tenant.spa_name}” để xác nhận<input required value={confirmName} onChange={e => setConfirmName(e.target.value)} /></label><label>Nhập username “{resetUser.username}” để xác nhận<input required value={confirmUsername} onChange={e => setConfirmUsername(e.target.value)} /></label>{formError && <p className="error">{formError}</p>}<div className="inline"><button className="secondary" type="button" onClick={() => { setResetUser(null); setNewPassword(''); setConfirmPassword(''); setConfirmName(''); setConfirmUsername('') }}>Hủy</button><button className="primary" disabled={busy || confirmName.trim() !== tenant.spa_name || confirmUsername.trim() !== resetUser.username}>Xác nhận cấp lại</button></div></form>}</div>}
    </>}
  </div></Modal>
}

function Dashboard({ session, logout }) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const notify = useCallback(message => setNotice(message), [])
  const closeDetail = useCallback(() => setSelectedId(null), [])
  useEffect(() => { const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1) }, 400); return () => clearTimeout(timer) }, [searchInput])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    api.list(session.token, { search, status, page, pageSize: 20 }, controller.signal).then(data => setList(data)).catch(err => {
      if (err.name !== 'AbortError') {
        if (err.status === 401 || err.status === 403) logout()
        else setError(err.message)
      }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [session.token, search, status, page, revision, logout])
  async function run(action, success, resetPage = false) {
    if (busy) return
    setBusy(true)
    try {
      const result = await action()
      setNotice(success)
      if (resetPage) setPage(1)
      setRevision(n => n + 1)
      return result
    } catch (err) {
      if (err.status === 401 || err.status === 403) logout()
      throw err
    } finally { setBusy(false) }
  }
  return <div className="app-shell"><aside className="sidebar"><div className="sidebar-brand"><span className="brand-mark">✳</span><span>spa<span className="brand-light">admin</span><small>SUPER ADMIN PORTAL</small></span></div><div className="sidebar-label">KHÔNG GIAN LÀM VIỆC</div><div className="sidebar-link active"><span>▦</span> Quản lý Spa <span className="arrow">›</span></div><div className="sidebar-footer"><div className="user-avatar">{(session.user.fullname || session.user.username || 'A').charAt(0).toUpperCase()}</div><div><strong>{session.user.fullname || session.user.username}</strong><small>Quản trị hệ thống</small></div><button className="logout" onClick={logout} title="Đăng xuất" aria-label="Đăng xuất">⇥</button></div></aside>
    <div className="main-wrap"><header className="topbar"><span>Hệ thống <span className="muted"> / Quản lý Spa</span></span><span className="topbar-right"><span className="online-dot" /> Superadmin</span></header><main className="content"><div className="page-heading"><div><div className="eyebrow">TỔNG QUAN HỆ THỐNG <span className="eyebrow-line" /></div><h1>Quản lý Spa</h1><p className="muted">Quản lý thông tin và trạng thái các Spa trong hệ thống.</p></div><button className="primary create-btn" onClick={() => setCreateOpen(true)}>＋ Tạo Spa mới</button></div>
      {notice && <div className="notice success" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
      <div className="panel"><div className="panel-head"><div><h2>Danh sách Spa</h2><p className="muted">{list ? `${list.total} Spa được tìm thấy` : 'Đang tải dữ liệu…'}</p></div><div className="toolbar"><div className="searchbox"><span>⌕</span><input aria-label="Tìm kiếm Spa" placeholder="Tìm Spa hoặc Manager..." value={searchInput} onChange={e => setSearchInput(e.target.value)} /></div><select aria-label="Lọc trạng thái" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="all">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="expired">Hết hạn</option><option value="disabled">Đã vô hiệu hóa</option></select></div></div>
        <div className="table-scroll"><table><thead><tr><th>TÊN SPA</th><th>MANAGER</th><th>HẠN SỬ DỤNG</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th><th>THAO TÁC</th></tr></thead><tbody>{!error && !loading && list?.data?.map(tenant => <tr key={tenant.tenant_id}><td><button className="spa-link" onClick={() => setSelectedId(tenant.tenant_id)}><span className="spa-symbol">✳</span><span>{tenant.spa_name}<small>#{tenant.tenant_id}</small></span></button></td><td>{tenant.manager_fullname || 'Chưa có Manager'}<small>{tenant.manager_username ? `@${tenant.manager_username}` : ''}</small></td><td>{expiry(tenant.expire_at)}</td><td><span className={`badge ${tenant.status?.toLowerCase()}`}>● {statuses[tenant.status] || tenant.status}</span></td><td>{date(tenant.created_at)}</td><td><button className="view-btn" onClick={() => setSelectedId(tenant.tenant_id)}>Xem chi tiết →</button></td></tr>)}{loading && Array.from({ length: 4 }, (_, i) => <tr key={i}><td colSpan={6}><div className="skeleton" /></td></tr>)}</tbody></table></div>
        {error && <div className="empty"><strong>Không tải được danh sách Spa</strong><p>{error}</p><button className="secondary" onClick={() => setRevision(n => n + 1)}>Thử lại</button></div>}{!loading && !error && !list?.data?.length && <div className="empty"><span>✳</span><strong>Chưa tìm thấy Spa nào</strong><p>Thử tìm kiếm khác hoặc tạo Spa đầu tiên của bạn.</p></div>}
        <div className="pagination"><span>Trang {list?.page || page} / {list?.totalPages || 1} · {list?.total || 0} kết quả</span><div><button disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button><button disabled={loading || page >= (list?.totalPages || 0)} onClick={() => setPage(p => p + 1)}>Sau →</button></div></div></div><p className="content-footer">SPA MANAGEMENT · SUPERADMIN PORTAL</p></main></div>
    {createOpen && <CreateForm run={run} token={session.token} busy={busy} close={() => setCreateOpen(false)} />}{selectedId !== null && <Detail key={selectedId} tenantId={selectedId} token={session.token} run={run} busy={busy} close={closeDetail} revision={revision} notify={notify} logout={logout} />}
  </div>
}

export default function App() {
  const [session, setSession] = useState(stored)
  const logout = useCallback(() => { sessionStorage.removeItem('superadmin_session'); setSession(null); window.history.replaceState(null, '', '/login') }, [])
  function login(data) { sessionStorage.setItem('superadmin_session', JSON.stringify(data)); setSession(data); window.history.replaceState(null, '', '/tenants') }
  useEffect(() => { window.history.replaceState(null, '', session ? '/tenants' : '/login') }, [session])
  return session ? <Dashboard session={session} logout={logout} /> : <Login onLogin={login} />
}