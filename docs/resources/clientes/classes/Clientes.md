[**IXC SDK v1.0.0**](../../../README.md)

***

[IXC SDK](../../../modules.md) / [resources/clientes](../README.md) / Clientes

# Class: Clientes

Defined in: [resources/clientes/index.ts:9](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/clientes/index.ts#L9)

Classe para gerenciar clientes

## Extends

- [`QueryBase`](../../base/classes/QueryBase.md)

## Constructors

### Constructor

> **new Clientes**(`config`): `Clientes`

Defined in: [resources/clientes/index.ts:10](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/clientes/index.ts#L10)

#### Parameters

##### config

###### baseUrl

`string`

###### token

`string`

#### Returns

`Clientes`

#### Overrides

[`QueryBase`](../../base/classes/QueryBase.md).[`constructor`](../../base/classes/QueryBase.md#constructor)

## Methods

### alterarSenhaHotsite()

> **alterarSenhaHotsite**(`id`, `novaSenha`): `Promise`\<`any`\>

Defined in: [resources/clientes/index.ts:79](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/clientes/index.ts#L79)

Altera a senha do hotsite (Área do Cliente) para um cliente.

#### Parameters

##### id

`number`

O ID do cliente.

##### novaSenha

`string`

A nova senha em texto plano.

#### Returns

`Promise`\<`any`\>

***

### buscarClientesPorCpfCnpj()

> **buscarClientesPorCpfCnpj**(`cpfCnpj`): `Promise`\<[`Cliente`](../types/type-aliases/Cliente.md) \| `null`\>

Defined in: [resources/clientes/index.ts:43](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/clientes/index.ts#L43)

Busca clientes com base em um CPF/CNPJ.

#### Parameters

##### cpfCnpj

`string`

#### Returns

`Promise`\<[`Cliente`](../types/type-aliases/Cliente.md) \| `null`\>

***

### buscarClientesPorId()

> **buscarClientesPorId**(`id`): `Promise`\<[`Cliente`](../types/type-aliases/Cliente.md)\>

Defined in: [resources/clientes/index.ts:60](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/clientes/index.ts#L60)

Busca um cliente pelo seu id.

#### Parameters

##### id

`number`

#### Returns

`Promise`\<[`Cliente`](../types/type-aliases/Cliente.md)\>

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

### filtrarClientes()

> **filtrarClientes**(`attr`, `oper`, `page`, `sortAttr`, `sortorder`): `Promise`\<[`Cliente`](../types/type-aliases/Cliente.md)[]\>

Defined in: [resources/clientes/index.ts:17](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/clientes/index.ts#L17)

Filtra clientes com base nos atributos fornecidos.

#### Parameters

##### attr

###### cnpj_cpf?

`string` \| `number` \| `boolean`

###### email?

`string` \| `number` \| `boolean`

###### endereco?

`string` \| `number` \| `boolean`

###### fantasia?

`string` \| `number` \| `boolean`

###### fone?

`string` \| `number` \| `boolean`

###### hotsite_email?

`string` \| `number` \| `boolean`

###### id?

`string` \| `number` \| `boolean`

###### numero?

`string` \| `number` \| `boolean`

###### razao?

`string` \| `number` \| `boolean`

###### senha?

`string` \| `number` \| `boolean`

##### oper

`"="` | `">"` | `"<"` | `"like"`

##### page

`number` = `1`

##### sortAttr

keyof [`Cliente`](../types/type-aliases/Cliente.md) = `'cnpj_cpf'`

##### sortorder

`"desc"` | `"asc"`

#### Returns

`Promise`\<[`Cliente`](../types/type-aliases/Cliente.md)[]\>

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
