import { useRef, useState } from 'react'
import { Upload, Trash2, ImageIcon } from 'lucide-react'
import { useVisionStore } from '../store'

export function VisionImageSection() {
  const { image, uploadImage, deleteImage } = useVisionStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      await uploadImage(dataUrl)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDelete = async () => {
    await deleteImage()
    setConfirmDelete(false)
  }

  // Bust cache on re-upload by appending timestamp
  const imgSrc = image.url ? `${image.url}?t=${Date.now()}` : undefined

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      {image.exists && imgSrc ? (
        <div className="relative group">
          <img
            src={imgSrc}
            alt="Future vision"
            className="w-full max-h-96 object-cover rounded-xl border border-gray-200 shadow-sm"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-end justify-end p-3 gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs rounded-md shadow hover:bg-gray-50"
            >
              <Upload className="w-3.5 h-3.5" /> Replace
            </button>
            {confirmDelete ? (
              <div className="flex gap-1.5">
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md shadow hover:bg-red-700">
                  Remove
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 bg-white text-gray-700 text-xs rounded-md shadow hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 bg-white text-gray-700 rounded-md shadow hover:bg-gray-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
        >
          {uploading ? (
            <p className="text-sm text-gray-400">Uploading…</p>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-gray-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Upload your future vision</p>
                <p className="text-xs text-gray-400 mt-0.5">Drag & drop or click to browse · JPG, PNG, WEBP</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
