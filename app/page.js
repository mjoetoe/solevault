'use client'

import { useState, useEffect, useCallback } from 'react'

const INIT_DATA = [
  { id:'1', name:'Jordan 1 Retro High OG SP Travis Scott Mocha',          size:44.5, retail:161,  market:920,  trend:'up',     advice:'good', note:'Blijft sterk door Travis Scott hype',          lastUpdated: null },
  { id:'2', name:'Jordan 1 Retro Low OG SP Travis Scott Canary (Womens)', size:44,   retail:138,  market:283,  trend:'stable', advice:'wait', note:'Markt stabiliseert, prijs kan stijgen',        lastUpdated: null },
  { id:'3', name:'Jordan 1 Retro Low OG SP Travis Scott Black Phantom',   size:40,   retail:138,  market:550,  trend:'up',     advice:'good', note:'Maat 40 is relatief zeldzaam',                 lastUpdated: null },
  { id:'4', name:'Nike Air Force 1 Low Travis Scott Cactus Jack',          size:44.5, retail:147,  market:500,  trend:'stable', advice:'good', note:'Realistisch marktprijsniveau',                 lastUpdated: null },
  { id:'5', name:'Nike Dunk Low Off-White Pine Green',                     size:44.5, retail:156,  market:550,  trend:'down',   advice:'wait', note:'OW Dunks dalen licht na piek',                 lastUpdated: null },
  { id:'6', name:'Jordan 1 Retro High OG Chicago Lost and Found',          size:44,   retail:170,  market:620,  trend:'stable', advice:'good', note:'Chicago colorway blijft tijdloos gewild',      lastUpdated: null },
  { id:'7', name:'Converse Chuck Taylor All Star 70 Hi Off-White',         size:44,   retail:120,  market:267,  trend:'stable', advice:'wait', note:'Stabiel maar geen piek verwacht',              lastUpdated: null },
  { id:'8', name:'Jordan 1 Retro Low OG SP Travis Scott Shy Pink',         size:44,   retail:143,  market:370,  trend:'up',     advice:'wait', note:'Gloednieuw — markt nog aan het vormen',        lastUpdated: null },
  { id:'9', name:"Nike SB Dunk Low Ben & Jerry's Chunky Dunky",            size:43,   retail:92,   market:1550, trend:'stable', advice:'good', note:'Absolute grail, houdt waarde uitstekend',      lastUpdated: null },
]

function eur(v) {
  if (v == null || isNaN(v)) return '–'
  return '€' + Math.round(v).toLocaleString('nl-BE')
}

function timeAgo(ts) {
  if (!ts) return null
  const diff = Math.floor((Date.now() - ts) / 60000)
  if (diff < 1) return 'zojuist'
  if (diff < 60) return `${diff}m geleden`
  if (diff < 1440) return `${Math.floor(diff/60)}u geleden`
  return `${Math.floor(diff/1440)}d geleden`
}

export default function Home() {
  const [sneakers, setSneakers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [name, setName] = useState('')
  const [size, setSize] = useState('')
  const [cost, setCost] = useState('')
  const [err, setErr] = useState('')
  const [adding, setAdding] = useState(false)
  const [refreshingId, setRefreshingId] = useState(null)
  const [refreshingAll, setRefreshingAll] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('solevault_v4')
      if (saved) {
        setSneakers(JSON.parse(saved))
      } else {
        setSneakers(INIT_DATA.map(s => ({ ...s })))
      }
    } catch {
      setSneakers(INIT_DATA.map(s => ({ ...s })))
    }
  }, [])

  useEffect(() => {
    if (sneakers.length > 0) localStorage.setItem('solevault_v4', JSON.stringify(sneakers))
  }, [sneakers])

  const fetchPrice = useCallback(async (sneaker) => {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sneaker.name, size: sneaker.size }),
    })
    if (!res.ok) throw new Error('fetch failed')
    return res.json()
  }, [])

  const refreshOne = useCallback(async (id) => {
    const sneaker = sneakers.find(s => s.id === id)
    if (!sneaker) return
    setRefreshingId(id)
    try {
      const info = await fetchPrice(sneaker)
      setSneakers(prev => prev.map(s => s.id === id
        ? { ...s, retail: info.retailPrice || s.retail, market: info.marketPrice, trend: info.trend, note: info.note, advice: info.sellAdvice, lastUpdated: Date.now() }
        : s
      ))
    } catch {}
    setRefreshingId(null)
  }, [sneakers, fetchPrice])

  const refreshAll = useCallback(async () => {
    setRefreshingAll(true)
    for (const s of sneakers) {
      setRefreshingId(s.id)
      try {
        const info = await fetchPrice(s)
        setSneakers(prev => prev.map(x => x.id === s.id
          ? { ...x, retail: info.retailPrice || x.retail, market: info.marketPrice, trend: info.trend, note: info.note, advice: info.sellAdvice, lastUpdated: Date.now() }
          : x
        ))
      } catch {}
      await new Promise(r => setTimeout(r, 400))
    }
    setRefreshingId(null)
    setRefreshingAll(false)
  }, [sneakers, fetchPrice])

  const addSneaker = useCallback(async () => {
    if (!name.trim()) { setErr('Vul een naam in.'); return }
    const s = parseFloat(size)
    if (!s || s < 35 || s > 55) { setErr('Vul een geldige EU maat in.'); return }
    setErr('')
    const retail = cost !== '' ? parseFloat(cost) : null
    const newItem = { id: Date.now().toString(), name: name.trim(), size: s, retail, market: null, trend: null, note: null, advice: null, loading: true, lastUpdated: null }
    setSneakers(prev => [...prev, newItem])
    setName(''); setSize(''); setCost('')
    setAdding(true)
    try {
      const info = await fetchPrice(newItem)
      setSneakers(prev => prev.map(x => x.id === newItem.id
        ? { ...x, retail: retail ?? info.retailPrice, market: info.marketPrice, trend: info.trend, note: info.note, advice: info.sellAdvice, loading: false, lastUpdated: Date.now() }
        : x
      ))
    } catch {
      setSneakers(prev => prev.map(x => x.id === newItem.id ? { ...x, loading: false, note: 'Kon prijs niet ophalen', advice: 'wait' } : x))
    }
    setAdding(false)
  }, [name, size, cost, fetchPrice])

  const deleteSneaker = useCallback((id) => {
    setSneakers(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const filtered = filter === 'all' ? sneakers : sneakers.filter(s => s.advice === filter)
  const totalMarket = sneakers.reduce((a, s) => a + (s.market || 0), 0)
  const totalRetail = sneakers.reduce((a, s) => a + (s.retail || 0), 0)
  const totalProfit = totalMarket - totalRetail
  const roi = totalRetail > 0 ? Math.round((totalProfit / totalRetail) * 100) : 0
  const selected = sneakers.find(s => s.id === selectedId)

  return (
    <div>
      {/* NAV */}
      <nav style={{
        position:'sticky', top:0, zIndex:200,
        background:'rgba(247,248,250,0.9)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid #e4e7ed',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 2rem', height:56,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div style={{
            width:28, height:28, background:'#2563eb', borderRadius:7,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, color:'white', fontWeight:700,
          }}>S</div>
          <span style={{fontSize:15, fontWeight:600, letterSpacing:'-0.3px'}}>SoleVault</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button
            onClick={refreshAll}
            disabled={refreshingAll}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'5px 12px', borderRadius:20,
              border:'1px solid #e4e7ed', background:'white',
              fontSize:12, fontWeight:600, color:'#2563eb',
              cursor: refreshingAll ? 'not-allowed' : 'pointer',
              opacity: refreshingAll ? 0.6 : 1,
              transition:'all 0.15s',
            }}
          >
            <span style={{display:'inline-block', animation: refreshingAll ? 'spin 0.8s linear infinite' : 'none'}}>↻</span>
            {refreshingAll ? 'Bijwerken...' : 'Alle prijzen updaten'}
          </button>
          <span style={{
            fontFamily:'DM Mono, monospace', fontSize:11, color:'#6b7280',
            background:'#f2f3f6', border:'1px solid #e4e7ed',
            padding:'3px 8px', borderRadius:20,
          }}>
            {new Date().toLocaleDateString('nl-BE', {day:'2-digit', month:'short', year:'numeric'}).toUpperCase()}
          </span>
        </div>
      </nav>

      <div style={{display:'grid', gridTemplateColumns:'1fr 360px', minHeight:'calc(100vh - 56px)'}}>
        {/* LEFT */}
        <div style={{padding:'2rem', borderRight:'1px solid #e4e7ed', overflowY:'auto'}}>
          {/* STATS */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:'1.75rem'}}>
            {[
              { label:'Paren', value: sneakers.length, sub:'In collectie', color:'#0f1117' },
              { label:'Marktwaarde', value: eur(totalMarket), sub:'Lowest ask', color:'#2563eb' },
              { label:'Totale winst', value: (totalProfit>=0?'+':'')+eur(totalProfit), sub:'vs. retail', color: totalProfit>=0?'#16a34a':'#dc2626' },
              { label:'Gem. ROI', value: (roi>=0?'+':'')+roi+'%', sub:'Op aankoopprijs', color: roi>=0?'#16a34a':'#dc2626' },
            ].map(stat => (
              <div key={stat.label} style={{
                background:'white', border:'1px solid #e4e7ed', borderRadius:12,
                padding:'1rem 1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                transition:'box-shadow 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='translateY(0)' }}
              >
                <div style={{fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6}}>{stat.label}</div>
                <div style={{fontSize:22, fontWeight:700, letterSpacing:'-0.5px', color:stat.color, lineHeight:1}}>{stat.value}</div>
                <div style={{fontSize:11, color:'#9ca3af', marginTop:4}}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* TOOLBAR */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
            <div style={{fontSize:13, fontWeight:600, color:'#6b7280'}}>{filtered.length} sneaker{filtered.length!==1?'s':''}</div>
            <div style={{display:'flex', background:'#f2f3f6', border:'1px solid #e4e7ed', borderRadius:8, padding:3, gap:2}}>
              {[['all','Alle'],['good','↑ Verkoop nu'],['wait','◎ Wacht']].map(([f,label]) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  fontFamily:'DM Sans, sans-serif', fontSize:12, fontWeight:500,
                  padding:'4px 12px', border:'none', borderRadius:6,
                  background: filter===f ? 'white' : 'none',
                  color: filter===f ? '#0f1117' : '#6b7280',
                  cursor:'pointer',
                  boxShadow: filter===f ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition:'all 0.15s',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* LIST */}
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {filtered.length === 0 && (
              <div style={{background:'white', border:'1px dashed #d0d5df', borderRadius:12, padding:'2.5rem', textAlign:'center', color:'#9ca3af', fontSize:13}}>
                Geen sneakers gevonden voor dit filter
              </div>
            )}
            {filtered.map((s, i) => {
              const isRefreshing = refreshingId === s.id
              const profit = (s.retail!=null&&s.market!=null) ? s.market-s.retail : null
              const pct = profit!=null&&s.retail>0 ? Math.round((profit/s.retail)*100) : null
              const isPos = profit==null||profit>=0
              const isSelected = selectedId === s.id

              if (s.loading || isRefreshing) return (
                <div key={s.id} style={{
                  background:'white', border:'1px solid #e4e7ed', borderRadius:12,
                  padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
                  boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div style={{
                    width:16, height:16, border:'2px solid #e4e7ed',
                    borderTopColor:'#2563eb', borderRadius:'50%',
                    animation:'spin 0.7s linear infinite', flexShrink:0,
                  }} />
                  <div>
                    <div style={{fontSize:13, fontWeight:600}}>{s.name}</div>
                    <div style={{fontSize:11, color:'#9ca3af', marginTop:2}}>Marktprijs ophalen…</div>
                  </div>
                </div>
              )

              return (
                <div key={s.id}
                  onClick={() => setSelectedId(isSelected ? null : s.id)}
                  style={{
                    background: isSelected ? '#eff4ff' : 'white',
                    border: isSelected ? '1px solid #bfcffe' : '1px solid #e4e7ed',
                    borderRadius:12, padding:'14px 16px',
                    display:'grid', gridTemplateColumns:'32px 1fr auto',
                    gap:12, alignItems:'center', cursor:'pointer',
                    boxShadow: isSelected ? '0 0 0 1px #bfcffe, 0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition:'all 0.15s',
                    position:'relative', overflow:'hidden',
                    animation:`slideIn 0.2s ease ${i*0.03}s both`,
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor='#d0d5df'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.07)' }}}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor='#e4e7ed'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)' }}}
                >
                  {isSelected && <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'#2563eb'}} />}
                  <div style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'#9ca3af', textAlign:'center', fontWeight:500}}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  <div>
                    <div style={{fontSize:13.5, fontWeight:600, marginBottom:3, letterSpacing:'-0.2px', lineHeight:1.3}}>{s.name}</div>
                    <div style={{display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#9ca3af'}}>
                      <span style={{background:'#f2f3f6', border:'1px solid #e4e7ed', borderRadius:4, padding:'1px 6px', fontFamily:'DM Mono,monospace', fontSize:10, fontWeight:500}}>EU {s.size}</span>
                      <span style={{
                        fontSize:10, fontWeight:500, padding:'1px 6px', borderRadius:4,
                        color: s.trend==='up'?'#16a34a':s.trend==='down'?'#dc2626':'#6b7280',
                        background: s.trend==='up'?'#f0fdf4':s.trend==='down'?'#fef2f2':'#f2f3f6',
                      }}>
                        {s.trend==='up'?'↑ Stijgend':s.trend==='down'?'↓ Dalend':'→ Stabiel'}
                      </span>
                      <span>Retail {eur(s.retail)}</span>
                      {s.lastUpdated && <span style={{color:'#d0d5df'}}>· {timeAgo(s.lastUpdated)}</span>}
                    </div>
                  </div>
                  <div style={{textAlign:'right', minWidth:110}}>
                    <div style={{fontSize:17, fontWeight:700, letterSpacing:'-0.4px', lineHeight:1}}>{eur(s.market)}</div>
                    <div style={{fontFamily:'DM Mono,monospace', fontSize:11, marginTop:3, fontWeight:500, color:isPos?'#16a34a':'#dc2626'}}>
                      {profit!=null?(isPos?'+':'')+eur(profit):''} {pct!=null?'('+pct+'%)':''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{padding:'2rem', overflowY:'auto', position:'sticky', top:56, height:'calc(100vh - 56px)'}}>
          {/* ADD FORM */}
          <div style={{background:'white', border:'1px solid #e4e7ed', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', marginBottom:16}}>
            <div style={{padding:'14px 16px 12px', borderBottom:'1px solid #e4e7ed', display:'flex', alignItems:'center', gap:8}}>
              <div style={{width:22,height:22,background:'#eff4ff',border:'1px solid #bfcffe',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#2563eb',fontWeight:700}}>+</div>
              <div style={{fontSize:13, fontWeight:600}}>Sneaker toevoegen</div>
            </div>
            <div style={{padding:'14px 16px'}}>
              {[
                { id:'name', label:'Naam', placeholder:'Jordan 1 Retro High OG Chicago', value:name, setter:setName, type:'text' },
              ].map(f => (
                <div key={f.id} style={{marginBottom:10}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{f.label}</label>
                  <input value={f.value} onChange={e=>f.setter(e.target.value)} type={f.type} placeholder={f.placeholder}
                    onKeyDown={e=>e.key==='Enter'&&addSneaker()}
                    style={{width:'100%',height:36,padding:'0 10px',fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:500,background:'#f2f3f6',border:'1px solid #e4e7ed',borderRadius:8,color:'#0f1117',outline:'none'}}
                  />
                </div>
              ))}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10}}>
                {[
                  { id:'size', label:'Maat EU', placeholder:'42', value:size, setter:setSize, type:'number' },
                  { id:'cost', label:'Retail (€)', placeholder:'180', value:cost, setter:setCost, type:'number' },
                ].map(f => (
                  <div key={f.id}>
                    <label style={{display:'block',fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{f.label}</label>
                    <input value={f.value} onChange={e=>f.setter(e.target.value)} type={f.type} placeholder={f.placeholder}
                      onKeyDown={e=>e.key==='Enter'&&addSneaker()}
                      style={{width:'100%',height:36,padding:'0 10px',fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:500,background:'#f2f3f6',border:'1px solid #e4e7ed',borderRadius:8,color:'#0f1117',outline:'none'}}
                    />
                  </div>
                ))}
              </div>
              <button onClick={addSneaker} disabled={adding} style={{
                width:'100%', height:36, background: adding?'#93c5fd':'#2563eb', color:'white',
                border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif',
                fontSize:13, fontWeight:600, cursor:adding?'not-allowed':'pointer',
                transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
                {adding ? <><span style={{display:'inline-block',animation:'spin 0.8s linear infinite'}}>↻</span> Ophalen...</> : '+ Toevoegen'}
              </button>
              {err && <div style={{fontSize:11,color:'#dc2626',marginTop:4,fontWeight:500}}>{err}</div>}
              <div style={{fontSize:11,color:'#9ca3af',marginTop:6,lineHeight:1.5}}>Retail leeg laten = AI zoekt het op</div>
            </div>
          </div>

          {/* DETAIL */}
          <div style={{background:'white', border:'1px solid #e4e7ed', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div style={{padding:'14px 16px 12px', borderBottom:'1px solid #e4e7ed', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <div style={{width:22,height:22,background:'#f2f3f6',border:'1px solid #e4e7ed',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>◈</div>
                <div style={{fontSize:13, fontWeight:600}}>Details</div>
              </div>
              {selected && (
                <button onClick={() => refreshOne(selected.id)} disabled={refreshingId===selected.id} style={{
                  display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,
                  color:'#2563eb',background:'#eff4ff',border:'1px solid #bfcffe',
                  borderRadius:6,padding:'3px 8px',cursor:'pointer',
                }}>
                  <span style={{display:'inline-block',animation:refreshingId===selected.id?'spin 0.8s linear infinite':'none'}}>↻</span>
                  {refreshingId===selected.id ? 'Laden...' : 'Prijs updaten'}
                </button>
              )}
            </div>
            <div style={{padding:'14px 16px'}}>
              {!selected ? (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2.5rem 1rem',textAlign:'center'}}>
                  <div style={{width:44,height:44,background:'#f2f3f6',border:'1px solid #e4e7ed',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:12}}>👆</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#6b7280',marginBottom:4}}>Selecteer een sneaker</div>
                  <div style={{fontSize:12,color:'#9ca3af',lineHeight:1.5}}>Klik op een paar in de lijst<br/>voor uitgebreide details</div>
                </div>
              ) : (() => {
                const profit = (selected.retail!=null&&selected.market!=null) ? selected.market-selected.retail : null
                const pct = profit!=null&&selected.retail>0 ? Math.round((profit/selected.retail)*100) : null
                const isPos = profit==null||profit>=0
                const netto = selected.market ? Math.round(selected.market*0.88) : null

                return (
                  <div>
                    <div style={{fontSize:15,fontWeight:700,letterSpacing:'-0.3px',marginBottom:4,lineHeight:1.3}}>{selected.name}</div>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:16}}>
                      <span style={{fontFamily:'DM Mono,monospace',fontSize:10,fontWeight:500,padding:'2px 7px',borderRadius:4,background:'#f2f3f6',border:'1px solid #e4e7ed',color:'#6b7280'}}>EU {selected.size}</span>
                      <span style={{fontSize:10,fontWeight:500,padding:'2px 7px',borderRadius:4,
                        color:selected.trend==='up'?'#16a34a':selected.trend==='down'?'#dc2626':'#6b7280',
                        background:selected.trend==='up'?'#f0fdf4':selected.trend==='down'?'#fef2f2':'#f2f3f6',
                      }}>{selected.trend==='up'?'↑ Stijgend':selected.trend==='down'?'↓ Dalend':'→ Stabiel'}</span>
                      {selected.lastUpdated && <span style={{fontSize:10,color:'#d0d5df'}}>Updated {timeAgo(selected.lastUpdated)}</span>}
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                      {[
                        { label:'Retail', value:eur(selected.retail), sub:'Aankoopprijs', bg:'#f2f3f6', border:'#e4e7ed', col:'#0f1117', lcol:'#9ca3af' },
                        { label:'Marktwaarde', value:eur(selected.market), sub:'Lowest ask', bg:'#eff4ff', border:'#bfcffe', col:'#2563eb', lcol:'#93c5fd' },
                        { label:'Bruto winst', value:profit!=null?(isPos?'+':'')+eur(profit):'–', sub:pct!=null?(isPos?'+':'')+pct+'% op retail':'', bg:isPos?'#f0fdf4':'#fef2f2', border:isPos?'#bbf7d0':'#fca5a5', col:isPos?'#16a34a':'#dc2626', lcol:isPos?'#4ade80':'#f87171' },
                        { label:'Na fees (~12%)', value:eur(netto), sub:'Netto uitbetaald', bg:'#fffbeb', border:'#fde68a', col:'#d97706', lcol:'#fcd34d' },
                      ].map(b => (
                        <div key={b.label} style={{background:b.bg,border:`1px solid ${b.border}`,borderRadius:8,padding:'10px 12px'}}>
                          <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:b.lcol,marginBottom:4}}>{b.label}</div>
                          <div style={{fontSize:20,fontWeight:700,letterSpacing:'-0.5px',color:b.col,lineHeight:1}}>{b.value}</div>
                          <div style={{fontSize:10,color:b.lcol,marginTop:3,opacity:0.8}}>{b.sub}</div>
                        </div>
                      ))}
                    </div>

                    {selected.note && (
                      <div style={{
                        borderRadius:8, padding:'10px 12px',
                        display:'flex', alignItems:'flex-start', gap:10, marginBottom:12,
                        background:selected.advice==='good'?'#f0fdf4':'#fffbeb',
                        border:`1px solid ${selected.advice==='good'?'#bbf7d0':'#fde68a'}`,
                      }}>
                        <div style={{
                          width:22,height:22,borderRadius:6,flexShrink:0,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:11,fontWeight:700,color:'white',
                          background:selected.advice==='good'?'#16a34a':'#d97706',
                        }}>{selected.advice==='good'?'✓':'◎'}</div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:selected.advice==='good'?'#16a34a':'#d97706'}}>{selected.advice==='good'?'Goed verkoopmoment':'Wacht nog even'}</div>
                          <div style={{fontSize:11,color:'#6b7280',marginTop:2,lineHeight:1.4}}>{selected.note}</div>
                        </div>
                      </div>
                    )}

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                      {[
                        { label:'↗ StockX', action:()=>window.open(`https://stockx.com/search?s=${encodeURIComponent(selected.name)}`, '_blank') },
                        { label:'↗ Klekt', action:()=>window.open(`https://www.klekt.com/search?query=${encodeURIComponent(selected.name)}`, '_blank') },
                        { label:'Verwijder', action:()=>deleteSneaker(selected.id), danger:true },
                      ].map(b => (
                        <button key={b.label} onClick={b.action} style={{
                          height:32, border:'1px solid #e4e7ed', background:'#f2f3f6',
                          fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:600,
                          borderRadius:8, cursor:'pointer', transition:'all 0.15s',
                          color: b.danger ? '#dc2626' : '#6b7280',
                        }}
                          onMouseEnter={e=>{e.currentTarget.style.background='white';e.currentTarget.style.borderColor=b.danger?'#fca5a5':'#d0d5df'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#f2f3f6';e.currentTarget.style.borderColor='#e4e7ed'}}
                        >{b.label}</button>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        * { scrollbar-width: thin; scrollbar-color: #d0d5df transparent; }
        @media (max-width: 900px) {
          .app { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
