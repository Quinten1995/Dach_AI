import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Mic, X, ChevronLeft, Loader2, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '../utils/supabase'
import { useAuth } from '../hooks/useAuth'

const MAX_PHOTOS = 5
const MAX_SECONDS = 90
const STEPS = ['Fotos', 'Sprachnotiz', 'Analyse']

export default function NewProjectPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const [step, setStep] = useState(0)
  const [photos, setPhotos] = useState([])
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [kunde, setKunde] = useState('')
  const [adresse, setAdresse] = useState('')
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const newPhotos = files.slice(0, MAX_PHOTOS - photos.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= MAX_SECONDS - 1) { stopRecording(); return s }
          return s + 1
        })
      }, 1000)
    } catch {
      alert('Mikrofon-Zugriff verweigert.')
    }
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const startAnalysis = async () => {
    setStep(2)
    setError('')

    try {
      // 1. Projekt in Supabase anlegen
      const { data: projekt, error: projektError } = await supabase
        .from('projekte')
        .insert({ kunde, adresse, user_id: user.id, status: 'entwurf' })
        .select()
        .single()

      if (projektError) throw projektError

      // 2. Fotos in Supabase Storage hochladen
      for (let i = 0; i < photos.length; i++) {
        const foto = photos[i]
        const path = `${user.id}/${projekt.id}/foto_${i}.jpg`
        await supabase.storage.from('fotos').upload(path, foto.file)
        await supabase.from('fotos').insert({ projekt_id: projekt.id, storage_path: path, sort_order: i })
      }

      // 3. Weiterleiten zum Projekt (KI-Analyse kommt später)
      navigate(`/projekt/${projekt.id}`)

    } catch (err) {
      setError('Fehler beim Speichern. Bitte erneut versuchen.')
      setStep(1)
    }
  }

  const formatSeconds = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="bg-white border-b border-zinc-100 px-4 py-4 pt-safe flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/')} className="p-2 -ml-2 text-zinc-500">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-semibold text-zinc-900">Neue Besichtigung</h1>
      </div>

      <div className="flex gap-1 px-4 py-3 bg-white border-b border-zinc-100">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col gap-1">
            <div className={clsx('h-1 rounded-full transition-colors', i <= step ? 'bg-brand-500' : 'bg-zinc-200')} />
            <span className={clsx('text-xs', i === step ? 'text-brand-500 font-medium' : 'text-zinc-400')}>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {step === 0 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="label">Kundenname</label>
                <input type="text" value={kunde} onChange={(e) => setKunde(e.target.value)} placeholder="z.B. Familie Müller" className="input" />
              </div>
              <div>
                <label className="label">Adresse der Baustelle</label>
                <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="z.B. Hauptstr. 12, 80331 München" className="input" />
              </div>
            </div>

            <div>
              <label className="label">Fotos <span className="text-zinc-400 font-normal">({photos.length}/{MAX_PHOTOS})</span></label>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={photo.preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
                    <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 bg-zinc-900/70 rounded-full flex items-center justify-center">
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square upload-zone rounded-xl">
                    <Camera size={24} className="text-zinc-400 mb-1" />
                    <span className="text-xs text-zinc-400">Foto</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
            </div>

            <button onClick={() => setStep(1)} disabled={photos.length === 0 || !kunde} className="btn-primary">
              Weiter zur Sprachnotiz →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-zinc-600 text-sm mb-1">Beschreibe kurz was du gesehen hast:</p>
              <p className="text-zinc-400 text-xs">Schäden, Materialien, Besonderheiten, dein erster Eindruck</p>
            </div>

            <div className="flex flex-col items-center gap-4 py-8">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={clsx('w-24 h-24 rounded-full flex items-center justify-center transition-all',
                  recording ? 'bg-red-500 scale-110 shadow-xl shadow-red-500/30' :
                  audioBlob ? 'bg-green-500 shadow-lg' : 'bg-brand-500 shadow-lg shadow-brand-500/30'
                )}
              >
                {audioBlob && !recording ? <CheckCircle size={36} className="text-white" /> : <Mic size={36} className="text-white" />}
              </button>

              <div className="text-center">
                {recording ? (
                  <>
                    <p className="text-red-500 font-mono font-semibold text-xl">{formatSeconds(recordingSeconds)}</p>
                    <p className="text-sm text-zinc-500">Aufnahme läuft – tippe zum Stoppen</p>
                  </>
                ) : audioBlob ? (
                  <>
                    <p className="text-green-600 font-medium">Aufnahme gespeichert ✓</p>
                    <button onClick={() => { setAudioBlob(null); setRecordingSeconds(0) }} className="text-sm text-zinc-400 mt-1 underline">Neu aufnehmen</button>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">Tippen zum Starten (max. {MAX_SECONDS}s)</p>
                )}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary">Zurück</button>
              <button onClick={startAnalysis} className="btn-primary flex-1">
                Speichern →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center">
              <Loader2 size={36} className="text-brand-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-zinc-900 text-lg">Wird gespeichert…</p>
              <p className="text-zinc-500 text-sm mt-1">Fotos werden hochgeladen</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
