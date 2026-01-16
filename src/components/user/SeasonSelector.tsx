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
      <label htmlFor="season" className="text-muted-foreground mb-2 block text-sm font-medium">
        Select Season
      </label>
      <select
        id="season"
        name="season"
        className="border-border focus:border-primary focus:ring-primary text-foreground block w-64 rounded-lg border bg-white p-2.5 shadow-sm"
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
