[**IXC SDK v1.0.0**](../../../README.md)

***

[IXC SDK](../../../modules.md) / [resources/financeiro](../README.md) / Financeiros

# Class: Financeiros

Defined in: [resources/financeiro/index.ts:11](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/financeiro/index.ts#L11)

Classe para gerenciar o financeiro (contas a receber).

## Extends

- [`QueryBase`](../../base/classes/QueryBase.md)

## Constructors

### Constructor

> **new Financeiros**(`config`): `Financeiros`

Defined in: [resources/financeiro/index.ts:12](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/financeiro/index.ts#L12)

#### Parameters

##### config

###### baseUrl

`string`

###### token

`string`

#### Returns

`Financeiros`

#### Overrides

[`QueryBase`](../../base/classes/QueryBase.md).[`constructor`](../../base/classes/QueryBase.md#constructor)

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

#### Inherited from

[`QueryBase`](../../base/classes/QueryBase.md).[`create`](../../base/classes/QueryBase.md#create)

***

### listar()

> **listar**(`attr`, `oper`, `page`, `sortAttr`, `sortorder`): `Promise`\<[`Financeiro`](../types/type-aliases/Financeiro.md)[]\>

Defined in: [resources/financeiro/index.ts:19](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/financeiro/index.ts#L19)

Lista/Filtra registros financeiros.

#### Parameters

##### attr

##### oper

`"="` | `">"` | `"<"` | `"like"`

##### page

`number` = `1`

##### sortAttr

keyof [`Financeiro`](../types/type-aliases/Financeiro.md) = `'id'`

##### sortorder

`"desc"` | `"asc"`

#### Returns

`Promise`\<[`Financeiro`](../types/type-aliases/Financeiro.md)[]\>

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
