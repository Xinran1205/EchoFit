import { useEffect, useState } from 'react'
import { DotLoading, Toast } from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppCard } from '../../components/app/AppCard'
import { AppPage } from '../../components/app/AppPage'
import { BottomSubmitBar } from '../../components/app/BottomSubmitBar'
import { PageHeader } from '../../components/app/PageHeader'
import { EchoMessagePanel } from '../../components/echo/EchoMessagePanel'
import { EchoSummaryCard } from '../../components/echo/EchoSummaryCard'
import { FutureMessageSheet } from '../../components/echo/FutureMessageSheet'
import { getEchoByRecord, saveFutureMessage } from '../../features/echo/echo.api'
import type { EchoResponse } from '../../features/echo/echo.types'
import { getErrorMessage } from '../../lib/api'

export function EchoPage() {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const [searchParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [data, setData] = useState<EchoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!recordId) {
      setLoading(false)
      setErrorMessage('缺少训练记录 ID')
      return
    }

    const targetRecordId = recordId
    let active = true

    async function loadEcho() {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await getEchoByRecord(targetRecordId)
        if (!active) {
          return
        }
        setData(response)
      } catch (error) {
        if (!active) {
          return
        }
        setErrorMessage(getErrorMessage(error, '回声加载失败'))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadEcho()

    return () => {
      active = false
    }
  }, [recordId])

  const source = searchParams.get('source') ?? 'home'

  async function handleSaveFutureMessage(content: string) {
    if (!recordId) {
      return
    }

    await saveFutureMessage({ recordId, content })
    Toast.show({ content: '未来话已保存' })
  }

  return (
    <AppPage className="app-page--with-bottom-bar">
      <PageHeader title="回声" />

      {loading ? (
        <section className="app-section">
          <AppCard className="status-card">
            <DotLoading color="primary" />
            <div className="status-card__text">正在生成这次训练的回声...</div>
          </AppCard>
        </section>
      ) : errorMessage || !data ? (
        <section className="app-section">
          <AppCard className="status-card">
            <div className="status-card__text">{errorMessage || '未找到回声内容'}</div>
          </AppCard>
        </section>
      ) : (
        <>
          <section className="app-section">
            <div className="echo-stage">
              <div className="echo-stage__halo">
                <img src="/apple-touch-icon.png" alt="EchoFit" />
              </div>
              <div className="echo-stage__title">训练已收进今天</div>
              <div className="echo-stage__meta">
                一次训练，一次回声。接下来只需要安静看完它。
              </div>
            </div>
          </section>

          <section className="app-section">
            <EchoSummaryCard record={data.record} />
          </section>

          <section className="app-section">
            <EchoMessagePanel content={data.echo.content} />
          </section>
        </>
      )}

      <section className="app-section">
        <button
          type="button"
          className="future-note-entry pressable"
          disabled={!data}
          onClick={() => setSheetOpen(true)}
        >
          <span className="future-note-entry__copy">
            <strong className="future-note-entry__title">给未来训练日的自己留一句话</strong>
            <span className="future-note-entry__hint">
              留下一句短句，未来某次回声有机会把它带回来。
            </span>
          </span>
          <span className="future-note-entry__arrow">
            <RightOutline />
          </span>
        </button>
      </section>

      <BottomSubmitBar
        text="完成"
        onClick={() => navigate(source === 'log' ? '/log' : '/')}
      />

      <FutureMessageSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={handleSaveFutureMessage}
      />
    </AppPage>
  )
}
