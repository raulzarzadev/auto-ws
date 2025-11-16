# 🔧 Correcciones de Serialización - Copiar y Pegar

## ⚠️ IMPORTANTE

Estos cambios eliminan el uso de `doc.data() as Type` que causa el error de serialización.
Cada objeto se mapea manualmente a un objeto literal plano.

---

## 1️⃣ `/src/lib/repositories/user-repository.ts`

### Reemplazar método `listAll` (línea ~10-12):

**ANTES:**

```typescript
  async listAll() {
    const snapshot = await firebaseAdminDb.collection(COLLECTION).get()
    return snapshot.docs.map((doc) => doc.data() as AppUser)
  },
```

**DESPUÉS:**

```typescript
  async listAll() {
    const snapshot = await firebaseAdminDb.collection(COLLECTION).get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: data.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt
      } as AppUser
    })
  },
```

---

### Reemplazar método `findById` (línea ~14-16):

**ANTES:**

```typescript
  async findById(id: string) {
    const doc = await firebaseAdminDb.collection(COLLECTION).doc(id).get()
    return doc.exists ? (doc.data() as AppUser) : null
  },
```

**DESPUÉS:**

```typescript
  async findById(id: string) {
    const doc = await firebaseAdminDb.collection(COLLECTION).doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()
    if (!data) return null

    return {
      id: data.id,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt
    } as AppUser
  },
```

---

## 2️⃣ `/src/lib/repositories/instance-repository.ts`

### Reemplazar método `ensureApiKey` (línea ~106-124):

**ANTES:**

```typescript
  async ensureApiKey(id: string) {
    const docRef = firebaseAdminDb.collection(COLLECTION).doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) {
      return null
    }

    const data = snapshot.data() as WhatsAppInstance
    if (data.apiKey) {
      return data.apiKey
    }

    const apiKey = generateApiKey()
    await docRef.update({
      apiKey,
      updatedAt: new Date().toISOString()
    })

    return apiKey
  },
```

**DESPUÉS:**

```typescript
  async ensureApiKey(id: string) {
    const docRef = firebaseAdminDb.collection(COLLECTION).doc(id)
    const snapshot = await docRef.get()
    if (!snapshot.exists) {
      return null
    }

    const data = snapshot.data()
    if (!data) return null

    if (data.apiKey) {
      return data.apiKey
    }

    const apiKey = generateApiKey()
    await docRef.update({
      apiKey,
      updatedAt: new Date().toISOString()
    })

    return apiKey
  },
```

---

### Reemplazar método `updateStatus` (línea ~125-147):

**ANTES:**

```typescript
  async updateStatus(
    id: string,
    status: WhatsAppInstance['status'],
    qrCode?: string | null
  ) {
    const docRef = firebaseAdminDb.collection(COLLECTION).doc(id)
    const updatePayload: Partial<WhatsAppInstance> & { updatedAt: string } = {
      status,
      updatedAt: new Date().toISOString()
    }

    if (qrCode !== undefined) {
      updatePayload.qrCode = qrCode
    }

    await docRef.update(updatePayload)
    const snapshot = await docRef.get()
    if (!snapshot.exists) {
      throw new Error('INSTANCE_NOT_FOUND')
    }
    return snapshot.data() as WhatsAppInstance
  }
```

**DESPUÉS:**

```typescript
  async updateStatus(
    id: string,
    status: WhatsAppInstance['status'],
    qrCode?: string | null
  ) {
    const docRef = firebaseAdminDb.collection(COLLECTION).doc(id)
    const updatePayload: Partial<WhatsAppInstance> & { updatedAt: string } = {
      status,
      updatedAt: new Date().toISOString()
    }

    if (qrCode !== undefined) {
      updatePayload.qrCode = qrCode
    }

    await docRef.update(updatePayload)
    const snapshot = await docRef.get()
    if (!snapshot.exists) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    const data = snapshot.data()
    if (!data) {
      throw new Error('INSTANCE_NOT_FOUND')
    }

    return {
      id: data.id,
      ownerId: data.ownerId,
      label: data.label,
      status: data.status,
      qrCode: data.qrCode ?? null,
      phoneNumber: data.phoneNumber,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      apiKey: data.apiKey,
      metadata: data.metadata ?? {}
    } as WhatsAppInstance
  }
```

---

## ✅ Verificación

Después de aplicar estos cambios:

1. Reinicia el servidor de desarrollo: `pnpm dev`
2. Recarga la página `/app`
3. El error "Only plain objects..." debe desaparecer

## 🔍 Por qué funciona

- `doc.data()` de Firestore devuelve objetos con prototipos internos
- Next.js no puede serializar estos prototipos para pasarlos de Server → Client
- Al crear objetos literales `{ ... }` con las propiedades, eliminamos los prototipos
- Los objetos planos sí son serializables

---

**Autor:** GitHub Copilot  
**Fecha:** 16 de noviembre de 2025
