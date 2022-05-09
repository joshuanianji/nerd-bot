// some global context values

type Context = {
    token: string,
    appID: string,
    media: Media
} & (DevContext | ProdContext)

type DevContext = {
    mode: 'development'
    guildID: string,
    devs: string[]
}

type ProdContext = {
    mode: 'production'
}

// media names to their path
interface Media {
    [key: string]: string
}

export type { Context, Media };