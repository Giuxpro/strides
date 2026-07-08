// Props contables para el juego "A contar". Son emojis Fluent de ruta plana
// (animales/objetos/comida), independientes de cualquier módulo o vocabulario:
// el juego solo enseña el número, el prop es decorativo y se sortea en cada ronda.
export interface CountEmoji {
  codepoint: string
  singular: string
  plural: string
  pluralEs: string
  gender: 'm' | 'f'
}

export const EMOJI_COUNT_POOL: CountEmoji[] = [
  { codepoint: '1f436', singular: 'dog',        plural: 'dogs',        pluralEs: 'perros',     gender: 'm' },
  { codepoint: '1f431', singular: 'cat',        plural: 'cats',        pluralEs: 'gatos',      gender: 'm' },
  { codepoint: '1f430', singular: 'rabbit',     plural: 'rabbits',     pluralEs: 'conejos',    gender: 'm' },
  { codepoint: '1f437', singular: 'pig',        plural: 'pigs',        pluralEs: 'cerdos',     gender: 'm' },
  { codepoint: '1f438', singular: 'frog',       plural: 'frogs',       pluralEs: 'ranas',      gender: 'f' },
  { codepoint: '1f435', singular: 'monkey',     plural: 'monkeys',     pluralEs: 'monos',      gender: 'm' },
  { codepoint: '1f981', singular: 'lion',       plural: 'lions',       pluralEs: 'leones',     gender: 'm' },
  { codepoint: '1f984', singular: 'unicorn',    plural: 'unicorns',    pluralEs: 'unicornios', gender: 'm' },
  { codepoint: '1f427', singular: 'penguin',    plural: 'penguins',    pluralEs: 'pingüinos',  gender: 'm' },
  { codepoint: '1f422', singular: 'turtle',     plural: 'turtles',     pluralEs: 'tortugas',   gender: 'f' },
  { codepoint: '1f41f', singular: 'fish',       plural: 'fish',        pluralEs: 'peces',      gender: 'm' },
  { codepoint: '1f98b', singular: 'butterfly',  plural: 'butterflies', pluralEs: 'mariposas',  gender: 'f' },
  { codepoint: '1f41d', singular: 'bee',        plural: 'bees',        pluralEs: 'abejas',     gender: 'f' },
  { codepoint: '1f41e', singular: 'ladybug',    plural: 'ladybugs',    pluralEs: 'mariquitas', gender: 'f' },
  { codepoint: '1f34e', singular: 'apple',      plural: 'apples',      pluralEs: 'manzanas',   gender: 'f' },
  { codepoint: '1f34c', singular: 'banana',     plural: 'bananas',     pluralEs: 'plátanos',   gender: 'm' },
  { codepoint: '1f353', singular: 'strawberry', plural: 'strawberries',pluralEs: 'fresas',     gender: 'f' },
  { codepoint: '1f36a', singular: 'cookie',     plural: 'cookies',     pluralEs: 'galletas',   gender: 'f' },
  { codepoint: '1f382', singular: 'cake',       plural: 'cakes',       pluralEs: 'pasteles',   gender: 'm' },
  { codepoint: '2b50',  singular: 'star',       plural: 'stars',       pluralEs: 'estrellas',  gender: 'f' },
  { codepoint: '1f388', singular: 'balloon',    plural: 'balloons',    pluralEs: 'globos',     gender: 'm' },
  { codepoint: '1f33b', singular: 'flower',     plural: 'flowers',     pluralEs: 'flores',     gender: 'f' },
  { codepoint: '1f697', singular: 'car',        plural: 'cars',        pluralEs: 'carros',     gender: 'm' },
  { codepoint: '1f680', singular: 'rocket',     plural: 'rockets',     pluralEs: 'cohetes',    gender: 'm' },
]

const NUMBER_WORDS_EN = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
]

export function numberWordEn(n: number): string {
  return NUMBER_WORDS_EN[n] ?? String(n)
}

// Config del juego "A contar" (editable en Admin → Ajustes, por juego).
export interface CountingConfig {
  maxCount: number // máximo de objetos a contar en una ronda (mínimo siempre 1)
  rounds: number   // número de rondas por partida
}

export const COUNTING_DEFAULTS: CountingConfig = { maxCount: 10, rounds: 6 }
export const COUNTING_MAX_COUNT_LIMIT = 20
export const COUNTING_ROUNDS_LIMIT = 15
