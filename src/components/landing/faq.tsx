import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const faqs = [
  {
    question: '¿Necesito una cuenta de Firebase para empezar?',
    answer:
      'Sí, la plataforma utiliza Firebase para autenticar usuarios y almacenar la metadata de las instancias. Puedes usar el modo demo con las credenciales por defecto y luego reemplazarlas por las tuyas.'
  },
  {
    question: '¿Cómo se maneja el cobro a mis clientes?',
    answer:
      'Con Stripe puedes crear precios de suscripción o pagos únicos. El dashboard te deja vincular cada cliente a un plan y monitorear su estado.'
  },
  {
    question: '¿Qué tan seguro es usar Baileys para WhatsApp?',
    answer:
      'Baileys es una librería ampliamente utilizada. Mantenemos las sesiones en un almacenamiento cifrado y otorgamos controles de pausa, renovación y logs para detectar actividad inusual.'
  }
]

export const FAQ = () => (
  <section id="faq" className="mx-auto flex max-w-5xl flex-col gap-8">
    <div className="text-center">
      <h2 className="text-3xl font-semibold md:text-4xl">
        Preguntas frecuentes
      </h2>
      <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
        Si tienes dudas específicas, escríbenos y agendamos una demo
        personalizada.
      </p>
    </div>
    <div className="space-y-4">
      {faqs.map((faq) => (
        <Card
          key={faq.question}
          className="border-slate-200/70 dark:border-slate-700"
        >
          <CardHeader>
            <CardTitle className="text-lg">{faq.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {faq.answer}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
)
