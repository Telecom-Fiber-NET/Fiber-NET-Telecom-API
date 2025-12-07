[**IXC SDK v1.0.0**](../../../README.md)

***

[IXC SDK](../../../modules.md) / [resources/contratos](../README.md) / Contratos

# Class: Contratos

Defined in: [resources/contratos/index.ts:10](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/contratos/index.ts#L10)

Classe para gerenciar contratos.

## Extends

- [`QueryBase`](../../base/classes/QueryBase.md)

## Constructors

### Constructor

> **new Contratos**(`config`): `Contratos`

Defined in: [resources/contratos/index.ts:12](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/contratos/index.ts#L12)

#### Parameters

##### config

###### baseUrl

`string`

###### token

`string`

#### Returns

`Contratos`

#### Overrides

[`QueryBase`](../../base/classes/QueryBase.md).[`constructor`](../../base/classes/QueryBase.md#constructor)

## Methods

### buscarContratosPorId()

> **buscarContratosPorId**(`id`): `Promise`\<[`Contrato`](../types/type-aliases/Contrato.md)\>

Defined in: [resources/contratos/index.ts:45](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/contratos/index.ts#L45)

Busca um contrato pelo seu id.

#### Parameters

##### id

`number`

#### Returns

`Promise`\<[`Contrato`](../types/type-aliases/Contrato.md)\>

***

### buscarContratosPorIdCliente()

> **buscarContratosPorIdCliente**(`id`): `Promise`\<[`Contrato`](../types/type-aliases/Contrato.md)[]\>

Defined in: [resources/contratos/index.ts:62](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/contratos/index.ts#L62)

Busca contratos por id de cliente.

#### Parameters

##### id

`number`

#### Returns

`Promise`\<[`Contrato`](../types/type-aliases/Contrato.md)[]\>

***

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

#### Inherited from

[`QueryBase`](../../base/classes/QueryBase.md).[`create`](../../base/classes/QueryBase.md#create)

***

### desbloqueioConfianca()

> **desbloqueioConfianca**(`id`): `Promise`\<`any`\>

Defined in: [resources/contratos/index.ts:85](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/contratos/index.ts#L85)

Solicita o desbloqueio de confiança para um contrato.

#### Parameters

##### id

`number`

O ID do contrato.

#### Returns

`Promise`\<`any`\>

***

### filtrarContratos()

> **filtrarContratos**(`attr`, `oper`, `page`, `sortAttr`, `sortorder`): `Promise`\<[`Contrato`](../types/type-aliases/Contrato.md)[]\>

Defined in: [resources/contratos/index.ts:19](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/contratos/index.ts#L19)

Filtra contratos com base em um atributo.

#### Parameters

##### attr

###### desbloqueio_confianca?

`string` \| `number` \| `boolean`

###### descricao_aux_plano_venda?

`string` \| `number` \| `boolean`

###### id?

`string` \| `number` \| `boolean`

###### id_cliente?

`string` \| `number` \| `boolean`

###### login?

`string` \| `number` \| `boolean`

###### status?

`string` \| `number` \| `boolean`

##### oper

`"="` | `">"` | `"<"` | `"like"`

##### page

`number` = `1`

##### sortAttr

keyof [`Contrato`](../types/type-aliases/Contrato.md) = `'id_cliente'`

##### sortorder

`"desc"` | `"asc"`

#### Returns

`Promise`\<[`Contrato`](../types/type-aliases/Contrato.md)[]\>

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

#### Inherited from

[`QueryBase`](../../base/classes/QueryBase.md).[`remove`](../../base/classes/QueryBase.md#remove)

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

[`QueryBody`](../../base/type-aliases/QueryBody.md)

#### Returns

`Promise`\<`T`\>

#### Inherited from

[`QueryBase`](../../base/classes/QueryBase.md).[`request`](../../base/classes/QueryBase.md#request)

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

#### Inherited from

[`QueryBase`](../../base/classes/QueryBase.md).[`update`](../../base/classes/QueryBase.md#update)
