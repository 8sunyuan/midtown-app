'use client'

import { useRouter } from 'next/navigation'

interface Season {
  id: string
  name: string
}

interface SeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId: string
  basePath: string // e.g., '/schedule' or '/standings'
}

export function SeasonSelector({ seasons, selectedSeasonId, basePath }: SeasonSelectorProps) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`${basePath}?season=${e.target.value}`)
  }

  return (
    <div className="mb-6">
      <label htmlFor="season" className="block text-sm font-medium text-muted-foreground mb-2">
        Select Season
      </label>
      <select
        id="season"
        name="season"
        className="block w-64 rounded-lg border-border bg-white shadow-sm focus:border-primary focus:ring-primary p-2.5 border text-foreground"
        defaultValue={selectedSeasonId}
        onChange={handleChange}
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
          </option>
        ))}
      </select>
    </div>
  )
}

