import { Brain, Database, FileText, Image as ImageIcon, Video, Zap } from 'lucide-react';

import { Container } from '@/components/container';

export function ExamplesSection() {
  const features = [
    {
      icon: Video,
      title: "Video Analysis",
      description: "Extract transcripts, key moments, and insights from video content"
    },
    {
      icon: ImageIcon,
      title: "Image Processing",
      description: "Analyze images for text, objects, and visual patterns"
    },
    {
      icon: FileText,
      title: "Document Parsing",
      description: "Extract structured data from PDFs, Word docs, and presentations"
    },
    {
      icon: Database,
      title: "Data Extraction",
      description: "Convert unstructured content into organized, searchable data"
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "Generate summaries, classifications, and actionable insights"
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Fast, automated workflows with real-time results"
    }
  ];

  return (
    <section className='py-16'>
      <Container>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-neutral-900 mb-4'>
            Powerful Asset Processing
          </h2>
          <p className='text-lg text-neutral-600 max-w-2xl mx-auto'>
            Transform any type of content into structured, actionable data with our AI-powered platform
          </p>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {features.map((feature, index) => (
            <div 
              key={index}
              className='group p-6 rounded-xl border border-neutral-200 hover:border-primary/30 bg-white hover:shadow-lg transition-all duration-300'
            >
              <div className='flex items-center gap-4 mb-4'>
                <div className='p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors'>
                  <feature.icon className='h-6 w-6 text-primary' />
                </div>
                <h3 className='text-xl font-semibold text-neutral-900'>
                  {feature.title}
                </h3>
              </div>
              <p className='text-neutral-600 leading-relaxed'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
} 