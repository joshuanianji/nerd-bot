// some global context values

type Context = {
    token: string,
    appID: string
} & (DevContext | ProdContext)

type DevContext = {
    mode: 'development'
    guildID: string,
    devs: string[]
}

type ProdContext = {
    mode: 'production'
}

export type { Context };