import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ChangelogPage() {
  // Read the changelog file from the root directory
  const changelogPath = path.join(process.cwd(), 'changelog.md');
  let rawContent = '';
  try {
    rawContent = fs.readFileSync(changelogPath, 'utf-8');
  } catch {
    rawContent = 'No changelog found.';
  }

  interface Version {
    version: string;
    date: string;
    type: string;
    description: string;
    changes: string[];
  }

  // A very lightweight parser to turn the markdown into a beautiful timeline
  const lines = rawContent.split('\n');
  const versions: Version[] = [];
  let currentVersion: Version | null = null;

  lines.forEach(line => {
    const text = line.trim();
    if (!text) return;

    if (text.startsWith('## ')) {
      if (currentVersion) versions.push(currentVersion);
      const titleParts = text.replace('## ', '').split(' ');
      const versionNumber = titleParts[0];
      const date = titleParts.slice(1).join(' ');
      
      currentVersion = {
        version: versionNumber,
        date: date,
        type: 'Release',
        description: '',
        changes: []
      };
    } else if (text.startsWith('### ')) {
      if (currentVersion) {
        currentVersion.type = text.replace('### ', '');
      }
    } else if (text.startsWith('-')) {
      if (currentVersion) {
        currentVersion.changes.push(text.substring(1).trim());
      }
    } else if (!text.startsWith('#')) {
      // Regular text (description)
      if (currentVersion) {
        currentVersion.description = text;
      }
    }
  });

  if (currentVersion) {
    versions.push(currentVersion);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 overflow-y-auto font-sans">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-16 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Chat
        </Link>

        <header className="mb-16">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">
            Changelog
          </h1>
          <p className="text-white/40 text-sm">
            Latest updates, improvements, and fixes.
          </p>
        </header>

        <div className="relative border-l border-white/10 ml-2 md:ml-4 space-y-16 pb-8">
          {versions.map((v, i) => (
            <div key={i} className="relative pl-8 md:pl-12">
              {/* Simple Timeline Dot */}
              <div className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full bg-primary-500 -translate-x-[5.5px] ring-4 ring-background" />

              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-6">
                <h2 className="text-xl font-semibold text-white/90">
                  {v.version}
                </h2>
                {v.date && (
                  <span className="text-sm font-mono text-white/40">
                    {v.date}
                  </span>
                )}
              </div>
              
              {v.description && (
                <p className="text-white/60 text-sm mb-6 leading-relaxed">
                  {v.description}
                </p>
              )}
              
              {v.changes.length > 0 && (
                <ul className="space-y-3">
                  {v.changes.map((change: string, idx: number) => (
                    <li key={idx} className="flex gap-4 text-sm text-white/70 items-start group">
                      <span className="text-white/20 mt-1 transition-colors group-hover:text-primary-500/50">—</span>
                      <span className="leading-relaxed">{change}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
