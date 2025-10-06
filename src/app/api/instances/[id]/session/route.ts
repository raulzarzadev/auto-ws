import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { requireSession } from '@/lib/auth/server'
import { instanceService } from '@/lib/services/instance-service'
import { instanceRepository } from '@/lib/repositories/instance-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const textEncoder = new TextEncoder()

const serializeEvent = (event: string, payload: unknown = {}) =>
  `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`

const startSessionStream = async (request: Request, params: { id: string }) => {
  const user = await requireSession()
  const instanceId = params.id

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let session:
        | Awaited<
            ReturnType<typeof instanceService.startInteractive>
          >['session']
        | null = null
      let closed = false
      let heartbeat: NodeJS.Timeout | null = null

      const send = (event: string, payload?: unknown) => {
        if (closed) return
        controller.enqueue(textEncoder.encode(serializeEvent(event, payload)))
      }

      const finalize = async (options: { endSession?: boolean } = {}) => {
        if (closed) return
        closed = true

        if (heartbeat) {
          clearInterval(heartbeat)
        }

        request.signal.removeEventListener('abort', abort)

        if (options.endSession && session) {
          try {
            session.end()
          } catch (error) {
            console.error('[instances.session.finalize]', error)
          }
        }

        controller.close()
      }

      const abort = () => {
        void finalize({ endSession: true })
      }

      request.signal.addEventListener('abort', abort)
      ;(async () => {
        try {
          const result = await instanceService.startInteractive(
            user.id,
            instanceId
          )

          session = result.session

          send('instance', { instance: result.instance })

          heartbeat = setInterval(() => {
            send('ping')
          }, 15_000)

          session.completion
            .then(async () => {
              const latest = await instanceRepository.findById(instanceId)
              send('connected', { instance: latest })
              await revalidatePath('/app')
              void finalize({ endSession: false })
            })
            .catch(async (error: unknown) => {
              console.error('[instances.session.completion]', error)
              const message = instanceService.formatStartError(error)
              send('error', { message })
              await finalize({ endSession: true })
            })
        } catch (error) {
          console.error('[instances.session.startInteractive]', error)
          const message = instanceService.formatStartError(error)
          send('error', { message })
          await finalize({ endSession: true })
        }
      })().catch(async (error: unknown) => {
        console.error('[instances.session.start]', error)
        const message = instanceService.formatStartError(error)
        send('error', { message })
        await finalize({ endSession: true })
      })
    },
    cancel() {
      // When the client disconnects we rely on the abort listener to clean up.
      // This method is required by the interface but the listener already
      // handles teardown.
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}

export const GET = async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => startSessionStream(request, await context.params)

export const POST = async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => startSessionStream(request, await context.params)
