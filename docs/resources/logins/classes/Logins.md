[**IXC SDK v1.0.0**](../../../README.md)

***

[IXC SDK](../../../modules.md) / [resources/logins](../README.md) / Logins

# Class: Logins

Defined in: [resources/logins/index.ts:9](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/logins/index.ts#L9)

Classe para gerenciar logins de conexão (radusuarios).

## Extends

- [`QueryBase`](../../base/classes/QueryBase.md)

## Constructors

### Constructor

> **new Logins**(`config`): `Logins`

Defined in: [resources/logins/index.ts:10](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/logins/index.ts#L10)

#### Parameters

##### config

###### baseUrl

`string`

###### token

`string`

#### Returns

`Logins`

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

### desconectarSessao()

> **desconectarSessao**(`id`): `Promise`\<`any`\>

Defined in: [resources/logins/index.ts:50](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/logins/index.ts#L50)

Desconecta a sessão de um usuário.

#### Parameters

##### id

`number`

#### Returns

`Promise`\<`any`\>

***

### limparMac()

> **limparMac**(`id`): `Promise`\<`any`\>

Defined in: [resources/logins/index.ts:43](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/logins/index.ts#L43)

Limpa o MAC address de um login de conexão.

#### Parameters

##### id

`number`

#### Returns

`Promise`\<`any`\>

***

### listar()

> **listar**(`attr`, `oper`, `page`, `sortAttr`, `sortorder`): `Promise`\<[`Login`](../types/type-aliases/Login.md)[]\>

Defined in: [resources/logins/index.ts:17](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/logins/index.ts#L17)

Lista/Filtra logins.

#### Parameters

##### attr

###### id?

`string` \| `number` \| `boolean`

###### id_cliente?

`string` \| `number` \| `boolean`

###### id_contrato?

`string` \| `number` \| `boolean`

###### login?

`string` \| `number` \| `boolean`

###### online?

`string` \| `number` \| `boolean`

###### sinal_ultimo_atendimento?

`string` \| `number` \| `boolean`

###### tempo_conectado?

`string` \| `number` \| `boolean`

##### oper

`"="` | `">"` | `"<"` | `"like"`

##### page

`number` = `1`

##### sortAttr

[`LoginAttrs`](../types/type-aliases/LoginAttrs.md) = `'id'`

##### sortorder

`"desc"` | `"asc"`

#### Returns

`Promise`\<[`Login`](../types/type-aliases/Login.md)[]\>

***

### obterDiagnostico()

> **obterDiagnostico**(`id`): `Promise`\<[`Login`](../types/type-aliases/Login.md)\>

Defined in: [resources/logins/index.ts:58](https://github.com/KaduSR/ixc-rest-api-gateway/blob/f10df881f542ff5ff11c581f7b4cee1f7a8b9ab1/src/resources/logins/index.ts#L58)

Obtém um diagnóstico em tempo real do login.

#### Parameters

##### id

`number`

#### Returns

`Promise`\<[`Login`](../types/type-aliases/Login.md)\>

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
