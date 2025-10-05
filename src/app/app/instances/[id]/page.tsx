import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth/server'
import { instanceService } from '@/lib/services/instance-service'

interface InstanceDetailsPageProps {
  params: Promise<{ id: string }>
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://auto-ws.vercel.app'

export default async function InstanceDetailsPage({
  params
}: InstanceDetailsPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/app')
  }

  try {
    const { id } = await params
    const instance = await instanceService.getOwnedInstance(user.id, id)

    return (
      <div className="space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              API de mensajería para {instance.label}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Usa esta instancia de WhatsApp para enviar mensajes mediante
              peticiones HTTP seguras.
            </p>
          </div>
          <Link href="/app">
            <Button variant="outline">Volver al panel</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200/70 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Credenciales principales</CardTitle>
              <CardDescription>
                Incluye estos valores en cada petición para autenticarte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase text-slate-500">Instance ID</p>
                <p className="font-mono text-base text-slate-900 dark:text-slate-100">
                  {instance.id}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">API Key</p>
                <p className="font-mono break-all text-base text-slate-900 dark:text-slate-100">
                  {instance.apiKey}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">
                  Endpoint de mensajes
                </p>
                <p className="font-mono break-all text-base text-slate-900 dark:text-slate-100">
                  POST {baseUrl}/api/instances/{instance.id}/messages
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-amber-300/60 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-600/70 dark:bg-amber-900/40 dark:text-amber-200">
                Mantén tu clave privada, cualquiera con acceso podrá enviar
                mensajes desde tu número conectado.
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Encabezados requeridos</CardTitle>
              <CardDescription>
                Asegúrate de enviar la clave y el tipo de contenido correcto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100 dark:border-slate-700">
                {`{
  "x-api-key": "${instance.apiKey}",
  "Content-Type": "application/json"
}`}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200/70 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Cuerpo mínimo de la petición</CardTitle>
              <CardDescription>
                Estructura base con el número destino y el contenido del
                mensaje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100 dark:border-slate-700">
                {`{
  "to": "525512345678",
  "content": {
    "text": "Hola desde la API"
  }
}`}
              </pre>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Puedes usar el campo <code>content</code> directamente como un
                objeto compatible con Baileys (ej. <code>image</code>,
                <code>audio</code>, <code>templateButtons</code>, etc.). Si
                prefieres, también aceptamos un string y lo convertiremos a un
                mensaje de texto simple.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Ejemplo completo con fetch</CardTitle>
              <CardDescription>
                Copia y pega este snippet desde tu backend o una herramienta
                como Postman.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100 dark:border-slate-700">
                {`await fetch('${baseUrl}/api/instances/${instance.id}/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${instance.apiKey}'
  },
  body: JSON.stringify({
    to: '525512345678',
    content: {
      text: 'Hola desde la API'
    }
  })
})
  .then((res) => res.json())
  .then((data) => {
    console.log('Respuesta de Baileys', data)
  })`}
              </pre>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/70 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Respuesta típica</CardTitle>
            <CardDescription>
              Regresamos lo mismo que Baileys entrega tras intentar enviar el
              mensaje. Úsalo para auditar o depurar tus peticiones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100 dark:border-slate-700">
              {`{
  "ok": true,
  "data": {
    "key": {
      "remoteJid": "5215512345678@s.whatsapp.net",
      "id": "BAE5...."
    },
    "status": "OK",
    "messageTimestamp": 1688151234
  }
}`}
            </pre>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Ante un error regresaremos un objeto{' '}
              <code>
                {'{'} error, message {'}'}
              </code>
              con el detalle proporcionado por Baileys o nuestra validación.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error('[instance-details]', error)
    notFound()
  }
}
