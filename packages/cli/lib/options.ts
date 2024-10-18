import { Option } from 'commander'

export const variable = new Option('--variable <name=value>', 'Variable to set in kopflos config')
  .default({})
  .argParser(function (str: string, all: Record<string, string>) {
    const [key, value] = str.split('=', 2)

    return {
      ...all,
      [key]: value,
    }
  })
