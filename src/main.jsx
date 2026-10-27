import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, ChevronLeft, ChevronRight, Download, Leaf, Send, TableProperties } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { addDoc, collection, collectionGroup, getDocs, getFirestore, orderBy, query, serverTimestamp } from 'firebase/firestore'
import './style.css'

const questions = [
  { text: '학교를 다니면서 불공평하거나 불평등하다고 느낀 경험이 있나요?', type: 'single', options: ['자주 있다', '가끔 있다', '거의 없다', '전혀 없다'] },
  { text: 'HUSS 포용사회사업단을 들어본 적이 있나요?', type: 'single', options: ['처음 들어본다', '이름만 들어봤다', '어떤 일을 하는지 알고 있다', '참여해본 적이 있다'] },
  { text: '포용사회라는 말을 들었을 때 가장 먼저 떠오르는 것은?', type: 'text' },
  { text: 'HUSS 프로그램 참여를 통해 마이크로디그리 전공을 이수할 수 있다는 것을 알고 있나요?', type: 'single', options: ['알고 있다', '몰랐다'] },
  { text: 'HUSS를 어떤 경로로 알게 되었나요?', type: 'multiple', options: ['포스터', '수업 수강', '인스타그램', '블로그', '주변 소개', '기타(직접 입력)'], other: true },
  { text: 'HUSS에 참여한다면 어떤 프로그램에 참여하고 싶나요?', type: 'multiple', options: ['해외 탐방·연수', '전국 HUSS 융합 캠프', '해커톤·경진대회', '마일리지장학금', '역량강화특강', '기타'] },
  { text: '포용사회 주제 중 가장 관심 있는 분야는?', type: 'multiple', options: ['포용사회 안전망', '갈등코디네이터', '디지털포용', '포용경제'] },
  { text: 'HUSS 프로그램에 참여하기 어려운 이유가 있다면?', type: 'multiple', options: ['시간이 부족하다', '정보가 부족하다', '전공과 관련이 없어 보인다', '참여 방법을 모른다', '필요성을 못 느낀다', '기타'] },
  { text: '앞으로 HUSS 프로그램에 참여할 의향이 있나요?', type: 'scale' },
  { text: '귀하는 학교의 사업 및 비교과 프로그램과 관련된 정보를 주로 어디에서 얻나요?', type: 'multiple', options: ['인스타그램 등 SNS', '에브리타임 등 대학생 커뮤니티', '학교 홈페이지 및 공지사항', '학과 홈페이지 및 게시판', '부경대학교 알림톡', '교내 포스터 및 현수막', '기타 (직접 입력)'], other: true },
  { text: 'HUSS 포용사회사업단에 대해 더 알고 싶은 정보는 무엇인가요?', type: 'multiple', options: ['사업단의 목적 및 주요 활동', '프로그램별 참여 방법 및 일정', '마이크로디그리 이수 방법 및 혜택', '장학금 및 수상 혜택', '해외 탐방 및 연수 기회', '실제 참여 학생들의 후기', '졸업 후 진로와의 연계성', '기타 (직접 입력)'], other: true },
  { text: 'HUSS 프로그램이 어떤 조건을 갖춘다면 참여하기 더 쉬울 것 같나요?', type: 'multiple', options: ['수업 시간과 겹치지 않는 일정', '짧은 기간 안에 참여할 수 있는 구성', '참여 절차 간소화', '프로그램에 대한 사전 안내 강화', '전공과 연계된 프로그램 확대', '기타 (직접 입력)'], other: true },
]

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
const firebaseReady = Object.values(firebaseConfig).every(Boolean)
const db = firebaseReady ? getFirestore(initializeApp(firebaseConfig)) : null

function App() {
  const [stage, setStage] = useState(() => window.location.hash === '#admin' ? 'admin' : 'intro')
  const [profile, setProfile] = useState({ gender: '', name: '', department: '' })
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [responses, setResponses] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  useEffect(() => {
    const syncRoute = () => setStage(window.location.hash === '#admin' ? 'admin' : 'intro')
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    if (stage !== 'admin') return
    if (!db) { setAdminError('Firebase 환경변수가 설정되지 않았습니다.'); return }
    let active = true
    setAdminLoading(true); setAdminError('')
    getDocs(query(collectionGroup(db, 'responses'), orderBy('submittedAt', 'desc')))
      .then(snapshot => { if (active) setResponses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))) })
      .catch(err => { console.error(err); if (active) setAdminError('응답을 불러오지 못했습니다. Firestore 규칙과 인덱스 설정을 확인해 주세요.') })
      .finally(() => { if (active) setAdminLoading(false) })
    return () => { active = false }
  }, [stage])

  const departments = useMemo(() => [...new Set(responses.map(row => row.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')), [responses])
  const filteredResponses = useMemo(() => departmentFilter === 'all' ? responses : responses.filter(row => row.department === departmentFilter), [responses, departmentFilter])
  const exportCsv = () => {
    const header = ['제출일시', '성별', '이름', '학과', ...questions.map((question, i) => `Q${i + 1}. ${question.text}`)]
    const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = filteredResponses.map(row => [
      row.submittedAt?.toDate?.().toLocaleString('ko-KR') ?? '', row.gender, row.name, row.department,
      ...questions.map((_, i) => {
        const answer = row.answers?.[i]
        if (Array.isArray(answer)) return answer.join(', ')
        if (answer && typeof answer === 'object') return `${(answer.selected ?? []).join(', ')}${answer.other ? ` (기타: ${answer.other})` : ''}`
        return answer ?? ''
      }),
    ])
    const csv = '\uFEFF' + [header, ...rows].map(line => line.map(cell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'huss-survey-responses.csv'; link.click(); URL.revokeObjectURL(url)
  }

  const update = (qid, value) => setAnswers(prev => ({ ...prev, [qid]: value }))
  const q = questions[step]
  const current = answers[step] ?? (q.type === 'multiple' ? [] : '')
  const canContinue = q.type === 'multiple' ? current.length > 0 : Boolean(current)

  const start = e => {
    e.preventDefault()
    if (!profile.gender || !profile.name.trim() || !profile.department.trim()) return
    setError(''); setStage('survey')
  }

  const finish = async () => {
    if (!db) { setError('설문 저장을 위해 Firebase 연결이 필요합니다. 관리자에게 문의해 주세요.'); return }
    setSaving(true); setError('')
    try {
      const departmentKey = profile.department.trim().replaceAll('/', '_')
      const normalizedAnswers = Object.fromEntries(Object.entries(answers).filter(([key]) => !key.endsWith('-other')))
      for (const [key, value] of Object.entries(answers)) {
        if (key.endsWith('-other') && value.trim()) normalizedAnswers[key.slice(0, -6)] = { selected: answers[key.slice(0, -6)], other: value.trim() }
      }
      await addDoc(collection(db, 'departments', departmentKey, 'responses'), {
        ...profile, name: profile.name.trim(), department: profile.department.trim(), answers: normalizedAnswers,
        submittedAt: serverTimestamp(),
      })
      setStage('complete')
    } catch (err) {
      console.error(err); setError('응답을 저장하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.')
    } finally { setSaving(false) }
  }

  const toggle = (value) => {
    const next = current.includes(value) ? current.filter(x => x !== value) : [...current, value]
    setAnswers(prev => ({ ...prev, [step]: next, ...(value.startsWith('기타') && !current.includes(value) ? { [`${step}-other`]: '' } : {}) }))
  }

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#home" onClick={() => setStage('intro')}><span className="brand-mark"><Leaf size={18}/></span><span>HUSS <b>포용사회사업단</b></span></a><nav className="top-nav"><a href="#home" onClick={() => setStage('intro')}>설문 참여</a><a className={stage === 'admin' ? 'active' : ''} href="#admin" onClick={() => setStage('admin')}><TableProperties size={14}/> 관리자</a></nav></header>
    {stage === 'admin' && <section className="admin-panel">
      <div className="admin-heading"><div><span className="eyebrow"><span className="dot"/> HUSS SURVEY</span><h1>설문 응답 관리</h1><p>저장된 응답을 학과별로 확인하고 CSV로 내려받을 수 있습니다.</p></div><button className="primary" onClick={exportCsv} disabled={!filteredResponses.length}><Download size={16}/> CSV 다운로드</button></div>
      <div className="admin-summary"><div><span>전체 응답</span><b>{responses.length}</b></div><div><span>표시 중</span><b>{filteredResponses.length}</b></div><label>학과 필터<select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}><option value="all">전체 학과</option>{departments.map(department => <option key={department} value={department}>{department}</option>)}</select></label></div>
      {adminLoading && <p className="admin-state">응답을 불러오는 중입니다…</p>}
      {adminError && <p className="error-message" role="alert">{adminError}</p>}
      {!adminLoading && !adminError && !filteredResponses.length && <p className="admin-state">아직 저장된 응답이 없습니다.</p>}
      {!!filteredResponses.length && <div className="response-table-wrap"><table className="response-table"><thead><tr><th>제출일시</th><th>성별</th><th>이름</th><th>학과</th>{questions.map((_, i) => <th key={i}>Q{i+1}</th>)}</tr></thead><tbody>{filteredResponses.map(row => <tr key={row.id}><td>{row.submittedAt?.toDate?.().toLocaleString('ko-KR') ?? '—'}</td><td>{row.gender}</td><td>{row.name}</td><td>{row.department}</td>{questions.map((_, i) => { const answer = row.answers?.[i]; const display = Array.isArray(answer) ? answer.join(', ') : answer && typeof answer === 'object' ? `${(answer.selected ?? []).join(', ')}${answer.other ? ` (기타: ${answer.other})` : ''}` : answer ?? '—'; return <td key={i}>{display}</td> })}</tr>)}</tbody></table></div>}
      <p className="admin-notice">관리자 페이지에 접속한 사람은 응답자의 이름, 학과, 답변을 볼 수 있습니다.</p>
    </section>}
    {stage === 'intro' && <section className="intro-card" id="home">
      <div className="intro-copy"><span className="eyebrow"><span className="dot"/> HUSS SURVEY</span><h1>모두를 위한 사회,<br/><em>당신의 생각</em>을 들려주세요</h1><p className="lead">포용사회와 HUSS 프로그램에 대한 여러분의 의견을 들려주세요. 소중한 응답은 더 나은 프로그램을 만드는 데 활용됩니다.</p><div className="survey-meta"><span><b>12</b>개 질문</span><i/><span>약 <b>3분</b> 소요</span></div>
        <form className="profile-form" onSubmit={start}><h2>응답자 정보</h2><label>성별<div className="gender-row">{['여성', '남성', '기타'].map(v => <button type="button" key={v} className={`gender-choice ${profile.gender === v ? 'active' : ''}`} onClick={() => setProfile({...profile, gender:v})}>{v}</button>)}</div></label><label>이름<input required placeholder="이름을 입력해 주세요" value={profile.name} onChange={e => setProfile({...profile,name:e.target.value})}/></label><label>학과<input required placeholder="학과를 입력해 주세요" value={profile.department} onChange={e => setProfile({...profile,department:e.target.value})}/></label><button className="primary full" type="submit" disabled={!profile.gender || !profile.name.trim() || !profile.department.trim()}>설문 시작하기 <ChevronRight size={18}/></button></form>
        <p className="privacy-note">응답 자료는 학과별 통계와 사업 개선 목적으로 활용됩니다.</p>
      </div><div className="intro-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="sunburst">✦</div><img src="/mascot-transparent.png" alt="HUSS 설문 캐릭터"/><div className="speech-bubble">함께 만드는<br/><b>포용사회</b> 🌱</div><div className="art-caption">YOUR VOICE<br/><strong>MATTERS</strong></div></div>
    </section>}
    {stage === 'survey' && <section className="survey-layout"><aside className="survey-aside"><div className="aside-mascot"><img src="/mascot-transparent.png" alt=""/></div><p>HUSS 포용사회사업단<br/><b>인지도 설문</b></p><div className="progress-copy"><span>진행 상황</span><b>{step+1} / {questions.length}</b></div><div className="progress-track"><span style={{width:`${((step+1)/questions.length)*100}%`}}/></div><div className="question-nav">{questions.map((_,i)=><span key={i} className={`${i===step?'current':''} ${i<step?'done':''}`}>{i<step?<Check size={12}/>:String(i+1).padStart(2,'0')}</span>)}</div><div className="aside-tip">“여러분의 솔직한 응답이 더 포용적인 캠퍼스를 만듭니다.”</div></aside>
      <div className="question-panel"><div className="question-kicker">QUESTION {String(step+1).padStart(2,'0')} <span> / 12</span></div><h1>{q.text}</h1><div className="type-hint">{q.type==='single'?'하나만 선택해 주세요':q.type==='multiple'?'해당하는 항목을 모두 선택해 주세요':q.type==='scale'?'1점부터 5점 중 선택해 주세요':'자유롭게 작성해 주세요'}</div>
        {q.type==='text' && <textarea autoFocus placeholder="여기에 답변을 입력해 주세요" value={current} onChange={e=>update(step,e.target.value)} rows={5}/>}
        {q.type==='single' && <div className="options">{q.options.map((v,i)=><button key={v} className={`option ${current===v?'selected':''}`} onClick={()=>update(step,v)}><span className="option-index">{String.fromCharCode(65+i)}</span><span>{v}</span><span className="radio"/></button>)}</div>}
        {q.type==='multiple' && <div className="options">{q.options.map((v,i)=><button key={v} className={`option ${current.includes(v)?'selected':''}`} onClick={()=>toggle(v)}><span className="option-index">{String.fromCharCode(65+i)}</span><span>{v}</span><span className="checkbox">{current.includes(v)&&<Check size={14}/>}</span></button>)}{q.other&&current.includes('기타')&&<input className="other-input" placeholder="기타 의견을 입력해 주세요" value={answers[`${step}-other`]||''} onChange={e=>setAnswers({...answers,[`${step}-other`]:e.target.value})}/>}</div>}
        {q.type==='scale' && <div className="scale-wrap"><div className="scale-labels"><span>전혀 없다</span><span>매우 있다</span></div><div className="scale-options">{[1,2,3,4,5].map(n=><button key={n} className={`scale-option ${current===n?'selected':''}`} onClick={()=>update(step,n)}><span>{n}</span></button>)}</div><p className="scale-caption">선택한 숫자를 눌러주세요</p></div>}
        {error&&<p className="error-message" role="alert">{error}</p>}<div className="question-actions"><button className="back-button" onClick={()=>{setError(''); if(step===0)setStage('intro');else setStep(step-1)}}><ChevronLeft size={17}/> 이전</button>{step<questions.length-1?<button disabled={!canContinue} className="primary" onClick={()=>setStep(step+1)}>다음 질문 <ChevronRight size={17}/></button>:<button disabled={!canContinue||saving} className="primary" onClick={finish}>{saving?'저장 중…':'응답 제출하기'} <Send size={16}/></button>}</div>
      </div></section>}
    {stage==='complete'&&<section className="complete-card"><div className="complete-spark">✦</div><img src="/mascot-transparent.png" alt="HUSS 캐릭터"/><span className="eyebrow">THANK YOU</span><h1>응답이 전달되었어요!</h1><p>소중한 의견을 나눠주셔서 감사합니다.<br/>여러분의 목소리로 더 포용적인 캠퍼스를 만들어갈게요.</p><button className="primary" onClick={()=>{setProfile({gender:'',name:'',department:''});setAnswers({});setStep(0);setStage('intro')}}>처음으로 돌아가기 <ChevronRight size={17}/></button></section>}
    <footer><span>HUSS 포용사회사업단 인지도 설문</span><span>함께 만드는 포용사회 <Leaf size={13}/></span></footer>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
