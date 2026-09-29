import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

type Screen = 'login' | 'dashboard' | 'moradias' | 'moradores' | 'despesas' | 'tarefas' | 'calendario' | 'compras' | 'configuracoes'

interface Moradia { id: string; nome: string; endereco: string; descricao: string }
interface Morador { id: string; moradiaId: string; nome: string; email: string; colorIdx: number; avatar?: string }
interface Despesa { id: string; moradiaId: string; nome: string; categoria: string; valor: number; data: string; descricao: string; moradorIds: string[]; pagadorId: string }
interface Tarefa { id: string; moradiaId: string; nome: string; descricao: string; moradorId: string; horario: string; status: 'pendente' | 'feito'; diasSemana: number[]; repeteSemanal: boolean; data: string }
interface Compra { id: string; moradiaId: string; item: string; quantidade: string; feito: boolean }
interface Toast { id: string; msg: string; type: 'success' | 'error' | 'info' }

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const COLORS = [
  { hex: '#FF6584', light: '#FFF0F4', name: 'Rosa' },
  { hex: '#3B82F6', light: '#EFF6FF', name: 'Azul' },
  { hex: '#10B981', light: '#ECFDF5', name: 'Verde' },
  { hex: '#F59E0B', light: '#FFFBEB', name: 'Âmbar' },
  { hex: '#8B5CF6', light: '#F5F3FF', name: 'Violeta' },
  { hex: '#06B6D4', light: '#ECFEFF', name: 'Ciano' },
  { hex: '#F97316', light: '#FFF7ED', name: 'Laranja' },
  { hex: '#84CC16', light: '#F7FEE7', name: 'Lima' },
]

const CATEGORIAS = ['Aluguel','Alimentação','Energia','Água','Internet','Gás','Limpeza','Outros']
const DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DAYS_FULL  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const MONTHS_PT  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function uid() { return Math.random().toString(36).slice(2,9) }
function fmt(v: number) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v) }
function today() { return new Date().toISOString().slice(0,10) }

// ══════════════════════════════════════════════════════════════════════════════
// SEED DATA
// ══════════════════════════════════════════════════════════════════════════════

const SEED_MORADIAS: Moradia[] = [
  { id: 'mor1', nome: 'Casa da Galera', endereco: 'Rua das Palmeiras, 127 – Vila Madalena', descricao: 'Nossa república universitária' },
  { id: 'mor2', nome: 'Apto Centro', endereco: 'Av. Paulista, 900 – Bela Vista', descricao: 'Apartamento compartilhado no centro' },
]

const SEED_MORADORES: Morador[] = [
  { id: 'r1', moradiaId: 'mor1', nome: 'Maria Santos', email: 'maria@email.com', colorIdx: 0 },
  { id: 'r2', moradiaId: 'mor1', nome: 'João Oliveira', email: 'joao@email.com', colorIdx: 1 },
  { id: 'r3', moradiaId: 'mor1', nome: 'Ana Costa', email: 'ana@email.com', colorIdx: 2 },
  { id: 'r4', moradiaId: 'mor2', nome: 'Pedro Lima', email: 'pedro@email.com', colorIdx: 3 },
  { id: 'r5', moradiaId: 'mor2', nome: 'Luísa Ferreira', email: 'luisa@email.com', colorIdx: 4 },
]

const SEED_DESPESAS: Despesa[] = [
  { id: 'd1', moradiaId: 'mor1', nome: 'Aluguel', categoria: 'Aluguel', valor: 3600, data: '2026-09-05', descricao: 'Aluguel de setembro', moradorIds: ['r1','r2','r3'], pagadorId: 'r1' },
  { id: 'd2', moradiaId: 'mor1', nome: 'Conta de Luz', categoria: 'Energia', valor: 240, data: '2026-09-12', descricao: 'ENEL – setembro', moradorIds: ['r1','r2','r3'], pagadorId: 'r2' },
  { id: 'd3', moradiaId: 'mor1', nome: 'Mercado', categoria: 'Alimentação', valor: 480, data: '2026-09-18', descricao: 'Compras do mês', moradorIds: ['r1','r3'], pagadorId: 'r3' },
  { id: 'd4', moradiaId: 'mor1', nome: 'Internet', categoria: 'Internet', valor: 120, data: '2026-09-01', descricao: 'Vivo Fibra', moradorIds: ['r1','r2','r3'], pagadorId: 'r1' },
]

const SEED_TAREFAS: Tarefa[] = [
  { id: 't1', moradiaId: 'mor1', nome: 'Limpar cozinha', descricao: 'Limpar fogão, pia e chão', moradorId: 'r1', horario: '09:00', status: 'feito', diasSemana: [1,4], repeteSemanal: true, data: '2026-09-23' },
  { id: 't2', moradiaId: 'mor1', nome: 'Varrer a sala', descricao: '', moradorId: 'r2', horario: '10:00', status: 'pendente', diasSemana: [2,5], repeteSemanal: true, data: '2026-09-24' },
  { id: 't3', moradiaId: 'mor1', nome: 'Lavar banheiro', descricao: 'Incluir box e espelho', moradorId: 'r3', horario: '11:00', status: 'pendente', diasSemana: [6], repeteSemanal: true, data: '2026-09-21' },
  { id: 't4', moradiaId: 'mor1', nome: 'Tirar o lixo', descricao: '', moradorId: 'r2', horario: '08:00', status: 'pendente', diasSemana: [0,3], repeteSemanal: true, data: '2026-09-22' },
]

const SEED_COMPRAS: Compra[] = [
  { id: 'c1', moradiaId: 'mor1', item: 'Arroz', quantidade: '5 kg', feito: false },
  { id: 'c2', moradiaId: 'mor1', item: 'Feijão preto', quantidade: '2 kg', feito: false },
  { id: 'c3', moradiaId: 'mor1', item: 'Azeite', quantidade: '1 garrafa', feito: false },
  { id: 'c4', moradiaId: 'mor1', item: 'Papel higiênico', quantidade: '1 pacote', feito: true },
  { id: 'c5', moradiaId: 'mor1', item: 'Detergente', quantidade: '2 unid.', feito: true },
  { id: 'c6', moradiaId: 'mor1', item: 'Esponja de lavar', quantidade: '3 unid.', feito: false },
]

// ══════════════════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ══════════════════════════════════════════════════════════════════════════════

function Avatar({ nome, colorIdx, size = 36 }: { nome: string; colorIdx: number; size?: number }) {
  const c = COLORS[colorIdx % COLORS.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.38, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
      {nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
    </div>
  )
}

function Pill({ label, colorIdx, size = 'sm' }: { label: string; colorIdx: number; size?: 'xs'|'sm' }) {
  const c = COLORS[colorIdx % COLORS.length]
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding: size==='xs' ? '2px 8px' : '3px 10px', borderRadius:99, background: c.light, color: c.hex, fontSize: size==='xs' ? 11 : 12, fontWeight: 600, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c.hex, flexShrink:0 }} />
      {label}
    </span>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ padding:'2px 8px', borderRadius:99, background:color+'20', color, fontSize:11, fontWeight:700 }}>{label}</span>
}

function Btn({ children, variant='primary', size='md', full=false, ...p }: { children: React.ReactNode; variant?:'primary'|'secondary'|'ghost'|'danger'|'white'; size?:'sm'|'md'|'lg'; full?:boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base: React.CSSProperties = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, borderRadius:'var(--radius-btn)', fontWeight:600, border:'none', cursor:'pointer', transition:'all .15s', fontFamily:'var(--font-sans)', width: full?'100%':undefined }
  const sizes = { sm:{padding:'6px 14px',fontSize:13}, md:{padding:'9px 20px',fontSize:14}, lg:{padding:'13px 28px',fontSize:15} }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background:'var(--color-primary)', color:'#fff' },
    secondary: { background:'var(--color-primary-light)', color:'var(--color-primary)' },
    ghost: { background:'transparent', color:'var(--color-muted)' },
    danger: { background:'var(--color-danger-light)', color:'var(--color-danger)' },
    white: { background:'#fff', color:'var(--color-text)', boxShadow:'0 1px 4px rgba(0,0,0,.1)' },
  }
  return <button {...p} style={{ ...base, ...sizes[size], ...variants[variant], ...(p.style||{}) }}>{children}</button>
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:13, fontWeight:600, color:'var(--color-muted)' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize:12, color:'var(--color-muted)' }}>{hint}</p>}
    </div>
  )
}

const inputCss: React.CSSProperties = { border:'1.5px solid var(--color-border)', borderRadius:'var(--radius-btn)', padding:'9px 12px', fontSize:14, outline:'none', background:'#fff', color:'var(--color-text)', fontFamily:'var(--font-sans)', width:'100%', transition:'border-color .15s' }

const Inp = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Inp({ ...p }, ref) {
  return <input ref={ref} {...p} style={{ ...inputCss, ...(p.style||{}) }} onFocus={e => (e.target.style.borderColor='var(--color-primary)')} onBlur={e => (e.target.style.borderColor='var(--color-border)')} />
})

function Sel({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} style={{ ...inputCss, ...(p.style||{}) }}>{children}</select>
}

function Textarea({ ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} rows={3} style={{ ...inputCss, resize:'vertical', ...(p.style||{}) }} onFocus={e => (e.target.style.borderColor='var(--color-primary)')} onBlur={e => (e.target.style.borderColor='var(--color-border)')} />
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:'var(--color-surface)', borderRadius:'var(--radius-card)', boxShadow:'var(--shadow-card)', border:'1px solid var(--color-border)', ...(style||{}) }}>{children}</div>
}

function Divider() { return <div style={{ height:1, background:'var(--color-border)', margin:'4px 0' }} /> }

function EmptyState({ icon, title, subtitle, action }: { icon: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', gap:12, textAlign:'center' }}>
      <div style={{ fontSize:40 }}>{icon}</div>
      <p style={{ fontWeight:700, fontSize:16 }}>{title}</p>
      {subtitle && <p style={{ fontSize:14, color:'var(--color-muted)', maxWidth:280 }}>{subtitle}</p>}
      {action}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', background:'rgba(0,0,0,.45)', backdropFilter:'blur(3px)' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:'1.25rem', width:'100%', maxWidth: wide ? 680 : 520, maxHeight:'90vh', overflow:'auto', boxShadow:'var(--shadow-modal)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid var(--color-border)' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600 }}>{title}</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--color-border)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-muted)' }}>×</button>
        </div>
        <div style={{ padding:'20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,.5)', backdropFilter:'blur(3px)' }}>
      <Card style={{ padding:24, maxWidth:360, width:'100%' }}>
        <p style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Confirmar exclusão</p>
        <p style={{ fontSize:14, color:'var(--color-muted)', marginBottom:20 }}>{msg}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn variant="ghost" size="sm" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="danger" size="sm" onClick={onConfirm}>Excluir</Btn>
        </div>
      </Card>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toaster({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  return (
    <div style={{ position:'fixed', bottom:80, right:16, zIndex:2000, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type==='success' ? '#10B981' : t.type==='error' ? '#EF4444' : '#6C63FF', color:'#fff', padding:'10px 16px', borderRadius:10, fontSize:14, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,.15)', pointerEvents:'all', cursor:'pointer', minWidth:200 }} onClick={() => remove(t.id)}>
          {t.type==='success'?'✓ ':t.type==='error'?'✕ ':'ℹ '}{t.msg}
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// NAV
// ══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS: { id: Screen; label: string; icon: string }[] = [
  { id:'dashboard',    label:'Dashboard',   icon:'⊞' },
  { id:'moradias',     label:'Moradias',    icon:'🏠' },
  { id:'moradores',    label:'Moradores',   icon:'👥' },
  { id:'despesas',     label:'Despesas',    icon:'💰' },
  { id:'tarefas',      label:'Tarefas',     icon:'✓' },
  { id:'calendario',   label:'Calendário',  icon:'📅' },
  { id:'compras',      label:'Compras',     icon:'🛒' },
  { id:'configuracoes',label:'Config.',     icon:'⚙' },
]

const BOTTOM_NAV = NAV_ITEMS.filter(n => ['dashboard','despesas','tarefas','compras','moradores'].includes(n.id))

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT SHELL
// ══════════════════════════════════════════════════════════════════════════════

function Shell({ screen, setScreen, children, activeMoradia, moradores }: {
  screen: Screen; setScreen: (s: Screen) => void
  children: React.ReactNode; activeMoradia?: Moradia; moradores: Morador[]
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ minHeight:'100vh', display:'flex' }}>
      {/* Desktop Sidebar */}
      <aside style={{ width:240, background:'#fff', borderRight:'1px solid var(--color-border)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100 }} className="hidden-mobile">
        <SidebarContent screen={screen} setScreen={setScreen} activeMoradia={activeMoradia} />
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)' }} onClick={() => setSidebarOpen(false)} />
          <aside style={{ width:260, background:'#fff', position:'relative', zIndex:1, display:'flex', flexDirection:'column', boxShadow:'4px 0 20px rgba(0,0,0,.15)' }}>
            <SidebarContent screen={screen} setScreen={s => { setScreen(s); setSidebarOpen(false) }} activeMoradia={activeMoradia} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex:1, marginLeft:0, paddingBottom:72, minHeight:'100vh', display:'flex', flexDirection:'column' }} className="main-with-sidebar">
        {/* Mobile top bar */}
        <div style={{ background:'#fff', borderBottom:'1px solid var(--color-border)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50 }} className="mobile-topbar">
          <button onClick={() => setSidebarOpen(true)} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:'var(--color-text)', padding:4 }}>☰</button>
          <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--color-primary)' }}>MoraJunto</span>
          {activeMoradia && <span style={{ marginLeft:'auto', fontSize:12, color:'var(--color-muted)', fontWeight:500 }}>{activeMoradia.nome}</span>}
        </div>

        <div style={{ flex:1, padding:'24px 16px', maxWidth:900, width:'100%', margin:'0 auto' }} className="content-pad">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid var(--color-border)', display:'flex', zIndex:200, paddingBottom:'env(safe-area-inset-bottom)' }} className="bottom-nav">
        {BOTTOM_NAV.map(n => (
          <button key={n.id} onClick={() => setScreen(n.id)} style={{ flex:1, border:'none', background:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 4px 6px', cursor:'pointer', color: screen===n.id ? 'var(--color-primary)' : 'var(--color-muted)', transition:'color .15s' }}>
            <span style={{ fontSize:18 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontWeight:600 }}>{n.label}</span>
            {screen===n.id && <div style={{ width:16, height:2, borderRadius:99, background:'var(--color-primary)', marginTop:1 }} />}
          </button>
        ))}
        <button onClick={() => setScreen('moradias')} style={{ flex:1, border:'none', background:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 4px 6px', cursor:'pointer', color: ['moradias','calendario','configuracoes'].includes(screen) ? 'var(--color-primary)' : 'var(--color-muted)' }}>
          <span style={{ fontSize:18 }}>⋯</span>
          <span style={{ fontSize:10, fontWeight:600 }}>Mais</span>
        </button>
      </nav>

      <style>{`
        @media(min-width:768px){
          .hidden-mobile{display:flex!important}
          .main-with-sidebar{margin-left:240px!important}
          .mobile-topbar{display:none!important}
          .bottom-nav{display:none!important}
          .content-pad{padding:32px 32px!important}
        }
      `}</style>
    </div>
  )
}

function SidebarContent({ screen, setScreen, activeMoradia }: { screen: Screen; setScreen: (s: Screen) => void; activeMoradia?: Moradia }) {
  return (
    <>
      <div style={{ padding:'24px 20px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'var(--color-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏡</div>
          <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--color-primary)' }}>MoraJunto</span>
        </div>
        {activeMoradia && (
          <div style={{ marginTop:12, padding:'8px 10px', background:'var(--color-primary-light)', borderRadius:8 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--color-primary)', opacity:.7, marginBottom:1 }}>MORADIA ATIVA</p>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--color-primary)' }}>{activeMoradia.nome}</p>
            <p style={{ fontSize:11, color:'var(--color-primary)', opacity:.7 }}>{activeMoradia.endereco}</p>
          </div>
        )}
      </div>
      <nav style={{ flex:1, padding:'4px 12px' }}>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={() => setScreen(n.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'none', background: screen===n.id ? 'var(--color-primary-light)' : 'transparent', color: screen===n.id ? 'var(--color-primary)' : 'var(--color-muted)', fontWeight: screen===n.id ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:2, textAlign:'left', transition:'all .15s' }}>
            <span style={{ fontSize:16, width:20, textAlign:'center' }}>{n.icon}</span>
            {n.label}
            {screen===n.id && <div style={{ marginLeft:'auto', width:4, height:16, borderRadius:99, background:'var(--color-primary)' }} />}
          </button>
        ))}
      </nav>
      <div style={{ padding:'16px 20px 24px', borderTop:'1px solid var(--color-border)' }}>
        <p style={{ fontSize:12, color:'var(--color-muted)' }}>v1.0.0 · MoraJunto</p>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [tab, setTab] = useState<'login'|'cadastro'>('login')
  const [form, setForm] = useState({ nome:'', email:'maria@email.com', senha:'••••••••' })

  function s(k: string, v: string) { setForm(f=>({...f,[k]:v})) }

  return (
    <div style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr' }} className="login-grid">
      {/* Left panel */}
      <div style={{ background:'var(--color-primary)', padding:48, display:'flex', flexDirection:'column', justifyContent:'center', color:'#fff' }} className="login-left">
        <div style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight:700, marginBottom:8 }}>MoraJunto</div>
        <p style={{ fontSize:18, opacity:.85, marginBottom:48, lineHeight:1.5 }}>Gestão descomplicada<br/>para moradias compartilhadas.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {['Divida despesas sem drama','Organize tarefas domésticas','Gerencie compras em grupo'].map(t => (
            <div key={t} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✓</div>
              <span style={{ opacity:.9, fontSize:15 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:32, background:'var(--color-bg)' }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ display:'flex', gap:4, marginBottom:28, background:'var(--color-border)', borderRadius:10, padding:4 }}>
            {(['login','cadastro'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'8px', borderRadius:7, border:'none', background:tab===t?'#fff':'transparent', fontWeight:600, fontSize:14, color:tab===t?'var(--color-text)':'var(--color-muted)', cursor:'pointer', boxShadow:tab===t?'0 1px 4px rgba(0,0,0,.1)':undefined, transition:'all .15s', fontFamily:'var(--font-sans)' }}>
                {t === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {tab === 'cadastro' && (
              <Field label="Nome completo">
                <Inp placeholder="Maria Santos" value={form.nome} onChange={e => s('nome', e.target.value)} />
              </Field>
            )}
            <Field label="E-mail">
              <Inp type="email" value={form.email} onChange={e => s('email', e.target.value)} />
            </Field>
            <Field label="Senha">
              <Inp type="password" value={form.senha} onChange={e => s('senha', e.target.value)} />
            </Field>
            {tab === 'login' && (
              <a href="#" style={{ fontSize:13, color:'var(--color-primary)', textAlign:'right', textDecoration:'none', fontWeight:600 }}>Esqueceu a senha?</a>
            )}
            <Btn size="lg" full onClick={onLogin}>{tab === 'login' ? 'Entrar na conta' : 'Criar conta'}</Btn>
            {tab === 'login' && (
              <p style={{ textAlign:'center', fontSize:13, color:'var(--color-muted)' }}>
                Acesso demo: <strong>maria@email.com</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-grid { grid-template-columns: 1fr 1fr; }
        .login-left { display: flex; }
        @media(max-width:640px){
          .login-grid{ grid-template-columns:1fr!important; }
          .login-left{ display:none!important; }
        }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

function DashboardScreen({ moradias, moradores, despesas, tarefas, compras, setScreen, activeMoradiaId }: {
  moradias: Moradia[]; moradores: Morador[]; despesas: Despesa[]
  tarefas: Tarefa[]; compras: Compra[]; setScreen: (s: Screen) => void; activeMoradiaId: string
}) {
  const m = moradores.filter(r => r.moradiaId === activeMoradiaId)
  const d = despesas.filter(x => x.moradiaId === activeMoradiaId)
  const t = tarefas.filter(x => x.moradiaId === activeMoradiaId)
  const c = compras.filter(x => x.moradiaId === activeMoradiaId)
  const totalDespesas = d.reduce((s,x)=>s+x.valor,0)
  const pendentes = t.filter(x=>x.status==='pendente').length
  const comprasFaltando = c.filter(x=>!x.feito).length

  const balanco = useMemo(() => {
    const map: Record<string,number> = {}
    m.forEach(r => { map[r.id]=0 })
    d.forEach(dep => {
      const parte = dep.moradorIds.length > 0 ? dep.valor / dep.moradorIds.length : 0
      dep.moradorIds.forEach(id => { if(map[id]!==undefined) map[id] -= parte })
      if(map[dep.pagadorId] !== undefined) map[dep.pagadorId] += dep.valor
    })
    return map
  }, [d, m])

  const StatCard = ({ label, value, sub, color, screen }: { label: string; value: string; sub: string; color: string; screen: Screen }) => (
    <button onClick={() => setScreen(screen)} style={{ background:'#fff', borderRadius:'var(--radius-card)', border:'1px solid var(--color-border)', padding:'16px 20px', textAlign:'left', cursor:'pointer', width:'100%', transition:'box-shadow .15s', boxShadow:'var(--shadow-card)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow='0 4px 20px rgba(108,99,255,.15)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow='var(--shadow-card)')}>
      <p style={{ fontSize:12, fontWeight:600, color:'var(--color-muted)', marginBottom:8 }}>{label}</p>
      <p style={{ fontSize:22, fontWeight:800, color, fontFamily:'var(--font-display)', marginBottom:2 }}>{value}</p>
      <p style={{ fontSize:12, color:'var(--color-muted)' }}>{sub}</p>
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:600, marginBottom:4 }}>Bom dia, Maria! 👋</h1>
        <p style={{ color:'var(--color-muted)', fontSize:15 }}>Aqui está o resumo da sua moradia.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
        <StatCard label="DESPESAS DO MÊS" value={fmt(totalDespesas)} sub={`${d.length} lançamentos`} color="var(--color-primary)" screen="despesas" />
        <StatCard label="TAREFAS PENDENTES" value={String(pendentes)} sub={`de ${t.length} tarefas`} color="#F59E0B" screen="tarefas" />
        <StatCard label="ITENS PARA COMPRAR" value={String(comprasFaltando)} sub={`${c.length-comprasFaltando} já comprados`} color="#10B981" screen="compras" />
        <StatCard label="MORADORES" value={String(m.length)} sub="na moradia ativa" color="#6C63FF" screen="moradores" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }} className="dash-grid">
        {/* Balanço */}
        <Card style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:15 }}>Balanço por morador</h3>
            <Btn size="sm" variant="secondary" onClick={() => setScreen('despesas')}>Ver tudo</Btn>
          </div>
          {m.length === 0 ? <EmptyState icon="👤" title="Sem moradores" /> : m.map(r => {
            const saldo = balanco[r.id] || 0
            const c = COLORS[r.colorIdx % COLORS.length]
            return (
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <Avatar nome={r.nome} colorIdx={r.colorIdx} size={32} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nome.split(' ')[0]}</p>
                  <div style={{ height:4, background:'var(--color-border)', borderRadius:99, marginTop:3 }}>
                    <div style={{ height:'100%', width:`${Math.min(100, Math.abs(saldo)/totalDespesas*100 || 0)}%`, background: saldo>=0?'#10B981':'#EF4444', borderRadius:99 }} />
                  </div>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color: saldo>=0?'#10B981':'#EF4444', whiteSpace:'nowrap' }}>{saldo>=0?'+':''}{fmt(saldo)}</span>
              </div>
            )
          })}
        </Card>

        {/* Tarefas recentes */}
        <Card style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:15 }}>Tarefas de hoje</h3>
            <Btn size="sm" variant="secondary" onClick={() => setScreen('tarefas')}>Ver tudo</Btn>
          </div>
          {t.slice(0,4).map(tarefa => {
            const r = moradores.find(x => x.id === tarefa.moradorId)
            const cor = r ? COLORS[r.colorIdx % COLORS.length] : COLORS[0]
            return (
              <div key={tarefa.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background: tarefa.status==='feito'?'#10B981':cor.hex, flexShrink:0 }} />
                <p style={{ fontSize:13, flex:1, textDecoration:tarefa.status==='feito'?'line-through':'none', color:tarefa.status==='feito'?'var(--color-muted)':'var(--color-text)', fontWeight:500 }}>{tarefa.nome}</p>
                {r && <Pill label={r.nome.split(' ')[0]} colorIdx={r.colorIdx} size="xs" />}
              </div>
            )
          })}
          {t.length === 0 && <p style={{ fontSize:13, color:'var(--color-muted)' }}>Nenhuma tarefa.</p>}
        </Card>
      </div>

      {/* Compras recentes */}
      <Card style={{ padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ fontWeight:700, fontSize:15 }}>Lista de compras</h3>
          <Btn size="sm" variant="secondary" onClick={() => setScreen('compras')}>Ver lista completa</Btn>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {c.filter(x=>!x.feito).slice(0,8).map(x => (
            <span key={x.id} style={{ padding:'4px 12px', borderRadius:99, background:'var(--color-bg)', border:'1px solid var(--color-border)', fontSize:13, fontWeight:500 }}>
              {x.item}
            </span>
          ))}
          {c.filter(x=>!x.feito).length === 0 && <p style={{ fontSize:13, color:'var(--color-muted)' }}>Tudo comprado! 🎉</p>}
        </div>
      </Card>

      {/* Quick actions */}
      <div style={{ marginTop:16 }}>
        <p style={{ fontSize:12, fontWeight:700, color:'var(--color-muted)', marginBottom:8 }}>AÇÕES RÁPIDAS</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {[
            { label:'Nova despesa', screen:'despesas' as Screen, icon:'💰' },
            { label:'Nova tarefa', screen:'tarefas' as Screen, icon:'✓' },
            { label:'Adicionar à lista', screen:'compras' as Screen, icon:'🛒' },
            { label:'Ver calendário', screen:'calendario' as Screen, icon:'📅' },
          ].map(a => (
            <Btn key={a.label} variant="white" size="sm" onClick={() => setScreen(a.screen)}>
              {a.icon} {a.label}
            </Btn>
          ))}
        </div>
      </div>

      <style>{`.dash-grid{grid-template-columns:1fr 1fr}@media(max-width:600px){.dash-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MORADIAS SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function MoradiasScreen({ moradias, setMoradias, moradores, despesas, activeMoradiaId, setActiveMoradiaId, toast }: {
  moradias: Moradia[]; setMoradias: React.Dispatch<React.SetStateAction<Moradia[]>>
  moradores: Morador[]; despesas: Despesa[]; activeMoradiaId: string; setActiveMoradiaId: (id: string) => void
  toast: (msg: string, type?: Toast['type']) => void
}) {
  const [modal, setModal] = useState<null|'new'|Moradia>(null)
  const [confirm, setConfirm] = useState<string|null>(null)
  const [form, setForm] = useState({ nome:'', endereco:'', descricao:'' })

  function openNew() { setForm({ nome:'', endereco:'', descricao:'' }); setModal('new') }
  function openEdit(m: Moradia) { setForm({ nome:m.nome, endereco:m.endereco, descricao:m.descricao }); setModal(m) }
  function save() {
    if(!form.nome.trim()) return
    if(modal === 'new') {
      const id = uid()
      setMoradias(p => [...p, { id, ...form }])
      setActiveMoradiaId(id)
      toast('Moradia criada!', 'success')
    } else {
      setMoradias(p => p.map(m => m.id === (modal as Moradia).id ? {...m,...form} : m))
      toast('Moradia atualizada!', 'success')
    }
    setModal(null)
  }
  function del(id: string) {
    setMoradias(p => p.filter(m => m.id !== id))
    if(activeMoradiaId === id) setActiveMoradiaId(moradias.find(m=>m.id!==id)?.id||'')
    toast('Moradia excluída.', 'info')
    setConfirm(null)
  }

  return (
    <div>
      <PageHeader title="Minhas Moradias" subtitle="Gerencie todas as suas moradias compartilhadas." action={<Btn onClick={openNew}>+ Nova Moradia</Btn>} />
      {moradias.length === 0 && <Card><EmptyState icon="🏠" title="Nenhuma moradia ainda" subtitle="Crie sua primeira moradia para começar." action={<Btn onClick={openNew}>Criar moradia</Btn>} /></Card>}
      <div style={{ display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))' }}>
        {moradias.map(m => {
          const mrs = moradores.filter(r => r.moradiaId === m.id)
          const total = despesas.filter(d => d.moradiaId === m.id).reduce((s,d)=>s+d.valor,0)
          const isActive = m.id === activeMoradiaId
          return (
            <Card key={m.id} style={{ padding:20, border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', position:'relative', overflow:'hidden' }}>
              {isActive && <div style={{ position:'absolute', top:12, right:12 }}><Badge label="Ativa" color="var(--color-primary)" /></div>}
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, marginBottom:4 }}>{m.nome}</h3>
              <p style={{ fontSize:13, color:'var(--color-muted)', marginBottom:12 }}>{m.endereco}</p>
              <div style={{ display:'flex', gap:-6, marginBottom:12 }}>
                {mrs.slice(0,5).map((r,i) => <div key={r.id} style={{ marginLeft: i>0?-8:0, zIndex:5-i, position:'relative' }}><Avatar nome={r.nome} colorIdx={r.colorIdx} size={28} /></div>)}
                {mrs.length > 5 && <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--color-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, marginLeft:-8, color:'var(--color-muted)' }}>+{mrs.length-5}</div>}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:16, color:'var(--color-muted)' }}>
                <span>{mrs.length} morador{mrs.length!==1?'es':''}</span>
                <span style={{ fontWeight:700, color:'var(--color-text)' }}>{fmt(total)}/mês</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <Btn size="sm" variant={isActive?'primary':'secondary'} onClick={() => setActiveMoradiaId(m.id)} style={{ flex:1 }}>
                  {isActive ? '✓ Selecionada' : 'Selecionar'}
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(m)}>✏️</Btn>
                {moradias.length > 1 && <Btn size="sm" variant="danger" onClick={() => setConfirm(m.id)}>🗑️</Btn>}
              </div>
            </Card>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal==='new'?'Nova Moradia':'Editar Moradia'} onClose={() => setModal(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nome da moradia *"><Inp value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Casa da Galera" /></Field>
            <Field label="Endereço"><Inp value={form.endereco} onChange={e=>setForm(f=>({...f,endereco:e.target.value}))} placeholder="Rua das Flores, 42 – Bairro" /></Field>
            <Field label="Descrição"><Textarea value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Breve descrição..." /></Field>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmDialog msg="Tem certeza que deseja excluir esta moradia? Todos os dados serão perdidos." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MORADORES SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function MoradoresScreen({ moradores, setMoradores, moradiaId, toast }: {
  moradores: Morador[]; setMoradores: React.Dispatch<React.SetStateAction<Morador[]>>; moradiaId: string
  toast: (msg: string, type?: Toast['type']) => void
}) {
  const [modal, setModal] = useState<null|'new'|Morador>(null)
  const [confirm, setConfirm] = useState<string|null>(null)
  const [form, setForm] = useState({ nome:'', email:'', colorIdx:0 })
  const mrs = moradores.filter(r => r.moradiaId === moradiaId)

  function openNew() {
    const used = mrs.map(r=>r.colorIdx)
    const next = COLORS.findIndex((_,i) => !used.includes(i))
    setForm({ nome:'', email:'', colorIdx: next>=0?next:0 }); setModal('new')
  }
  function openEdit(r: Morador) { setForm({ nome:r.nome, email:r.email, colorIdx:r.colorIdx }); setModal(r) }
  function save() {
    if(!form.nome.trim()) return
    if(modal==='new') { setMoradores(p => [...p, { id:uid(), moradiaId, ...form }]); toast('Morador adicionado!','success') }
    else { setMoradores(p => p.map(r => r.id===(modal as Morador).id ? {...r,...form} : r)); toast('Morador atualizado!','success') }
    setModal(null)
  }
  function del(id: string) {
    setMoradores(p => p.filter(r => r.id !== id))
    toast('Morador removido.','info'); setConfirm(null)
  }

  return (
    <div>
      <PageHeader title="Moradores" subtitle={`${mrs.length} morador${mrs.length!==1?'es':''} nesta moradia.`} action={<Btn onClick={openNew}>+ Adicionar</Btn>} />
      {mrs.length === 0 && <Card><EmptyState icon="👥" title="Nenhum morador" subtitle="Adicione os moradores da sua casa." action={<Btn onClick={openNew}>Adicionar morador</Btn>} /></Card>}
      <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))' }}>
        {mrs.map(r => {
          const c = COLORS[r.colorIdx % COLORS.length]
          return (
            <Card key={r.id} style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <Avatar nome={r.nome} colorIdx={r.colorIdx} size={48} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{r.nome}</p>
                  <p style={{ fontSize:12, color:'var(--color-muted)', marginBottom:8 }}>{r.email}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:c.hex }} />
                    <span style={{ fontSize:11, color:c.hex, fontWeight:600 }}>{c.name}</span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, marginTop:14 }}>
                <Btn size="sm" variant="secondary" onClick={() => openEdit(r)} style={{ flex:1 }}>Editar</Btn>
                <Btn size="sm" variant="danger" onClick={() => setConfirm(r.id)}>Remover</Btn>
              </div>
            </Card>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal==='new'?'Novo Morador':'Editar Morador'} onClose={() => setModal(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nome completo *"><Inp value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Maria Santos" /></Field>
            <Field label="E-mail"><Inp type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="maria@email.com" /></Field>
            <Field label="Cor do morador">
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                {COLORS.map((c,i) => (
                  <button key={i} onClick={() => setForm(f=>({...f,colorIdx:i}))} title={c.name} style={{ width:28, height:28, borderRadius:'50%', background:c.hex, border: i===form.colorIdx?'3px solid var(--color-text)':'2px solid transparent', cursor:'pointer', transition:'transform .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform='scale(1.15)')}
                    onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')} />
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                <Avatar nome={form.nome||'?'} colorIdx={form.colorIdx} size={32} />
                <span style={{ fontSize:13, color:'var(--color-muted)' }}>Prévia do avatar</span>
              </div>
            </Field>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmDialog msg="Remover este morador da moradia? Isso não exclui as despesas associadas." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DESPESAS SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function DespesasScreen({ despesas, setDespesas, moradores, moradiaId, toast }: {
  despesas: Despesa[]; setDespesas: React.Dispatch<React.SetStateAction<Despesa[]>>
  moradores: Morador[]; moradiaId: string; toast: (msg: string, type?: Toast['type']) => void
}) {
  const [modal, setModal] = useState<null|'new'|Despesa>(null)
  const [confirm, setConfirm] = useState<string|null>(null)
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [form, setForm] = useState({ nome:'', categoria:'Outros', valor:'', data:today(), descricao:'', moradorIds:[] as string[], pagadorId:'' })

  const mrs = moradores.filter(r => r.moradiaId === moradiaId)
  const deps = despesas.filter(d => d.moradiaId === moradiaId)
  const total = deps.reduce((s,d)=>s+d.valor,0)

  function openNew() {
    setForm({ nome:'', categoria:'Outros', valor:'', data:today(), descricao:'', moradorIds: mrs.map(r=>r.id), pagadorId: mrs[0]?.id||'' })
    setModal('new')
  }
  function openEdit(d: Despesa) {
    setForm({ nome:d.nome, categoria:d.categoria, valor:String(d.valor), data:d.data, descricao:d.descricao, moradorIds:d.moradorIds, pagadorId:d.pagadorId })
    setModal(d)
  }
  function save() {
    if(!form.nome.trim()||!form.valor) return
    const entry: Despesa = { id: modal==='new'?uid():(modal as Despesa).id, moradiaId, nome:form.nome, categoria:form.categoria, valor:Number(form.valor), data:form.data, descricao:form.descricao, moradorIds:form.moradorIds, pagadorId:form.pagadorId }
    if(modal==='new') { setDespesas(p=>[...p,entry]); toast('Despesa adicionada!','success') }
    else { setDespesas(p=>p.map(d=>d.id===entry.id?entry:d)); toast('Despesa atualizada!','success') }
    setModal(null)
  }
  function del(id: string) { setDespesas(p=>p.filter(d=>d.id!==id)); toast('Despesa excluída.','info'); setConfirm(null) }
  function toggleMorador(id: string) { setForm(f=>({ ...f, moradorIds: f.moradorIds.includes(id)?f.moradorIds.filter(x=>x!==id):[...f.moradorIds,id] })) }

  const balanco = useMemo(() => {
    const map: Record<string,number> = {}
    mrs.forEach(r => { map[r.id]=0 })
    deps.forEach(dep => {
      const parte = dep.moradorIds.length>0?dep.valor/dep.moradorIds.length:0
      dep.moradorIds.forEach(id => { if(map[id]!==undefined) map[id]-=parte })
      if(map[dep.pagadorId]!==undefined) map[dep.pagadorId]+=dep.valor
    })
    return map
  }, [deps, mrs])

  return (
    <div>
      <PageHeader title="Despesas" subtitle={`Total do mês: ${fmt(total)}`} action={<Btn onClick={openNew}>+ Nova Despesa</Btn>} />

      {/* Balanço por morador */}
      {mrs.length > 0 && (
        <div style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', marginBottom:20 }}>
          {mrs.map(r => {
            const saldo = balanco[r.id]||0
            const c = COLORS[r.colorIdx%COLORS.length]
            return (
              <div key={r.id} style={{ background:c.light, borderRadius:'var(--radius-card)', padding:'14px 16px', border:`1px solid ${c.hex}30` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <Avatar nome={r.nome} colorIdx={r.colorIdx} size={26} />
                  <p style={{ fontSize:13, fontWeight:600, color:c.hex }}>{r.nome.split(' ')[0]}</p>
                </div>
                <p style={{ fontSize:18, fontWeight:800, color: saldo>=0?'#10B981':'#EF4444' }}>{saldo>=0?'+':''}{fmt(saldo)}</p>
                <p style={{ fontSize:11, color:'var(--color-muted)', marginTop:2 }}>{saldo>=0?'a receber':'a pagar'}</p>
              </div>
            )
          })}
        </div>
      )}

      {deps.length===0 && <Card><EmptyState icon="💰" title="Nenhuma despesa" subtitle="Registre a primeira despesa da moradia." action={<Btn onClick={openNew}>Adicionar despesa</Btn>} /></Card>}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {deps.sort((a,b)=>b.data.localeCompare(a.data)).map(d => {
          const pagador = mrs.find(r=>r.id===d.pagadorId)
          const isExp = expandedId===d.id
          const parte = d.moradorIds.length>0 ? d.valor/d.moradorIds.length : d.valor
          return (
            <Card key={d.id} style={{ overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }} onClick={() => setExpandedId(isExp?null:d.id)}>
                <div style={{ width:40, height:40, borderRadius:10, background:'var(--color-primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {d.categoria==='Aluguel'?'🏠':d.categoria==='Alimentação'?'🛒':d.categoria==='Energia'?'⚡':d.categoria==='Internet'?'📶':d.categoria==='Água'?'💧':'📋'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <p style={{ fontWeight:700, fontSize:15 }}>{d.nome}</p>
                    <Badge label={d.categoria} color="var(--color-primary)" />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                    <p style={{ fontSize:12, color:'var(--color-muted)' }}>{d.data}</p>
                    {pagador && <><span style={{ color:'var(--color-border)' }}>·</span><p style={{ fontSize:12, color:'var(--color-muted)' }}>Pago por <span style={{ fontWeight:600, color:COLORS[pagador.colorIdx%COLORS.length].hex }}>{pagador.nome.split(' ')[0]}</span></p></>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700 }}>{fmt(d.valor)}</p>
                  <p style={{ fontSize:11, color:'var(--color-muted)' }}>{fmt(parte)}/pessoa</p>
                </div>
                <span style={{ color:'var(--color-muted)', fontSize:12, marginLeft:4 }}>{isExp?'▲':'▼'}</span>
              </div>

              {isExp && (
                <div style={{ borderTop:'1px solid var(--color-border)', padding:'14px 16px', background:'var(--color-bg)' }}>
                  {d.descricao && <p style={{ fontSize:13, color:'var(--color-muted)', marginBottom:12 }}>{d.descricao}</p>}
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--color-muted)', marginBottom:8 }}>DIVISÃO INDIVIDUAL</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                    {d.moradorIds.map(id => {
                      const r = mrs.find(x=>x.id===id)
                      if(!r) return null
                      const c = COLORS[r.colorIdx%COLORS.length]
                      return (
                        <div key={id} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:99, background:c.light, border:`1px solid ${c.hex}40` }}>
                          <Avatar nome={r.nome} colorIdx={r.colorIdx} size={20} />
                          <span style={{ fontSize:13, fontWeight:600, color:c.hex }}>{r.nome.split(' ')[0]}</span>
                          <span style={{ fontSize:13, fontWeight:800, color:c.hex }}>{fmt(parte)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(d)}>✏️ Editar</Btn>
                    <Btn size="sm" variant="danger" onClick={() => setConfirm(d.id)}>🗑️ Excluir</Btn>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal==='new'?'Nova Despesa':'Editar Despesa'} onClose={() => setModal(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Nome *"><Inp value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Conta de Luz" /></Field>
              <Field label="Categoria">
                <Sel value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                  {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                </Sel>
              </Field>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Valor total (R$) *"><Inp type="number" step="0.01" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} placeholder="0,00" /></Field>
              <Field label="Data"><Inp type="date" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} /></Field>
            </div>
            <Field label="Descrição"><Textarea value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Detalhes opcionais..." /></Field>
            <Field label="Pago por">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {mrs.map(r => {
                  const c=COLORS[r.colorIdx%COLORS.length]; const sel=form.pagadorId===r.id
                  return <button key={r.id} onClick={() => setForm(f=>({...f,pagadorId:r.id}))} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:99, border: sel?`2px solid ${c.hex}`:'1.5px solid var(--color-border)', background: sel?c.light:'#fff', fontWeight: sel?700:500, fontSize:13, cursor:'pointer', color: sel?c.hex:'var(--color-text)', fontFamily:'var(--font-sans)' }}>
                    <Avatar nome={r.nome} colorIdx={r.colorIdx} size={18} />{r.nome.split(' ')[0]}
                  </button>
                })}
              </div>
            </Field>
            <Field label="Dividir entre" hint={form.moradorIds.length>0&&form.valor ? `${fmt(Number(form.valor)/form.moradorIds.length)} por pessoa` : undefined}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {mrs.map(r => {
                  const c=COLORS[r.colorIdx%COLORS.length]; const sel=form.moradorIds.includes(r.id)
                  return <button key={r.id} onClick={() => toggleMorador(r.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:99, border: sel?`2px solid ${c.hex}`:'1.5px solid var(--color-border)', background: sel?c.light:'#fff', fontWeight: sel?700:500, fontSize:13, cursor:'pointer', color: sel?c.hex:'var(--color-text)', fontFamily:'var(--font-sans)' }}>
                    <Avatar nome={r.nome} colorIdx={r.colorIdx} size={18} />{r.nome.split(' ')[0]}{sel&&form.valor&&<span style={{ fontSize:11, opacity:.8 }}> · {fmt(Number(form.valor)/form.moradorIds.length)}</span>}
                  </button>
                })}
              </div>
            </Field>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmDialog msg="Excluir esta despesa permanentemente?" onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAREFAS SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function TarefasScreen({ tarefas, setTarefas, moradores, moradiaId, toast }: {
  tarefas: Tarefa[]; setTarefas: React.Dispatch<React.SetStateAction<Tarefa[]>>
  moradores: Morador[]; moradiaId: string; toast: (msg: string, type?: Toast['type']) => void
}) {
  const [modal, setModal] = useState<null|'new'|Tarefa>(null)
  const [confirm, setConfirm] = useState<string|null>(null)
  const [filter, setFilter] = useState<'todas'|'pendente'|'feito'>('todas')
  const [form, setForm] = useState({ nome:'', descricao:'', moradorId:'', horario:'09:00', diasSemana:[] as number[], repeteSemanal:false, data:today() })

  const mrs = moradores.filter(r=>r.moradiaId===moradiaId)
  const items = tarefas.filter(t=>t.moradiaId===moradiaId)
  const shown = items.filter(t=>filter==='todas'||t.status===filter)

  function openNew() { setForm({ nome:'', descricao:'', moradorId:mrs[0]?.id||'', horario:'09:00', diasSemana:[], repeteSemanal:false, data:today() }); setModal('new') }
  function openEdit(t: Tarefa) { setForm({ nome:t.nome, descricao:t.descricao, moradorId:t.moradorId, horario:t.horario, diasSemana:t.diasSemana, repeteSemanal:t.repeteSemanal, data:t.data }); setModal(t) }
  function save() {
    if(!form.nome.trim()) return
    const entry: Tarefa = { id: modal==='new'?uid():(modal as Tarefa).id, moradiaId, ...form, status: modal==='new'?'pendente':(modal as Tarefa).status }
    if(modal==='new') { setTarefas(p=>[...p,entry]); toast('Tarefa criada!','success') }
    else { setTarefas(p=>p.map(t=>t.id===entry.id?entry:t)); toast('Tarefa atualizada!','success') }
    setModal(null)
  }
  function del(id: string) { setTarefas(p=>p.filter(t=>t.id!==id)); toast('Tarefa excluída.','info'); setConfirm(null) }
  function toggle(id: string) { setTarefas(p=>p.map(t=>t.id===id?{...t,status:t.status==='feito'?'pendente':'feito'}:t)) }
  function toggleDia(d: number) { setForm(f=>({...f,diasSemana:f.diasSemana.includes(d)?f.diasSemana.filter(x=>x!==d):[...f.diasSemana,d].sort()})) }

  return (
    <div>
      <PageHeader title="Tarefas Domésticas" subtitle={`${items.filter(t=>t.status==='pendente').length} pendente${items.filter(t=>t.status==='pendente').length!==1?'s':''}`} action={<Btn onClick={openNew}>+ Nova Tarefa</Btn>} />

      {/* Legenda de cores */}
      {mrs.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
          {mrs.map(r => <Pill key={r.id} label={r.nome.split(' ')[0]} colorIdx={r.colorIdx} />)}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:'var(--color-border)', borderRadius:10, padding:4, width:'fit-content' }}>
        {(['todas','pendente','feito'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 16px', borderRadius:7, border:'none', background:filter===f?'#fff':'transparent', fontWeight:600, fontSize:13, color:filter===f?'var(--color-text)':'var(--color-muted)', cursor:'pointer', boxShadow:filter===f?'0 1px 4px rgba(0,0,0,.1)':undefined, transition:'all .15s', fontFamily:'var(--font-sans)' }}>
            {f==='todas'?'Todas':f==='pendente'?'Pendentes':'Concluídas'}
          </button>
        ))}
      </div>

      {shown.length===0 && <Card><EmptyState icon="✅" title="Nenhuma tarefa" subtitle="Crie tarefas para organizar a rotina da casa." action={filter==='todas'?<Btn onClick={openNew}>Criar tarefa</Btn>:undefined} /></Card>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[...shown].sort((a,b)=>Number(a.status==='feito')-Number(b.status==='feito')).map(t => {
          const r = mrs.find(x=>x.id===t.moradorId)
          const c = r ? COLORS[r.colorIdx%COLORS.length] : COLORS[0]
          const done = t.status==='feito'
          return (
            <div key={t.id} style={{ background:'var(--color-surface)', borderRadius:12, border:`1px solid var(--color-border)`, borderLeft:`4px solid ${done?'#10B981':c.hex}`, padding:'12px 16px', display:'flex', gap:12, alignItems:'flex-start', opacity: done?.65:1, transition:'opacity .2s' }}>
              <button onClick={() => toggle(t.id)} style={{ width:22, height:22, borderRadius:'50%', border: done?'none':`2px solid ${c.hex}`, background: done?'#10B981':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:2, transition:'all .15s', color:'#fff', fontSize:12 }}>
                {done && '✓'}
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:600, fontSize:15, textDecoration:done?'line-through':'none', color:done?'var(--color-muted)':'var(--color-text)' }}>{t.nome}</p>
                {t.descricao && <p style={{ fontSize:12, color:'var(--color-muted)', marginTop:2 }}>{t.descricao}</p>}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                  {r && <Pill label={r.nome.split(' ')[0]} colorIdx={r.colorIdx} size="xs" />}
                  {t.horario && <Badge label={t.horario} color="var(--color-muted)" />}
                  {t.diasSemana.length > 0 && <Badge label={t.diasSemana.map(d=>DAYS_SHORT[d]).join(', ')} color="var(--color-primary)" />}
                  {t.repeteSemanal && <Badge label="Semanal" color="#10B981" />}
                </div>
              </div>
              <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(t)}>✏️</Btn>
                <Btn size="sm" variant="danger" onClick={() => setConfirm(t.id)}>🗑️</Btn>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal==='new'?'Nova Tarefa':'Editar Tarefa'} onClose={() => setModal(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nome da tarefa *"><Inp value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Limpar cozinha" /></Field>
            <Field label="Descrição"><Textarea value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Detalhes sobre a tarefa..." /></Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Responsável">
                <Sel value={form.moradorId} onChange={e=>setForm(f=>({...f,moradorId:e.target.value}))}>
                  {mrs.map(r=><option key={r.id} value={r.id}>{r.nome}</option>)}
                </Sel>
              </Field>
              <Field label="Horário"><Inp type="time" value={form.horario} onChange={e=>setForm(f=>({...f,horario:e.target.value}))} /></Field>
            </div>
            <Field label="Data"><Inp type="date" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} /></Field>
            <Field label="Dias da semana">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {DAYS_SHORT.map((d,i) => {
                  const sel = form.diasSemana.includes(i)
                  return <button key={i} onClick={() => toggleDia(i)} style={{ padding:'5px 10px', borderRadius:8, border: sel?'2px solid var(--color-primary)':'1.5px solid var(--color-border)', background: sel?'var(--color-primary-light)':'#fff', color: sel?'var(--color-primary)':'var(--color-muted)', fontWeight: sel?700:500, fontSize:12, cursor:'pointer', fontFamily:'var(--font-sans)' }}>{d}</button>
                })}
              </div>
            </Field>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, fontWeight:500 }}>
              <input type="checkbox" checked={form.repeteSemanal} onChange={e=>setForm(f=>({...f,repeteSemanal:e.target.checked}))} style={{ width:16, height:16, accentColor:'var(--color-primary)' }} />
              Repetir semanalmente
            </label>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmDialog msg="Excluir esta tarefa permanentemente?" onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CALENDÁRIO SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function CalendarioScreen({ tarefas, moradores, moradiaId, setTarefas }: {
  tarefas: Tarefa[]; moradores: Morador[]; moradiaId: string
  setTarefas: React.Dispatch<React.SetStateAction<Tarefa[]>>
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [view, setView] = useState<'mensal'|'semanal'>('mensal')
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d
  })

  const mrs = moradores.filter(r=>r.moradiaId===moradiaId)
  const items = tarefas.filter(t=>t.moradiaId===moradiaId)

  function tarefasForDate(dateStr: string) {
    const dow = new Date(dateStr+'T12:00:00').getDay()
    return items.filter(t => t.data===dateStr || t.diasSemana.includes(dow))
  }

  function toggleFeito(id: string) { setTarefas(p=>p.map(t=>t.id===id?{...t,status:t.status==='feito'?'pendente':'feito'}:t)) }

  // Monthly view
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()

  function prevM() { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  function nextM() { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  // Weekly view
  const weekDates = Array.from({length:7},(_,i)=>{
    const d = new Date(weekStart); d.setDate(d.getDate()+i)
    return d.toISOString().slice(0,10)
  })
  function prevW() { const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d) }
  function nextW() { const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d) }

  const todayStr = now.toISOString().slice(0,10)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600 }}>Calendário</h1>
          <p style={{ color:'var(--color-muted)', fontSize:14 }}>Tarefas por dia</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ display:'flex', gap:4, background:'var(--color-border)', borderRadius:10, padding:4 }}>
            {(['mensal','semanal'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:view===v?'#fff':'transparent', fontWeight:600, fontSize:13, color:view===v?'var(--color-text)':'var(--color-muted)', cursor:'pointer', fontFamily:'var(--font-sans)', transition:'all .15s' }}>
                {v==='mensal'?'Mensal':'Semanal'}
              </button>
            ))}
          </div>
          <button onClick={view==='mensal'?prevM:prevW} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--color-border)', background:'#fff', cursor:'pointer', fontSize:14 }}>‹</button>
          <span style={{ fontSize:14, fontWeight:600, minWidth:140, textAlign:'center' }}>
            {view==='mensal' ? `${MONTHS_PT[month]} ${year}` : `${weekDates[0].slice(8,10)}/${weekDates[0].slice(5,7)} – ${weekDates[6].slice(8,10)}/${weekDates[6].slice(5,7)}`}
          </span>
          <button onClick={view==='mensal'?nextM:nextW} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--color-border)', background:'#fff', cursor:'pointer', fontSize:14 }}>›</button>
        </div>
      </div>

      {/* Legenda */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
        {mrs.map(r => <Pill key={r.id} label={r.nome.split(' ')[0]} colorIdx={r.colorIdx} />)}
      </div>

      {view === 'mensal' ? (
        <Card style={{ overflow:'hidden' }}>
          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--color-border)' }}>
            {DAYS_SHORT.map(d => <div key={d} style={{ padding:'10px 4px', textAlign:'center', fontSize:12, fontWeight:700, color:'var(--color-muted)' }}>{d}</div>)}
          </div>
          {/* Days */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`} style={{ minHeight:80, borderRight:'1px solid var(--color-border)', borderBottom:'1px solid var(--color-border)', background:'var(--color-bg)', opacity:.5 }} />)}
            {Array.from({length:daysInMonth}).map((_,i) => {
              const day = i+1
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const dayTasks = tarefasForDate(dateStr)
              const isToday = dateStr === todayStr
              return (
                <div key={day} style={{ minHeight:80, borderRight:'1px solid var(--color-border)', borderBottom:'1px solid var(--color-border)', padding:'4px 4px 4px', position:'relative', background: isToday?'#FAFAFE':'#fff' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:'50%', fontSize:12, fontWeight: isToday?800:500, background:isToday?'var(--color-primary)':'transparent', color:isToday?'#fff':'var(--color-text)', marginBottom:2 }}>{day}</span>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {dayTasks.slice(0,3).map(t => {
                      const r = mrs.find(x=>x.id===t.moradorId)
                      const c = r ? COLORS[r.colorIdx%COLORS.length] : COLORS[0]
                      return (
                        <button key={t.id} onClick={() => toggleFeito(t.id)} title={`${t.nome} – ${r?.nome||''} (clique para alternar)`} style={{ display:'flex', alignItems:'center', gap:3, padding:'1px 5px', borderRadius:4, background: t.status==='feito'?'#F3F4F6':c.light, border:'none', cursor:'pointer', width:'100%', textAlign:'left' }}>
                          {t.status==='feito' && <span style={{ fontSize:9, color:'#10B981', flexShrink:0 }}>✓</span>}
                          <span style={{ fontSize:10, fontWeight:600, color:t.status==='feito'?'#9CA3AF':c.hex, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textDecoration:t.status==='feito'?'line-through':'none', flex:1 }}>{t.nome}</span>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:t.status==='feito'?'#9CA3AF':c.hex, flexShrink:0 }} />
                        </button>
                      )
                    })}
                    {dayTasks.length > 3 && <span style={{ fontSize:10, color:'var(--color-muted)', paddingLeft:4 }}>+{dayTasks.length-3} mais</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        // Weekly view
        <Card style={{ overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--color-border)' }}>
            {weekDates.map((dateStr,i) => {
              const d = new Date(dateStr+'T12:00:00')
              const isToday = dateStr===todayStr
              return (
                <div key={dateStr} style={{ padding:'10px 6px', textAlign:'center', borderRight: i<6?'1px solid var(--color-border)':undefined }}>
                  <p style={{ fontSize:11, color:'var(--color-muted)', fontWeight:600 }}>{DAYS_SHORT[d.getDay()]}</p>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:isToday?'var(--color-primary)':'transparent', color:isToday?'#fff':'var(--color-text)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:isToday?800:500, margin:'4px auto 0' }}>{d.getDate()}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', minHeight:300 }}>
            {weekDates.map((dateStr,i) => {
              const dayTasks = tarefasForDate(dateStr)
              return (
                <div key={dateStr} style={{ padding:'8px 4px', borderRight:i<6?'1px solid var(--color-border)':undefined, display:'flex', flexDirection:'column', gap:4 }}>
                  {dayTasks.map(t => {
                    const r = mrs.find(x=>x.id===t.moradorId)
                    const c = r ? COLORS[r.colorIdx%COLORS.length] : COLORS[0]
                    return (
                      <button key={t.id} onClick={() => toggleFeito(t.id)} style={{ display:'flex', flexDirection:'column', padding:'5px 6px', borderRadius:6, background:t.status==='feito'?'#F3F4F6':c.light, border:'none', cursor:'pointer', textAlign:'left', gap:2 }}>
                        {t.status==='feito' && <span style={{ fontSize:9, color:'#10B981' }}>✓ Feito</span>}
                        <span style={{ fontSize:11, fontWeight:700, color:t.status==='feito'?'#9CA3AF':c.hex, textDecoration:t.status==='feito'?'line-through':'none' }}>{t.nome}</span>
                        {r && <span style={{ fontSize:10, color:t.status==='feito'?'#9CA3AF':c.hex, opacity:.8 }}>{r.nome.split(' ')[0]}</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPRAS SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function ComprasScreen({ compras, setCompras, moradiaId, toast }: {
  compras: Compra[]; setCompras: React.Dispatch<React.SetStateAction<Compra[]>>; moradiaId: string
  toast: (msg: string, type?: Toast['type']) => void
}) {
  const [modal, setModal] = useState<null|'new'|Compra>(null)
  const [confirm, setConfirm] = useState<string|null>(null)
  const [form, setForm] = useState({ item:'', quantidade:'' })
  const [newItem, setNewItem] = useState('')
  const [newQtd, setNewQtd] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const items = compras.filter(c=>c.moradiaId===moradiaId)
  const pendentes = items.filter(c=>!c.feito)
  const comprados = items.filter(c=>c.feito)

  function addQuick() {
    if(!newItem.trim()) return
    setCompras(p=>[...p,{id:uid(),moradiaId,item:newItem.trim(),quantidade:newQtd.trim(),feito:false}])
    toast('Item adicionado!','success'); setNewItem(''); setNewQtd(''); inputRef.current?.focus()
  }
  function openEdit(c: Compra) { setForm({item:c.item,quantidade:c.quantidade}); setModal(c) }
  function save() {
    if(!form.item.trim()) return
    setCompras(p=>p.map(c=>c.id===(modal as Compra).id?{...c,...form}:c))
    toast('Item atualizado!','success'); setModal(null)
  }
  function del(id: string) { setCompras(p=>p.filter(c=>c.id!==id)); toast('Item removido.','info'); setConfirm(null) }
  function toggle(id: string) { setCompras(p=>p.map(c=>c.id===id?{...c,feito:!c.feito}:c)) }

  const ItemRow = ({ c }: { c: Compra }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--color-surface)', borderRadius:10, border:'1px solid var(--color-border)', opacity:c.feito?.55:1, transition:'opacity .2s' }}>
      <button onClick={() => toggle(c.id)} style={{ width:22, height:22, borderRadius:6, border: c.feito?'none':'2px solid var(--color-border)', background: c.feito?'#10B981':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, color:'#fff', fontSize:13, transition:'all .15s' }}>
        {c.feito && '✓'}
      </button>
      <p style={{ flex:1, fontSize:14, fontWeight:500, textDecoration:c.feito?'line-through':'none', color:c.feito?'var(--color-muted)':'var(--color-text)' }}>{c.item}</p>
      {c.quantidade && <span style={{ fontSize:12, color:'var(--color-muted)', background:'var(--color-bg)', padding:'2px 8px', borderRadius:99 }}>{c.quantidade}</span>}
      <div style={{ display:'flex', gap:4 }}>
        {!c.feito && <Btn size="sm" variant="ghost" onClick={() => openEdit(c)}>✏️</Btn>}
        <Btn size="sm" variant="danger" onClick={() => setConfirm(c.id)}>🗑️</Btn>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Lista de Compras" subtitle={`${pendentes.length} item${pendentes.length!==1?'s':''} pendente${pendentes.length!==1?'s':''}`} action={null} />

      {/* Quick add */}
      <Card style={{ padding:16, marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Inp ref={inputRef} value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addQuick()} placeholder="Nome do item..." style={{ flex:'1 1 160px' }} />
          <Inp value={newQtd} onChange={e=>setNewQtd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addQuick()} placeholder="Qtd. (ex: 2 kg)" style={{ flex:'0 1 120px' }} />
          <Btn onClick={addQuick}>+ Adicionar</Btn>
        </div>
      </Card>

      {items.length===0 && <Card><EmptyState icon="🛒" title="Lista vazia" subtitle="Adicione itens à lista de compras da sua moradia." /></Card>}

      {pendentes.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'var(--color-muted)', marginBottom:8 }}>PARA COMPRAR — {pendentes.length}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {pendentes.map(c => <ItemRow key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {comprados.length > 0 && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ flex:1, height:1, background:'var(--color-border)' }} />
            <p style={{ fontSize:12, fontWeight:700, color:'var(--color-muted)' }}>COMPRADOS — {comprados.length}</p>
            <div style={{ flex:1, height:1, background:'var(--color-border)' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {comprados.map(c => <ItemRow key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {modal && modal!=='new' && (
        <Modal title="Editar Item" onClose={() => setModal(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Item *"><Inp value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} placeholder="Nome do item" /></Field>
            <Field label="Quantidade"><Inp value={form.quantidade} onChange={e=>setForm(f=>({...f,quantidade:e.target.value}))} placeholder="Ex: 2 kg, 3 unid." /></Field>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn onClick={save}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmDialog msg="Remover este item da lista?" onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ══════════════════════════════════════════════════════════════════════════════

function ConfiguracoesScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div>
      <PageHeader title="Configurações" subtitle="Ajustes da conta e preferências." action={null} />
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {[
          { label:'Perfil', desc:'Nome, e-mail, foto', icon:'👤' },
          { label:'Notificações', desc:'Lembretes de tarefas e despesas', icon:'🔔' },
          { label:'Segurança', desc:'Senha e privacidade', icon:'🔒' },
          { label:'Aparência', desc:'Tema e idioma', icon:'🎨' },
          { label:'Exportar dados', desc:'Baixar histórico em CSV', icon:'📄' },
          { label:'Ajuda e suporte', desc:'Central de ajuda', icon:'❓' },
        ].map(item => (
          <Card key={item.label} style={{ padding:'14px 18px' }}>
            <button style={{ display:'flex', alignItems:'center', gap:14, width:'100%', border:'none', background:'none', cursor:'pointer', textAlign:'left' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'var(--color-primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:600, fontSize:15, fontFamily:'var(--font-sans)' }}>{item.label}</p>
                <p style={{ fontSize:13, color:'var(--color-muted)', fontFamily:'var(--font-sans)' }}>{item.desc}</p>
              </div>
              <span style={{ color:'var(--color-muted)', fontSize:16 }}>›</span>
            </button>
          </Card>
        ))}
        <div style={{ marginTop:8 }}>
          <Btn variant="danger" size="lg" full onClick={onLogout}>Sair da conta</Btn>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--color-muted)' }}>MoraJunto v1.0.0 · Feito com ♥</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE HEADER
// ══════════════════════════════════════════════════════════════════════════════

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:600, marginBottom:2 }}>{title}</h1>
        {subtitle && <p style={{ color:'var(--color-muted)', fontSize:14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [activeMoradiaId, setActiveMoradiaId] = useState('mor1')
  const [moradias, setMoradias] = useState<Moradia[]>(SEED_MORADIAS)
  const [moradores, setMoradores] = useState<Morador[]>(SEED_MORADORES)
  const [despesas, setDespesas] = useState<Despesa[]>(SEED_DESPESAS)
  const [tarefas, setTarefas] = useState<Tarefa[]>(SEED_TAREFAS)
  const [compras, setCompras] = useState<Compra[]>(SEED_COMPRAS)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((msg: string, type: Toast['type'] = 'success') => {
    const id = uid()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])

  const activeMoradia = moradias.find(m => m.id === activeMoradiaId)

  if(!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />

  return (
    <>
      <Shell screen={screen} setScreen={setScreen} activeMoradia={activeMoradia} moradores={moradores}>
        {screen==='dashboard' && <DashboardScreen moradias={moradias} moradores={moradores} despesas={despesas} tarefas={tarefas} compras={compras} setScreen={setScreen} activeMoradiaId={activeMoradiaId} />}
        {screen==='moradias' && <MoradiasScreen moradias={moradias} setMoradias={setMoradias} moradores={moradores} despesas={despesas} activeMoradiaId={activeMoradiaId} setActiveMoradiaId={setActiveMoradiaId} toast={toast} />}
        {screen==='moradores' && <MoradoresScreen moradores={moradores} setMoradores={setMoradores} moradiaId={activeMoradiaId} toast={toast} />}
        {screen==='despesas' && <DespesasScreen despesas={despesas} setDespesas={setDespesas} moradores={moradores.filter(r=>r.moradiaId===activeMoradiaId)} moradiaId={activeMoradiaId} toast={toast} />}
        {screen==='tarefas' && <TarefasScreen tarefas={tarefas} setTarefas={setTarefas} moradores={moradores} moradiaId={activeMoradiaId} toast={toast} />}
        {screen==='calendario' && <CalendarioScreen tarefas={tarefas} moradores={moradores} moradiaId={activeMoradiaId} setTarefas={setTarefas} />}
        {screen==='compras' && <ComprasScreen compras={compras} setCompras={setCompras} moradiaId={activeMoradiaId} toast={toast} />}
        {screen==='configuracoes' && <ConfiguracoesScreen onLogout={() => setLoggedIn(false)} />}
      </Shell>
      <Toaster toasts={toasts} remove={id => setToasts(p=>p.filter(t=>t.id!==id))} />
    </>
  )
}
