[**IXC SDK v1.0.0**](../../../README.md)

***

[IXC SDK](../../../modules.md) / [resources/base](../README.md) / QueryBase

# Abstract Class: QueryBase

Defined in: [resources/base.ts:36](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/base.ts#L36)

Classe base para realizar requisições à API.

## Extended by

- [`Clientes`](../../clientes/classes/Clientes.md)
- [`Contratos`](../../contratos/classes/Contratos.md)
- [`Financeiros`](../../financeiro/classes/Financeiros.md)
- [`Logins`](../../logins/classes/Logins.md)

## Constructors

### Constructor

> **new QueryBase**(`config`): `QueryBase`

Defined in: [resources/base.ts:41](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/base.ts#L41)

#### Parameters

##### config

[`Config`](../type-aliases/Config.md)

#### Returns

`QueryBase`

## Methods

### create()

> **create**\<`T`, `U`\>(`endpoint`, `data`): `Promise`\<`U`\>

Defined in: [resources/base.ts:92](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/base.ts#L92)

#### Type Parameters

##### T

`T`

##### U

`U`

#### Parameters

##### endpoint

`string`

##### data

`T`

#### Returns

`Promise`\<`U`\>

***

### remove()

> **remove**\<`T`\>(`endpoint`, `id`): `Promise`\<`T`\>

Defined in: [resources/base.ts:108](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/base.ts#L108)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### id

`number`

#### Returns

`Promise`\<`T`\>

***

### request()

> **request**\<`T`\>(`endpoint`, `query`): `Promise`\<`T`\>

Defined in: [resources/base.ts:84](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/base.ts#L84)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### query

[`QueryBody`](../type-aliases/QueryBody.md)

#### Returns

`Promise`\<`T`\>

***

### update()

> **update**\<`T`, `U`\>(`endpoint`, `id`, `data`): `Promise`\<`U`\>

Defined in: [resources/base.ts:100](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/base.ts#L100)

#### Type Parameters

##### T

`T`

##### U

`U`

#### Parameters

##### endpoint

`string`

##### id

`number`

##### data

`T`

#### Returns

`Promise`\<`U`\>
