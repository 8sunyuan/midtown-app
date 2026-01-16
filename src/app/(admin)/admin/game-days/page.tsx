'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'
import Image from 'next/image'

type Season = {
  id: string
  name: string
}

type GameDay = {
  id: string
  game_date: string
  description: string | null
  image_url: string | null
  seasons: {
    name: string
  }
}

export default function GameDaysPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [currentGameDay, setCurrentGameDay] = useState<GameDay | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      loadGameDays(selectedSeason)
    }
  }, [selectedSeason])

  const loadSeasons = async () => {
    const { data, error } = await supabase
      .from('seasons')
      .select('id, name')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSeasons(data)
      if (data.length > 0 && !selectedSeason) {
        setSelectedSeason(data[0].id)
      }
    }
  }

  const loadGameDays = async (seasonId: string) => {
    const { data, error } = await supabase
      .from('game_days')
      .select(`
        id,
        game_date,
        description,
        image_url,
        seasons (
          name
        )
      `)
      .eq('season_id', seasonId)
      .order('game_date', { ascending: true })

    if (!error && data) {
      setGameDays(data as GameDay[])
    }
  }

  const openEditDialog = (gameDay: GameDay) => {
    setCurrentGameDay(gameDay)
    setDescription(gameDay.description || '')
    setImageFile(null)
    setError(null)
    setSuccess(null)
    setIsEditDialogOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }
      setImageFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentGameDay) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      let imageUrl = currentGameDay.image_url

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${selectedSeason}/${currentGameDay.id}/${Date.now()}.${fileExt}`

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('schedule-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          setError('Failed to upload image')
          setLoading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('schedule-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Update game day
      const { error: updateError } = await supabase
        .from('game_days')
        .update({
          description,
          image_url: imageUrl,
        })
        .eq('id', currentGameDay.id)

      if (updateError) {
        setError('Failed to update game day')
        setLoading(false)
        return
      }

      setSuccess('Game day updated successfully')
      setIsEditDialogOpen(false)
      loadGameDays(selectedSeason)
    } catch (err) {
      setError('An unexpected error occurred')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative overflow-hidden py-8">
      {/* Decorative background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[1000px] h-[700px] opacity-[0.03] relative">
          <img
            src="/images/volleyball-players-dark.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Game Day Schedules</h1>
            <p className="text-muted-foreground mt-2">Upload schedules and information for game days</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">
            {success}
          </div>
        )}

        <div className="mb-6">
          <Label htmlFor="season">Select Season</Label>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Game Days</CardTitle>
            <CardDescription>
              Click on a game day to add schedule details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gameDays.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameDays.map((gameDay) => (
                    <TableRow key={gameDay.id}>
                      <TableCell className="font-medium">
                        {new Date(gameDay.game_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        {gameDay.description ? (
                          <span className="text-sm">{gameDay.description.substring(0, 50)}...</span>
                        ) : (
                          <span className="text-gray-400">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {gameDay.image_url ? (
                          <span className="text-green-600">✓ Uploaded</span>
                        ) : (
                          <span className="text-gray-400">No image</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(gameDay)}
                        >
                          Edit Schedule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {selectedSeason ? 'No game days found. Generate game days in season management first.' : 'Select a season to view game days'}
              </p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Game Day Schedule</DialogTitle>
              <DialogDescription>
                {currentGameDay && new Date(currentGameDay.game_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Schedule Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter game schedule details (courts, times, matchups, etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Schedule Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Upload an image of the schedule (max 5MB)
                </p>
              </div>

              {currentGameDay?.image_url && (
                <div className="space-y-2">
                  <Label>Current Image</Label>
                  <div className="relative w-full h-64 bg-gray-100 rounded">
                    <Image
                      src={currentGameDay.image_url}
                      alt="Schedule"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Schedule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

