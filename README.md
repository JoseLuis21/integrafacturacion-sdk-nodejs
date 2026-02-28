# @integrafacturacion/sdk

SDK en Node.js + TypeScript para consumir la API de [IntegraFacturacion](https://api.integrafacturacion.cl), siguiendo arquitectura hexagonal.

## Instalacion

```bash
npm install @integrafacturacion/sdk
```

## Estructura

- `src/domain`: modelos y estructuras DTE
- `src/ports`: contrato del API client
- `src/application`: capa de servicio
- `src/adapters/httpintegra`: adapter HTTP concreto

## Uso recomendado

```ts
import { Client, Service, encodeDataDTE } from '@integrafacturacion/sdk';

const adapter = new Client({
  apiKey: 'TU_X_API_KEY'
});

const service = new Service(adapter);

const dataDTE = encodeDataDTE({
  Encabezado: {
    IdDoc: {
      TipoDTE: 33,
      FchEmis: '2026-02-03'
    }
  }
});

const response = await service.createDocument({
  code_sii: '33',
  data_dte: dataDTE,
  idempotencyKey: 'mi-idempotency-key-1'
});

console.log(response);
```

## Construir `data_dte` con tipos

Incluye tipos completos para:

- `Dte33Data`
- `Dte34Data`
- `Dte39Data`
- `Dte41Data`
- `Dte46Data`
- `Dte52Data`
- `Dte56Data`
- `Dte61Data`

Y builders:

- `dte33ToRequest`
- `dte34ToRequest`
- `dte39ToRequest`
- `dte41ToRequest`
- `dte46ToRequest`
- `dte52ToRequest`
- `dte56ToRequest`
- `dte61ToRequest`

## Endpoints implementados

- `createDocument`
- `getDocument`
- `getDocumentStats`
- `createCession`
- `generatePDF`
- `createBusiness`
- `updateBusiness`
- `uploadCertificate`
- `getCertificateInfo`
- `getMe`
- `createPurchase`
- `getNumerationSummary`
- `getLastUsedFolio`
- `uploadNumeration`
- `deleteNumeration`

## Scripts

```bash
pnpm build
pnpm test
pnpm typecheck
```
