export interface FormatMsgConfig {
  indent?: number
  star?: boolean
  nl?: boolean
}
export const formatMsg = (
  msg: string,
  config: FormatMsgConfig = {}
): string => {
  const { indent = 0, star, nl = true } = config

  msg = msg
    .split('\n')
    .map((m) => {
      if (star) m = `* ${m}`
      m = '  '.repeat(indent) + m
      return m
    })
    .join('\n')
  if (nl) msg += '\n'

  return msg
}
