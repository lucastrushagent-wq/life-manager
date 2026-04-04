import { VisionStatementSection } from './VisionStatementSection'
import { CoreValuesSection } from './CoreValuesSection'
import { VisionImageSection } from './VisionImageSection'
import { GoalsSection } from './GoalsSection'
import { ManifestoSection } from './ManifestoSection'
import { useVisionStore } from '../store'

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  )
}

export function VisionModule() {
  const { loaded } = useVisionStore()

  if (!loaded) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Vision</h1>
        <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
      <h1 className="text-xl font-semibold text-gray-900">Vision</h1>

      <section>
        <SectionHeader
          title="Vision Statement"
          subtitle="The single sentence (or paragraph) that describes the life you are building."
        />
        <VisionStatementSection />
      </section>

      <hr className="border-gray-100" />

      <section>
        <SectionHeader
          title="Core Values"
          subtitle="The principles that guide every decision you make."
        />
        <CoreValuesSection />
      </section>

      <hr className="border-gray-100" />

      <section>
        <SectionHeader
          title="Future Vision"
          subtitle="A photo of where you want to be — your destination made real."
        />
        <VisionImageSection />
      </section>

      <hr className="border-gray-100" />

      <section>
        <SectionHeader
          title="Goals"
          subtitle="What you are working toward, organized by area of life."
        />
        <GoalsSection />
      </section>

      <hr className="border-gray-100" />

      <section>
        <SectionHeader
          title="Personal Manifesto"
          subtitle="Your declaration of how you live, what you stand for, and what you refuse to accept."
        />
        <ManifestoSection />
      </section>
    </div>
  )
}
