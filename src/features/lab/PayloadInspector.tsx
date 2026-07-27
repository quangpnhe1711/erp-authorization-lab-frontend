import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Check, ClipboardCopy, History } from 'lucide-react'
import { Badge, Button, Card, CardHeader, Tabs } from '@/shared/ui/primitives'

export interface PayloadEntry {
  at: string
  label: string
  request: unknown
  response?: unknown
  error?: unknown
}

function stringify(value: unknown, pretty: boolean): string {
  if (value === undefined) return '—'
  return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)
}

/**
 * Shows the exact JSON a screen will send and what came back. It is deliberately a plain view of the
 * payload rather than a summary: the point of the lab is that nothing about the configuration is
 * implicit, including the shape of the request.
 */
export function PayloadInspector({
  request,
  response,
  error,
  history = [],
  title = 'Payload',
}: {
  request: unknown
  response?: unknown
  error?: unknown
  history?: PayloadEntry[]
  title?: string
}) {
  const [pretty, setPretty] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [tab, setTab] = useState('request')

  const tabs = useMemo(
    () => [
      { id: 'request', label: 'Request' },
      { id: 'response', label: error != null ? 'Response · lỗi' : 'Response' },
      { id: 'history', label: history.length > 0 ? `Lịch sử (${history.length})` : 'Lịch sử' },
    ],
    [error, history.length],
  )

  const copy = async (text: string, key: string) => {
    await navigator.clipboard?.writeText(text)
    setCopied(key)
    window.setTimeout(() => setCopied(null), 1500)
  }

  const body =
    tab === 'request' ? request : tab === 'response' ? (error ?? response) : undefined
  const text = stringify(body, pretty)

  return (
    <Card padded={false} data-testid="payload-inspector">
      <CardHeader
        title={title}
        description="JSON gửi lên backend và kết quả trả về"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPretty((value) => !value)}
              data-testid="payload-pretty-toggle"
            >
              {pretty ? 'Minified' : 'Pretty'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={copied === tab ? Check : ClipboardCopy}
              onClick={() => copy(text, tab)}
              data-testid="payload-copy"
            >
              {copied === tab ? 'Đã copy' : 'Copy JSON'}
            </Button>
          </div>
        }
      />
      <div className="border-b border-line px-4">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'history' ? (
        <ul className="divide-y divide-line" data-testid="payload-history">
          {history.length === 0 && (
            <li className="px-4 py-6 text-sm text-ink-muted">Chưa có thay đổi nào trong phiên này.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry.at}-${index}`} className="px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <History size={14} className="text-ink-subtle" aria-hidden />
                {entry.label}
                <span className="text-xs font-normal text-ink-subtle">{entry.at}</span>
                {entry.error != null && <Badge tone="brand">Lỗi</Badge>}
              </p>
              <pre className="dev-surface mt-2 max-h-52 overflow-auto rounded-control p-3">
                {stringify(entry.error ?? entry.response ?? entry.request, pretty)}
              </pre>
            </li>
          ))}
        </ul>
      ) : (
        <pre
          className={clsx('dev-surface max-h-[420px] overflow-auto p-4')}
          data-testid={`payload-${tab}`}
        >
          {text}
        </pre>
      )}
    </Card>
  )
}
