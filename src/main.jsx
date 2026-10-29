import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, ChevronLeft, ChevronRight, Download, Leaf, Send, TableProperties } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { addDoc, collection, collectionGroup, getDocs, getFirestore, serverTimestamp } from 'firebase/firestore'
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

// Korean question wording and stored answer values stay unchanged. These subtitles
// only help English- and Chinese-speaking respondents understand the questionnaire.
const questionTranslations = [
  { en: 'While attending school, have you ever felt that you were treated unfairly or unequally?', zh: '在校期间，您是否有过感到不公平或不平等的经历？', optionsEn: ['Often', 'Sometimes', 'Rarely', 'Never'], optionsZh: ['经常有', '有时有', '几乎没有', '从来没有'] },
  { en: 'Have you heard of the HUSS Inclusion Society Program?', zh: '您听说过 HUSS 包容社会事业团吗？', optionsEn: ["This is my first time hearing about it", "I've only heard the name", 'I know what it does', 'I have participated before'], optionsZh: ['第一次听说', '只听说过名称', '了解其主要活动', '曾经参加过'] },
  { en: 'What comes to mind first when you hear the term “inclusive society”?', zh: '听到“包容社会”这个词时，您最先想到什么？' },
  { en: 'Did you know that participating in HUSS programs can help you complete a microdegree?', zh: '您知道参加 HUSS 项目可以修读并完成微学位吗？', optionsEn: ['Yes, I knew', 'No, I did not know'], optionsZh: ['知道', '不知道'] },
  { en: 'How did you hear about HUSS?', zh: '您是通过什么途径了解到 HUSS 的？', optionsEn: ['Poster', 'Taking a class', 'Instagram', 'Blog', 'Someone I know', 'Other (please specify)'], optionsZh: ['海报', '课堂', 'Instagram', '博客', '熟人介绍', '其他（请填写）'] },
  { en: 'If you joined HUSS, which programs would you like to participate in?', zh: '如果参加 HUSS，您想参加哪些项目？', optionsEn: ['Overseas field trip or training', 'National HUSS convergence camp', 'Hackathon or competition', 'Mileage scholarship', 'Skills-building special lecture', 'Other'], optionsZh: ['海外考察或研修', '全国 HUSS 融合营', '黑客松或竞赛', '里程奖学金', '能力提升专题讲座', '其他'] },
  { en: 'Which topic related to an inclusive society interests you most?', zh: '在包容社会相关主题中，您最感兴趣的是哪一项？', optionsEn: ['Inclusive social safety net', 'Conflict coordinator', 'Digital inclusion', 'Inclusive economy'], optionsZh: ['包容性社会安全网', '冲突协调员', '数字包容', '包容性经济'] },
  { en: 'If anything makes it difficult for you to join HUSS programs, what is it?', zh: '如果您觉得参加 HUSS 项目有困难，原因是什么？', optionsEn: ['I do not have enough time', 'I do not have enough information', 'It does not seem related to my major', 'I do not know how to participate', 'I do not see the need', 'Other'], optionsZh: ['时间不足', '信息不足', '似乎与我的专业无关', '不知道如何参加', '觉得没有必要', '其他'] },
  { en: 'How willing are you to participate in HUSS programs in the future?', zh: '您今后参加 HUSS 项目的意愿有多强？', scaleLowEn: 'Not at all willing', scaleHighEn: 'Very willing', scaleLowZh: '完全不愿意', scaleHighZh: '非常愿意' },
  { en: 'Where do you mainly get information about university initiatives and extracurricular programs?', zh: '您主要从哪里获取学校事业及课外项目相关信息？', optionsEn: ['Social media, such as Instagram', 'Student communities, such as Everytime', 'University website and announcements', 'Department website and bulletin board', 'Pukyong National University AlimTalk', 'Campus posters and banners', 'Other (please specify)'], optionsZh: ['Instagram 等社交媒体', 'Everytime 等大学生社区', '学校官网及公告', '院系网站及公告栏', '釜庆大学 AlimTalk 通知', '校内海报及横幅', '其他（请填写）'] },
  { en: 'What would you like to learn more about regarding the HUSS Inclusion Society Program?', zh: '关于 HUSS 包容社会事业团，您还想了解哪些信息？', optionsEn: ['The program’s purpose and main activities', 'How and when to join each program', 'How to earn a microdegree and its benefits', 'Scholarships and awards', 'Overseas trips and training opportunities', 'Experiences from participating students', 'Connection to career paths after graduation', 'Other (please specify)'], optionsZh: ['事业团的宗旨及主要活动', '各项目的参加方式及日程', '微学位修读方式及相关福利', '奖学金及获奖福利', '海外考察及研修机会', '参加学生的真实体验', '与毕业后职业发展的关联', '其他（请填写）'] },
  { en: 'What conditions would make it easier for you to participate in HUSS programs?', zh: '如果 HUSS 项目具备哪些条件，您会更容易参加？', optionsEn: ['A schedule that does not overlap with classes', 'A format that can be completed in a short time', 'Simpler participation procedures', 'More advance information about programs', 'More programs related to my major', 'Other (please specify)'], optionsZh: ['不与上课时间冲突的日程', '可在较短时间内参加的形式', '简化参加流程', '提前提供更多项目信息', '增加与专业相关的项目', '其他（请填写）'] },
]

const subtitles = {
  previous: ['Previous', '上一题'],
  next: ['Next question', '下一题'],
  start: ['Start survey', '开始问卷'],
  submit: ['Submit responses', '提交回答'],
  gender: ['Gender', '性别'],
  name: ['Name', '姓名'],
  department: ['Department / major', '院系 / 专业'],
  profile: ['Respondent information', '答题者信息'],
  chooseOne: ['Select one option', '请选择一项'],
  chooseMany: ['Select all that apply', '可多选'],
  chooseScale: ['Choose a rating from 1 to 5', '请选择 1 至 5 分'],
  freeResponse: ['Please write your answer', '请填写您的回答'],
}

function Subtitle({ en, zh }) {
  return <span className="translation-lines"><span><b>EN</b>{en}</span><span><b>中文</b>{zh}</span></span>
}

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
const ADMIN_PIN_SHA256 = 'a6f766a88c0bb123f62b462bbd69d6b936b8649ddf6b3fa9738fe44fabe79422'

function App() {
  const [stage, setStage] = useState(() => window.location.hash === '#admin' ? 'admin' : 'intro')
  const [profile, setProfile] = useState({ gender: '', name: '', department: '' })
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedDocId, setSavedDocId] = useState('')
  const [responses, setResponses] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [departmentSearch, setDepartmentSearch] = useState('')
  const [loadedDepartment, setLoadedDepartment] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [allResponses, setAllResponses] = useState([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    const syncRoute = () => setStage(window.location.hash === '#admin' ? 'admin' : 'intro')
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  const loadDepartmentResponses = async e => {
    e.preventDefault()
    const department = departmentSearch.trim()
    if (!department) return
    if (!db) { setAdminError('Firebase 웹 앱 설정을 확인해 주세요.'); return }
    setAdminLoading(true); setAdminError(''); setResponses([]); setLoadedDepartment(''); setHasSearched(false)
    try {
      const departmentKey = department.replaceAll('/', '_')
      // Avoid requiring a composite/index configuration for a basic department lookup.
      // Sort in the browser so every response in the department is shown even if older
      // documents have no submittedAt field or the Firestore index is not ready.
      const snapshot = await getDocs(collection(db, 'departments', departmentKey, 'responses'))
      const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      rows.sort((a, b) => (b.submittedAt?.toMillis?.() ?? 0) - (a.submittedAt?.toMillis?.() ?? 0))
      setResponses(rows)
      setLoadedDepartment(department); setHasSearched(true)
    } catch (err) {
      console.error('HUSS admin query failed:', err)
      if (err.code === 'permission-denied') setAdminError('Firestore가 조회를 거부했습니다. Firebase Console에서 프로젝트 ID가 huss-39792인지 확인하고, Firestore > 규칙에 저장소의 firestore.rules 내용을 게시해 주세요. 규칙 게시만으로는 설문 데이터가 삭제되지 않습니다.')
      else setAdminError(`응답 조회 오류: ${err.code || 'unknown'}${err.message ? ` — ${err.message}` : ''}`)
    } finally { setAdminLoading(false) }
  }
  const unlockAdmin = async e => {
    e.preventDefault()
    if (!/^\d{4}$/.test(adminPin)) { setPinError('4자리 숫자를 입력해 주세요.'); return }
    setPinLoading(true); setPinError('')
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(adminPin))
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
    if (hash === ADMIN_PIN_SHA256) { setAdminUnlocked(true); setPinError(''); setAdminPin('') }
    else { setPinError('PIN이 올바르지 않습니다.'); setAdminPin('') }
    setPinLoading(false)
  }
  const logoutAdmin = () => {
    setAdminUnlocked(false); setAdminPin(''); setResponses([]); setAllResponses([]); setLoadedDepartment(''); setHasSearched(false)
  }
  const loadAllResponses = async () => {
    if (!db) { setSummaryError('Firebase 연결 설정을 확인해 주세요.'); return }
    setSummaryLoading(true); setSummaryError('')
    try {
      const snapshot = await getDocs(collectionGroup(db, 'responses'))
      const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      rows.sort((a, b) => (b.submittedAt?.toMillis?.() ?? 0) - (a.submittedAt?.toMillis?.() ?? 0))
      setAllResponses(rows)
    } catch (err) {
      console.error('HUSS summary query failed:', err)
      setSummaryError(err.code === 'permission-denied'
        ? '전체 집계 읽기가 거부됐습니다. Firebase Console에 수정된 firestore.rules를 게시해 주세요.'
        : `전체 집계 오류: ${err.code || 'unknown'}${err.message ? ` — ${err.message}` : ''}`)
    } finally { setSummaryLoading(false) }
  }
  useEffect(() => { if (stage === 'admin' && adminUnlocked) loadAllResponses() }, [stage, adminUnlocked])
  const departmentCounts = Object.entries(allResponses.reduce((counts, row) => {
    const name = row.department || '학과 미상'
    counts[name] = (counts[name] || 0) + 1
    return counts
  }, {})).sort((a, b) => b[1] - a[1])
  const answerCounts = questions.map((question, index) => {
    if (question.type === 'text') return { question, index, freeText: allResponses.filter(row => typeof row.answers?.[index] === 'string' && row.answers[index].trim()).length, counts: [] }
    const counts = question.type === 'scale' ? [1, 2, 3, 4, 5].map(value => [String(value), allResponses.filter(row => row.answers?.[index] === value).length])
      : question.options.map(option => [option, allResponses.reduce((count, row) => {
        const answer = row.answers?.[index]
        if (Array.isArray(answer)) return count + (answer.includes(option) ? 1 : 0)
        if (answer && typeof answer === 'object') return count + ((answer.selected || []).includes(option) ? 1 : 0)
        return count + (answer === option ? 1 : 0)
      }, 0)])
    return { question, index, counts }
  })
  const filteredResponses = responses
  const downloadResponsesCsv = (sourceRows, fileName) => {
    const header = ['제출일시', '응답 ID', '성별', '이름', '학과(입력 원문)', ...questions.map((question, i) => `Q${i + 1}. ${question.text}`)]
    const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = sourceRows.map(row => [
      row.submittedAt?.toDate?.().toLocaleString('ko-KR') ?? '', row.id, row.gender, row.name, row.department,
      ...questions.map((_, i) => {
        const answer = row.answers?.[i]
        if (Array.isArray(answer)) return answer.join(', ')
        if (answer && typeof answer === 'object') return `${(answer.selected ?? []).join(', ')}${answer.other ? ` (기타: ${answer.other})` : ''}`
        return answer ?? ''
      }),
    ])
    const csv = '\uFEFF' + [header, ...rows].map(line => line.map(cell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }
  const exportCsv = () => downloadResponsesCsv(filteredResponses, 'huss-survey-department-responses.csv')
  const exportAllCsv = () => downloadResponsesCsv(allResponses, 'huss-survey-all-responses.csv')

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
      const saved = await addDoc(collection(db, 'departments', departmentKey, 'responses'), {
        ...profile, name: profile.name.trim(), department: profile.department.trim(), answers: normalizedAnswers,
        submittedAt: serverTimestamp(),
      })
      setSavedDocId(saved.id)
      setStage('complete')
    } catch (err) {
      console.error('HUSS response save failed:', err)
      if (err.code === 'permission-denied') {
        setError('Firestore가 저장 권한을 거부했습니다. Firebase Console > Firestore > 규칙에서 이 저장소의 firestore.rules를 게시했는지 확인해 주세요.')
      } else if (err.code === 'invalid-argument') {
        setError('응답 형식이 올바르지 않습니다. 입력 길이를 확인한 뒤 다시 제출해 주세요.')
      } else if (err.code === 'unavailable' || err.code === 'network-request-failed') {
        setError('네트워크 연결을 확인한 뒤 다시 제출해 주세요. 응답은 아직 저장되지 않았습니다.')
      } else {
        setError(`응답을 저장하지 못했습니다 (${err.code || 'unknown'}). 잠시 후 다시 시도해 주세요.`)
      }
    } finally { setSaving(false) }
  }

  const toggle = (value) => {
    const next = current.includes(value) ? current.filter(x => x !== value) : [...current, value]
    setAnswers(prev => ({ ...prev, [step]: next, ...(value.startsWith('기타') && !current.includes(value) ? { [`${step}-other`]: '' } : {}) }))
  }

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#home" onClick={() => {logoutAdmin();setStage('intro')}}><span className="brand-mark"><Leaf size={18}/></span><span>HUSS <b>포용사회사업단</b></span></a><nav className="top-nav"><a href="#home" onClick={() => {logoutAdmin();setStage('intro')}}>설문 참여</a><a className={stage === 'admin' ? 'active' : ''} href="#admin" onClick={() => setStage('admin')}><TableProperties size={14}/> 관리자</a></nav></header>
    {stage === 'admin' && <section className="admin-panel">{!adminUnlocked ? <div className="admin-lock"><span className="eyebrow"><span className="dot"/> HUSS ADMIN</span><h1>관리자 PIN 입력</h1><p>관리자 페이지에 들어가려면 4자리 PIN을 입력해 주세요.</p><form onSubmit={unlockAdmin}><input aria-label="관리자 PIN" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" value={adminPin} onChange={e=>setAdminPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="••••"/><button className="primary" disabled={pinLoading || adminPin.length!==4}>{pinLoading?'확인 중…':'관리자 페이지 열기'}</button></form>{pinError&&<p className="error-message" role="alert">{pinError}</p>}</div> : <>
      <div className="admin-heading"><div><span className="eyebrow"><span className="dot"/> HUSS SURVEY</span><h1>설문 응답 관리</h1><p>학과명을 입력해 응답을 확인하고 CSV로 내려받을 수 있습니다.</p></div><div className="admin-actions"><button className="primary" onClick={exportAllCsv} disabled={!allResponses.length}><Download size={16}/> 전체 응답 CSV</button><button className="secondary-button" onClick={exportCsv} disabled={!filteredResponses.length}><Download size={16}/> 학과 응답 CSV</button><button className="secondary-button" onClick={logoutAdmin}>잠금</button></div></div>
      <section className="analytics-panel" aria-labelledby="analytics-title">
        <div className="analytics-heading"><div><h2 id="analytics-title">전체 설문 현황</h2><p>모든 학과 응답을 합산한 결과입니다.</p></div><button className="secondary-button" onClick={loadAllResponses} disabled={summaryLoading}>{summaryLoading ? '집계 중…' : '현황 새로고침'}</button></div>
        <div className="analytics-total"><span>총 설문자</span><strong>{summaryLoading && !allResponses.length ? '…' : `${allResponses.length}명`}</strong><small>{departmentCounts.length}개 학과</small></div>
        {summaryError && <p className="error-message" role="alert">{summaryError}</p>}
        {!summaryError && !summaryLoading && !allResponses.length && <p className="admin-state analytics-empty">아직 집계할 응답이 없습니다.</p>}
        {!!departmentCounts.length && <div className="department-summary"><h3>학과별 응답자</h3><div className="department-chips">{departmentCounts.map(([department, count]) => <div className="department-chip" key={department}><span>{department}</span><b>{count}명</b></div>)}</div></div>}
        {!!allResponses.length && <div className="question-analytics"><h3>문항별 응답 현황</h3><div className="question-stat-grid">{answerCounts.map(({ question, index, counts, freeText }) => {
          const answered = question.type === 'text' ? freeText : counts.reduce((sum, [, count]) => sum + count, 0)
          const scaleMax = question.type === 'multiple' ? allResponses.length : answered
          return <article className="question-stat" key={index}><div className="question-stat-title"><b>Q{index + 1}</b><span>{question.text}</span><small>{question.type === 'multiple' ? `응답자 ${allResponses.length}명 · 복수응답` : `응답 ${answered}명`}</small></div>
            {question.type === 'text' ? <div className="free-response-count">주관식 답변 <strong>{freeText}명</strong></div> : <div className="answer-bars">{counts.map(([label, count]) => <div className="answer-bar-row" key={label}><span title={label}>{label}</span><div className="answer-bar-track"><i style={{width: `${scaleMax ? Math.min(100, count / scaleMax * 100) : 0}%`}}/></div><b>{count}명</b></div>)}</div>}
          </article>
        })}</div></div>}
      </section>
      <form className="admin-search" onSubmit={loadDepartmentResponses}><label htmlFor="admin-department">조회할 학과</label><input id="admin-department" value={departmentSearch} onChange={e => setDepartmentSearch(e.target.value)} placeholder="학과명을 정확히 입력해 주세요"/><button className="primary" disabled={adminLoading || !departmentSearch.trim()}>{adminLoading?'조회 중…':'응답 조회'}</button></form>
      <div className="admin-summary"><div><span>조회 학과</span><b className="admin-summary-value">{loadedDepartment || '—'}</b></div><div><span>응답 건수</span><b className="admin-summary-value">{hasSearched ? filteredResponses.length : '—'}</b></div></div>
      {adminLoading && <p className="admin-state">응답을 불러오는 중입니다…</p>}
      {adminError && <p className="error-message" role="alert">{adminError}</p>}
      {!adminLoading && !adminError && !hasSearched && <p className="admin-state">학과명을 입력한 뒤 ‘응답 조회’를 눌러주세요.</p>}
      {!adminLoading && !adminError && hasSearched && !filteredResponses.length && <p className="admin-state">‘{loadedDepartment}’에 저장된 응답이 없습니다. 학과명을 정확히 입력했는지 확인해 주세요.</p>}
      {!!filteredResponses.length && <div className="response-table-wrap"><table className="response-table"><thead><tr><th>제출일시</th><th>성별</th><th>이름</th><th>학과</th>{questions.map((_, i) => <th key={i}>Q{i+1}</th>)}</tr></thead><tbody>{filteredResponses.map(row => <tr key={row.id}><td>{row.submittedAt?.toDate?.().toLocaleString('ko-KR') ?? '—'}</td><td>{row.gender}</td><td>{row.name}</td><td>{row.department}</td>{questions.map((_, i) => { const answer = row.answers?.[i]; const display = Array.isArray(answer) ? answer.join(', ') : answer && typeof answer === 'object' ? `${(answer.selected ?? []).join(', ')}${answer.other ? ` (기타: ${answer.other})` : ''}` : answer ?? '—'; return <td key={i}>{display}</td> })}</tr>)}</tbody></table></div>}
      <p className="admin-notice">PIN은 관리자 화면을 가리는 간편 잠금입니다. Firestore 규칙이 공개 읽기를 허용하므로 응답 데이터는 누구나 기술적으로 접근할 수 있습니다.</p>
    </>}</section>}
    {stage === 'intro' && <section className="intro-card" id="home">
      <div className="intro-copy"><span className="eyebrow"><span className="dot"/> HUSS SURVEY</span><h1>모두를 위한 사회,<br/><em>당신의 생각</em>을 들려주세요</h1><p className="lead">포용사회와 HUSS 프로그램에 대한 여러분의 의견을 들려주세요. 소중한 응답은 더 나은 프로그램을 만드는 데 활용됩니다.</p><div className="survey-meta"><span><b>12</b>개 질문</span><i/><span>약 <b>3분</b> 소요</span></div>
        <p className="language-note">문항과 선택지 아래에 영어와 중국어 번역을 함께 표시합니다.<br/>English and Chinese translations are shown below each question and option. · 每道题目和选项下方均附有英文和中文翻译。</p>
        <form className="profile-form" onSubmit={start}><h2>응답자 정보<Subtitle en={subtitles.profile[0]} zh={subtitles.profile[1]}/></h2><label><span>성별</span><Subtitle en={subtitles.gender[0]} zh={subtitles.gender[1]}/><div className="gender-row">{[['여성','Woman','女性'], ['남성','Man','男性'], ['기타','Other','其他']].map(([v,en,zh]) => <button type="button" key={v} className={`gender-choice ${profile.gender === v ? 'active' : ''}`} onClick={() => setProfile({...profile, gender:v})}><span>{v}</span><small>{en} · {zh}</small></button>)}</div></label><label><span>이름</span><Subtitle en={subtitles.name[0]} zh={subtitles.name[1]}/><input required maxLength={80} placeholder="이름을 입력해 주세요" value={profile.name} onChange={e => setProfile({...profile,name:e.target.value})}/></label><label><span>학과</span><Subtitle en={subtitles.department[0]} zh={subtitles.department[1]}/><input required maxLength={100} placeholder="학과를 입력해 주세요" value={profile.department} onChange={e => setProfile({...profile,department:e.target.value})}/></label><button className="primary full" type="submit" disabled={!profile.gender || !profile.name.trim() || !profile.department.trim()}><span className="button-label">설문 시작하기<small> {subtitles.start[0]} · {subtitles.start[1]}</small></span><ChevronRight size={18}/></button></form>
        <p className="privacy-note">응답 자료는 학과별 통계와 사업 개선 목적으로 활용됩니다.</p>
      </div><div className="intro-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="sunburst">✦</div><img src="/mascot-transparent.png" alt="HUSS 설문 캐릭터"/><div className="speech-bubble">함께 만드는<br/><b>포용사회</b> 🌱</div><div className="art-caption">YOUR VOICE<br/><strong>MATTERS</strong></div></div>
    </section>}
    {stage === 'survey' && <section className="survey-layout"><aside className="survey-aside"><div className="aside-mascot"><img src="/mascot-transparent.png" alt=""/></div><p>HUSS 포용사회사업단<br/><b>인지도 설문</b></p><div className="progress-copy"><span>진행 상황</span><b>{step+1} / {questions.length}</b></div><div className="progress-track"><span style={{width:`${((step+1)/questions.length)*100}%`}}/></div><div className="question-nav">{questions.map((_,i)=><span key={i} className={`${i===step?'current':''} ${i<step?'done':''}`}>{i<step?<Check size={12}/>:String(i+1).padStart(2,'0')}</span>)}</div><div className="aside-tip">“여러분의 솔직한 응답이 더 포용적인 캠퍼스를 만듭니다.”</div></aside>
      <div className="question-panel"><div className="question-kicker">QUESTION {String(step+1).padStart(2,'0')} <span> / 12</span></div><h1>{q.text}</h1><Subtitle en={questionTranslations[step].en} zh={questionTranslations[step].zh}/><div className="type-hint">{q.type==='single'?'하나만 선택해 주세요':q.type==='multiple'?'해당하는 항목을 모두 선택해 주세요':q.type==='scale'?'1점부터 5점 중 선택해 주세요':'자유롭게 작성해 주세요'}<Subtitle en={q.type==='single'?subtitles.chooseOne[0]:q.type==='multiple'?subtitles.chooseMany[0]:q.type==='scale'?subtitles.chooseScale[0]:subtitles.freeResponse[0]} zh={q.type==='single'?subtitles.chooseOne[1]:q.type==='multiple'?subtitles.chooseMany[1]:q.type==='scale'?subtitles.chooseScale[1]:subtitles.freeResponse[1]}/></div>
        {q.type==='text' && <textarea autoFocus maxLength={2000} placeholder="여기에 답변을 입력해 주세요 / Enter your answer here / 请在此输入回答" value={current} onChange={e=>update(step,e.target.value)} rows={5}/>}
        {q.type==='single' && <div className="options">{q.options.map((v,i)=><button key={v} className={`option ${current===v?'selected':''}`} onClick={()=>update(step,v)}><span className="option-index">{String.fromCharCode(65+i)}</span><span className="option-copy"><span>{v}</span><small>EN · {questionTranslations[step].optionsEn[i]}</small><small>中文 · {questionTranslations[step].optionsZh[i]}</small></span><span className="radio"/></button>)}</div>}
        {q.type==='multiple' && <div className="options">{q.options.map((v,i)=><button key={v} className={`option ${current.includes(v)?'selected':''}`} onClick={()=>toggle(v)}><span className="option-index">{String.fromCharCode(65+i)}</span><span className="option-copy"><span>{v}</span><small>EN · {questionTranslations[step].optionsEn[i]}</small><small>中文 · {questionTranslations[step].optionsZh[i]}</small></span><span className="checkbox">{current.includes(v)&&<Check size={14}/>}</span></button>)}{q.other&&q.options.some(v=>v.startsWith('기타')&&current.includes(v))&&<input className="other-input" maxLength={500} placeholder="기타 의견을 입력해 주세요 / Other comments / 其他意见" value={answers[`${step}-other`]||''} onChange={e=>setAnswers({...answers,[`${step}-other`]:e.target.value})}/>}</div>}
        {q.type==='scale' && <div className="scale-wrap"><div className="scale-labels"><span>전혀 없다<small>{questionTranslations[step].scaleLowEn} · {questionTranslations[step].scaleLowZh}</small></span><span>매우 있다<small>{questionTranslations[step].scaleHighEn} · {questionTranslations[step].scaleHighZh}</small></span></div><div className="scale-options">{[1,2,3,4,5].map(n=><button key={n} className={`scale-option ${current===n?'selected':''}`} onClick={()=>update(step,n)}><span>{n}</span></button>)}</div><p className="scale-caption">선택한 숫자를 눌러주세요<small>Choose a number · 请选择一个分数</small></p></div>}
        {error&&<p className="error-message" role="alert">{error}</p>}<div className="question-actions"><button className="back-button" onClick={()=>{setError(''); if(step===0)setStage('intro');else setStep(step-1)}}><ChevronLeft size={17}/><span>이전<small>{subtitles.previous[0]} · {subtitles.previous[1]}</small></span></button>{step<questions.length-1?<button disabled={!canContinue} className="primary" onClick={()=>setStep(step+1)}><span>다음 질문<small>{subtitles.next[0]} · {subtitles.next[1]}</small></span><ChevronRight size={17}/></button>:<button disabled={!canContinue||saving} className="primary" onClick={finish}><span>{saving?'저장 중…':'응답 제출하기'}<small>{saving?'Saving… · 正在保存…':`${subtitles.submit[0]} · ${subtitles.submit[1]}`}</small></span><Send size={16}/></button>}</div>
      </div></section>}
    {stage==='complete'&&<section className="complete-card"><div className="complete-spark">✦</div><img src="/mascot-transparent.png" alt="HUSS 캐릭터"/><span className="eyebrow">THANK YOU · 저장 완료</span><h1>응답이 전달되었어요!</h1><p>응답이 Firestore에 저장되었습니다.<br/>학과: {profile.department}<br/>저장 ID: {savedDocId}</p><p>소중한 의견을 나눠주셔서 감사합니다.<br/>여러분의 목소리로 더 포용적인 캠퍼스를 만들어갈게요.</p><button className="primary" onClick={()=>{setProfile({gender:'',name:'',department:''});setAnswers({});setStep(0);setSavedDocId('');setStage('intro')}}>처음으로 돌아가기 <ChevronRight size={17}/></button></section>}
    <footer><span>HUSS 포용사회사업단 인지도 설문</span><span>함께 만드는 포용사회 <Leaf size={13}/></span></footer>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)

