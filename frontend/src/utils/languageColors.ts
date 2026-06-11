export const languageColors: Record<string, string> = {
  'Python': '#3572A5',
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Vue': '#41b883',
  'React': '#61dafb',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C': '#555555',
  'C#': '#178600',
  'Ruby': '#701516',
  'PHP': '#4F5D95',
  'Shell': '#89e051',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'SCSS': '#c6538c',
  'Less': '#1d365d',
  'Dockerfile': '#384d54',
  'Kotlin': '#A97BFF',
  'Swift': '#F05138',
  'Dart': '#00B4AB',
  'Lua': '#000080',
  'Perl': '#0298c3',
  'Haskell': '#5e5086',
  'Elixir': '#6e4a7e',
  'Clojure': '#db5855',
  'Erlang': '#B83998',
  'Scala': '#c22d40',
  'R': '#198CE7',
  'MATLAB': '#e16737',
  'Assembly': '#6E4C13',
  'Objective-C': '#438eff',
  'Solidity': '#AA6746',
  'default': '#6c7086'
}

export function getLanguageColor(language: string | null): string {
  if (!language) return languageColors['default']
  return languageColors[language] || languageColors['default']
}
