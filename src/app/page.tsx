'use client'
import { useState, useMemo, useCallback } from 'react'

interface ExchangeRates { bcv: number; usdt: number; p2p: number }
interface ProductForm { costUSD: string; quantity: string; length: string; width: string; height: string; weight: string }

const fmtUSD = (v: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(v)

const fmtVE = (v: number) => {
  const [i,d] = v.toFixed(2).split('.')
  return i.replace(/\B(?=(\d{3})+(?!\d))/g,'.') + ',' + d + ' Bs'
}

function Corner({p}:{p:'tl'|'tr'|'bl'|'br'}) {
  const s:Record<string,React.CSSProperties> = {
    tl:{top:0,left:0,borderTop:'2px solid #D4AF37',borderLeft:'2px solid #D4AF37',borderTopLeftRadius:'10px'},
    tr:{top:0,right:0,borderTop:'2px solid #D4AF37',borderRight:'2px solid #D4AF37',borderTopRightRadius:'10px'},
    bl:{bottom:0,left:0,borderBottom:'2px solid #D4AF37',borderLeft:'2px solid #D4AF37',borderBottomLeftRadius:'10px'},
    br:{bottom:0,right:0,borderBottom:'2px solid #D4AF37',borderRight:'2px solid #D4AF37',borderBottomRightRadius:'10px'}
  }
  return <div style={{position:'absolute',width:'18px',height:'18px',...s[p]}}/>
}

export default function Calc() {
  const [dark, setDark] = useState(true)
  const [rates, setRates] = useState<ExchangeRates>({bcv:78,usdt:78.5,p2p:681.69})
  const [form, setForm] = useState<ProductForm>({costUSD:'',quantity:'',length:'',width:'',height:'',weight:''})

  const chRate = useCallback((k:keyof ExchangeRates,v:string)=>{
    const n=parseFloat(v)
    if(!isNaN(n)&&n>=0) setRates(p=>({...p,[k]:n}))
    else if(v==='') setRates(p=>({...p,[k]:0}))
  },[])

  const chForm = useCallback((k:keyof ProductForm,v:string)=>{
    if(v===''||/^\d*\.?\d*$/.test(v)) setForm(p=>({...p,[k]:v}))
  },[])

  const cbm = useMemo(()=>{
    const l=parseFloat(form.length)||0, w=parseFloat(form.width)||0, h=parseFloat(form.height)||0
    return (l&&w&&h) ? (l*w*h)/1000000 : 0
  },[form.length,form.width,form.height])

  const calc = useMemo(()=>{
    const c=parseFloat(form.costUSD)||0, q=parseInt(form.quantity)||0
    const cif=c*q, seg=cif*0.015, ar=cif*0.15, ice=cif*0.10
    const iva=(cif+ar+ice)*0.16, ti=seg+ar+ice+iva, cf=15
    const total=cif+ti+cf, pv=total*1.30, pvebs=pv*rates.p2p
    return {cif,seg,ar,ice,iva,ti,cf,total,pv,pvebs,ok:c>0&&q>0}
  },[form.costUSD,form.quantity,rates.p2p])

  const th = dark ? 'dark' : 'light'
  const S = (s:React.CSSProperties)=>({...s})
  const cardBg = 'var(--bg-secondary)'
  const inp = (extra={}:React.CSSProperties):React.CSSProperties=>({
    width:'100%',background:'var(--bg-input)',border:'1px solid var(--border-color)',
    borderRadius:'8px',padding:'10px 12px',color:'var(--text-primary)',fontSize:'15px',
    fontWeight:600,outline:'none',transition:'border-color 0.2s',...extra
  })

  return (
    <div data-theme={th} style={{minHeight:'100vh',background:'var(--bg-primary)'}}>
      <div style={{maxWidth:'520px',margin:'0 auto',padding:'20px 16px 40px'}}>
        {/* Header */}
        <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 0 24px'}}>
          <div>
            <h1 style={{fontSize:'22px',fontWeight:800,letterSpacing:'3px',color:'var(--text-primary)',lineHeight:1.1}}>ZYNC ELECTRONICS</h1>
            <p style={{fontSize:'11px',color:'var(--text-muted)',letterSpacing:'1.5px',marginTop:'4px',textTransform:'uppercase'}}>Calculadora de Importación</p>
          </div>
          <button onClick={()=>setDark(!dark)} style={{width:'44px',height:'44px',borderRadius:'12px',border:'1px solid var(--border-color)',backgroundColor:cardBg,color:'var(--text-primary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px'}}>
            {dark?'☀️':'🌙'}
          </button>
        </header>

        {/* Rate Cards */}
        <section style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'24px'}}>
          {([['bcv','BCV','Banco Central'],['usdt','USDT','Tether'],['p2p','P2P','Efectivo']] as const).map(([k,lb,sl])=>(
            <div key={k} style={{background:cardBg,border:'1px solid var(--border-color)',borderRadius:'8px',padding:'12px 10px',textAlign:'center'}}>
              <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'1.2px',color:'var(--text-muted)',textTransform:'uppercase',marginBottom:'2px'}}>{lb}</div>
              <div style={{fontSize:'9px',color:'var(--text-muted)',marginBottom:'8px'}}>{sl}</div>
              <input type="number" value={rates[k as keyof ExchangeRates]} onChange={e=>chRate(k as keyof ExchangeRates,e.target.value)} style={{...inp({padding:'6px 4px',color:'var(--gold)',fontSize:'14px',textAlign:'center'})}} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border-color)'} step="0.01" min="0"/>
              <div style={{fontSize:'9px',color:'var(--text-muted)',marginTop:'3px'}}>Bs/USD</div>
            </div>
          ))}
        </section>

        {/* Product Form */}
        <section style={{background:cardBg,border:'1px solid var(--border-color)',borderRadius:'12px',padding:'20px',marginBottom:'24px'}}>
          <h2 style={{fontSize:'13px',fontWeight:700,letterSpacing:'1.5px',color:'var(--text-secondary)',textTransform:'uppercase',marginBottom:'16px',paddingBottom:'10px',borderBottom:'1px solid var(--border-color)'}}>Datos del Producto</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--text-muted)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.8px'}}>Costo USD</label>
              <input type="number" value={form.costUSD} onChange={e=>chForm('costUSD',e.target.value)} placeholder="0.00" style={inp()} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border-color)'} step="0.01" min="0"/>
            </div>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--text-muted)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.8px'}}>Cantidad</label>
              <input type="number" value={form.quantity} onChange={e=>chForm('quantity',e.target.value)} placeholder="0" style={inp()} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border-color)'} step="1" min="0"/>
            </div>
          </div>
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--text-muted)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.8px'}}>Dimensiones (cm)</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr auto 1fr',gap:'6px',alignItems:'center'}}>
              {(['length','Largo'],['width','Ancho'],['height','Alto'] as [string,string][]).map(([k,ph],i)=>(
                <>{i>0&&<span style={{color:'var(--text-muted)',fontSize:'16px',fontWeight:300}}>×</span>}<input key={k} type="number" value={form[k as keyof ProductForm]} onChange={e=>chForm(k as keyof ProductForm,e.target.value)} placeholder={ph} style={inp({padding:'10px 8px',fontSize:'14px',textAlign:'center'})} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border-color)'} step="0.1" min="0"/></>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--text-muted)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.8px'}}>CBM</label>
              <div style={{width:'100%',background:'var(--bg-tertiary)',border:'1px solid var(--border-color)',borderRadius:'8px',padding:'10px 12px',color:cbm>0?'var(--gold)':'var(--text-muted)',fontSize:'14px',fontWeight:600}}>{cbm>0?cbm.toFixed(6):'0.000000'}</div>
            </div>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--text-muted)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.8px'}}>Peso (kg)</label>
              <input type="number" value={form.weight} onChange={e=>chForm('weight',e.target.value)} placeholder="0.00" style={inp()} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border-color)'} step="0.1" min="0"/>
            </div>
          </div>
        </section>

        {/* Receipt */}
        {calc.ok && (
          <section style={{background:cardBg,border:'1px solid var(--border-color)',borderRadius:'12px',padding:'20px',marginBottom:'24px'}}>
            <h2 style={{fontSize:'13px',fontWeight:700,letterSpacing:'1.5px',color:'var(--text-secondary)',textTransform:'uppercase',marginBottom:'16px',paddingBottom:'10px',borderBottom:'1px solid var(--border-color)'}}>Desglose de Costos</h2>
            {[
              [1,'CIF (Costo × Cantidad)',calc.cif,false],
              [2,'Seguro (1.5%)',calc.seg,false],
              [3,'Arancel (15%)',calc.ar,false],
              [4,'ICE (10%)',calc.ice,false],
              [5,'IVA 16%',calc.iva,false],
              [6,'Total Impuestos',calc.ti,true],
              [7,'Costos Fijos',calc.cf,false],
              [8,'TOTAL GENERAL USD',calc.total,true]
            ].map(([n,lb,v,b]:[number,string,number,boolean])=>(
              <div key={n} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:n<8?'1px solid var(--border-color)':'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{width:'22px',height:'22px',borderRadius:'6px',backgroundColor:(n===6||n===8)?'rgba(212,175,55,0.15)':'var(--bg-input)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:(n===6||n===8)?'var(--gold)':'var(--text-muted)'}}>{n}</span>
                  <span style={{fontSize:'13px',fontWeight:b?700:500,color:b?'var(--text-primary)':'var(--text-secondary)'}}>{lb}</span>
                </div>
                <span style={{fontSize:'13px',fontWeight:b?700:600,color:b?'var(--text-primary)':'var(--text-secondary)',fontVariantNumeric:'tabular-nums'}}>{fmtUSD(v)}</span>
              </div>
            ))}
          </section>
        )}

        {/* PRECIO DE VENTA REC. */}
        {calc.ok && (
          <section style={{position:'relative',background:cardBg,borderRadius:'12px',padding:'28px 24px',marginBottom:'24px',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,borderRadius:'12px',padding:'2px',background:'linear-gradient(160deg,#e8cc6e,#D4AF37,#b8962e)',WebkitMask:'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',WebkitMaskComposite:'xor',maskComposite:'exclude',pointerEvents:'none'}}/>
            <Corner p="tl"/><Corner p="tr"/><Corner p="bl"/><Corner p="br"/>
            <div style={{position:'relative',zIndex:1,textAlign:'center'}}>
              <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'2px',color:'var(--text-muted)',textTransform:'uppercase',marginBottom:'8px'}}>9. Precio de Venta Recomendado</div>
              <div style={{fontSize:'36px',fontWeight:900,lineHeight:1.1,marginBottom:'10px',background:'linear-gradient(160deg,#e8cc6e,#D4AF37,#b8962e)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>{fmtUSD(calc.pv)}</div>
              <div style={{fontSize:'16px',fontWeight:600,color:'var(--text-secondary)',fontVariantNumeric:'tabular-nums'}}>{fmtVE(calc.pvebs)}</div>
              <div style={{fontSize:'10px',color:'var(--text-muted)',marginTop:'8px',letterSpacing:'0.5px'}}>* Tasa P2P Efectivo ({rates.p2p.toFixed(2)} Bs/USD)</div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer style={{textAlign:'center',padding:'20px 0',borderTop:'1px solid var(--border-color)'}}>
          <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'2px',color:'var(--text-muted)',textTransform:'uppercase'}}>ZYNC ELECTRONICS © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  )
}
