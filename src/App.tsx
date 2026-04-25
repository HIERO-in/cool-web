import { useState, useEffect, useCallback } from 'react'
import './App.css'

interface QuitData {
  quitDate: string
  cigarettesPerDay: number
  pricePerPack: number
  cigarettesPerPack: number
}

interface CravingEntry {
  id: number
  timestamp: string
  resisted: boolean
}

const MILESTONES = [
  { hours: 0.33, icon: '🫁', title: '20분', desc: '심박수와 혈압이 정상으로 돌아옵니다' },
  { hours: 8, icon: '🩸', title: '8시간', desc: '혈중 일산화탄소 수치가 절반으로 감소합니다' },
  { hours: 24, icon: '❤️', title: '24시간', desc: '심장마비 위험이 감소하기 시작합니다' },
  { hours: 48, icon: '👃', title: '48시간', desc: '미각과 후각이 살아나기 시작합니다' },
  { hours: 72, icon: '🌬️', title: '72시간', desc: '기관지가 이완되어 호흡이 편해집니다' },
  { hours: 336, icon: '🏃', title: '2주', desc: '혈액 순환이 개선되고 폐 기능이 향상됩니다' },
  { hours: 2160, icon: '🫀', title: '3개월', desc: '심장병 위험이 절반으로 줄어듭니다' },
  { hours: 8760, icon: '🎉', title: '1년', desc: '관상동맥 질환 위험이 흡연자의 절반으로 감소합니다' },
]

const QUOTES = [
  '포기하지 마세요. 오늘의 고통이 내일의 힘이 됩니다.',
  '당신은 이미 가장 어려운 결정을 내렸습니다.',
  '매 순간이 당신을 더 건강하게 만들고 있습니다.',
  '흡연 충동은 3분이면 사라집니다. 버텨보세요!',
  '당신의 몸은 지금 이 순간에도 회복하고 있습니다.',
  '작은 승리가 모여 큰 변화를 만듭니다.',
  '오늘 하루만 더. 그것이면 충분합니다.',
  '자유는 한 모금의 담배보다 가치 있습니다.',
]

function loadData<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [quitData, setQuitData] = useState<QuitData | null>(() => loadData('quitData', null))
  const [cravings, setCravings] = useState<CravingEntry[]>(() => loadData('cravings', []))
  const [tab, setTab] = useState<'home' | 'health' | 'log'>('home')
  const [showModal, setShowModal] = useState(false)
  const [now, setNow] = useState(Date.now())

  // Setup form state
  const [formDate, setFormDate] = useState('')
  const [formCigs, setFormCigs] = useState('20')
  const [formPrice, setFormPrice] = useState('4500')
  const [formPerPack, setFormPerPack] = useState('20')

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (quitData) localStorage.setItem('quitData', JSON.stringify(quitData))
  }, [quitData])

  useEffect(() => {
    localStorage.setItem('cravings', JSON.stringify(cravings))
  }, [cravings])

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault()
    const data: QuitData = {
      quitDate: formDate,
      cigarettesPerDay: Number(formCigs),
      pricePerPack: Number(formPrice),
      cigarettesPerPack: Number(formPerPack),
    }
    setQuitData(data)
  }

  const getElapsed = useCallback(() => {
    if (!quitData) return { hours: 0, days: 0, totalMinutes: 0 }
    const diff = now - new Date(quitData.quitDate).getTime()
    const totalMinutes = Math.max(0, Math.floor(diff / 60000))
    const hours = Math.floor(totalMinutes / 60)
    const days = Math.floor(hours / 24)
    return { hours, days, totalMinutes }
  }, [quitData, now])

  const getMoneySaved = useCallback(() => {
    if (!quitData) return 0
    const { hours } = getElapsed()
    const pricePerCig = quitData.pricePerPack / quitData.cigarettesPerPack
    const cigsNotSmoked = (hours / 24) * quitData.cigarettesPerDay
    return Math.floor(pricePerCig * cigsNotSmoked)
  }, [quitData, getElapsed])

  const getCigsNotSmoked = useCallback(() => {
    if (!quitData) return 0
    const { hours } = getElapsed()
    return Math.floor((hours / 24) * quitData.cigarettesPerDay)
  }, [quitData, getElapsed])

  const getLifeRegained = useCallback(() => {
    const cigs = getCigsNotSmoked()
    const minutes = cigs * 11 // 담배 1개비당 약 11분 수명 단축
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}일 ${hours % 24}시간`
    if (hours > 0) return `${hours}시간 ${minutes % 60}분`
    return `${minutes}분`
  }, [getCigsNotSmoked])

  const handleCraving = (resisted: boolean) => {
    const entry: CravingEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      resisted,
    }
    setCravings(prev => [entry, ...prev])
    setShowModal(false)
  }

  const handleReset = () => {
    if (window.confirm('정말로 모든 데이터를 초기화하시겠습니까?')) {
      localStorage.removeItem('quitData')
      localStorage.removeItem('cravings')
      setQuitData(null)
      setCravings([])
      setTab('home')
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${min}`
  }

  const resistRate = cravings.length > 0
    ? Math.round((cravings.filter(c => c.resisted).length / cravings.length) * 100)
    : 0

  // Setup Screen
  if (!quitData) {
    return (
      <>
        <header className="app-header">
          <h1>금연 조절</h1>
          <p>건강한 삶을 향한 첫 걸음</p>
        </header>
        <form className="setup-card" onSubmit={handleSetup}>
          <h2>금연 정보 설정</h2>
          <div className="form-group">
            <label>금연 시작일</label>
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>하루 흡연량 (개비)</label>
            <input
              type="number"
              min="1"
              value={formCigs}
              onChange={e => setFormCigs(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>담배 한 갑 가격 (원)</label>
            <input
              type="number"
              min="100"
              value={formPrice}
              onChange={e => setFormPrice(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>한 갑당 개비 수</label>
            <input
              type="number"
              min="1"
              value={formPerPack}
              onChange={e => setFormPerPack(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={!formDate}>
            금연 시작하기
          </button>
        </form>
      </>
    )
  }

  const { hours, days } = getElapsed()
  const quoteIndex = days % QUOTES.length

  return (
    <>
      <header className="app-header">
        <h1>금연 조절</h1>
        <p>당신은 해낼 수 있습니다</p>
      </header>

      {/* Home Tab */}
      {tab === 'home' && (
        <>
          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="stat-icon">🚭</div>
              <div className="stat-value">
                {days > 0 ? `${days}일` : `${hours}시간`}
              </div>
              <div className="stat-label">금연 경과 시간</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{getMoneySaved().toLocaleString()}원</div>
              <div className="stat-label">절약한 금액</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚬</div>
              <div className="stat-value">{getCigsNotSmoked().toLocaleString()}</div>
              <div className="stat-label">안 피운 담배</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-value" style={{ fontSize: '1.1rem' }}>{getLifeRegained()}</div>
              <div className="stat-label">되찾은 수명</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💪</div>
              <div className="stat-value">{resistRate}%</div>
              <div className="stat-label">유혹 극복률</div>
            </div>
          </div>

          <div className="section">
            <div className="motivation-card">
              <div className="quote">&ldquo;{QUOTES[quoteIndex]}&rdquo;</div>
            </div>
          </div>
        </>
      )}

      {/* Health Tab */}
      {tab === 'health' && (
        <div className="section">
          <div className="section-title">건강 회복 마일스톤</div>
          {MILESTONES.map((m, i) => {
            const achieved = hours >= m.hours
            const progress = Math.min(100, (hours / m.hours) * 100)
            return (
              <div key={i} className={`milestone ${achieved ? 'achieved' : 'pending'}`}>
                <div className="milestone-icon">{m.icon}</div>
                <div className="milestone-info">
                  <h4>{m.title}</h4>
                  <p>{m.desc}</p>
                  {!achieved && (
                    <div className="progress-bar">
                      <div className="fill" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="milestone-check">{achieved ? '✅' : '⏳'}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Log Tab */}
      {tab === 'log' && (
        <div className="section">
          <div className="section-title">흡연 욕구 기록</div>
          <button className="craving-btn" onClick={() => setShowModal(true)}>
            흡연 욕구가 느껴져요
          </button>
          {cravings.length === 0 ? (
            <div className="empty-state">아직 기록이 없습니다</div>
          ) : (
            <ul className="craving-list">
              {cravings.map(c => (
                <li key={c.id} className="craving-item">
                  <span className="time">{formatDate(c.timestamp)}</span>
                  <span className={`result ${c.resisted ? 'resisted' : 'smoked'}`}>
                    {c.resisted ? '참았어요 💪' : '피웠어요 😢'}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="reset-section">
            <button className="btn-reset" onClick={handleReset}>
              데이터 초기화
            </button>
          </div>
        </div>
      )}

      {/* Craving Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>흡연 욕구가 느껴지나요?</h3>
            <p>심호흡을 하고, 물을 한 잔 마셔보세요.<br />3분만 버티면 욕구가 사라집니다.</p>
            <div className="modal-actions">
              <button className="btn-resist" onClick={() => handleCraving(true)}>
                참았어요!
              </button>
              <button className="btn-smoke" onClick={() => handleCraving(false)}>
                피웠어요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Nav */}
      <nav className="tab-nav">
        <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
          <span className="tab-icon">📊</span>
          대시보드
        </button>
        <button className={tab === 'health' ? 'active' : ''} onClick={() => setTab('health')}>
          <span className="tab-icon">❤️</span>
          건강 회복
        </button>
        <button className={tab === 'log' ? 'active' : ''} onClick={() => setTab('log')}>
          <span className="tab-icon">📝</span>
          기록
        </button>
      </nav>
    </>
  )
}

export default App
