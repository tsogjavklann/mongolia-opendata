'use client';

import { useEffect, useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Image as ImageIcon, Code, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportChartAsPNG, buildEmbedURL, buildEmbedSnippet } from '@/lib/chartExport';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ShareModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'url' | 'embed' | 'png'>('url');
  const [url, setUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [pngStatus, setPngStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (open) {
      setUrl(window.location.href);
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q') ?? '';
      setEmbedUrl(buildEmbedURL(q));
      setEmbedCode(buildEmbedSnippet(q));
      setPngStatus('idle');
    }
  }, [open]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} хуулагдсан`);
    } catch {
      toast.error('Хуулж чадсангүй');
    }
  };

  const downloadPNG = async () => {
    setPngStatus('working');
    try {
      const charts = document.querySelectorAll('.recharts-responsive-container');
      const target = (charts[0] ?? document.querySelector('svg')) as HTMLElement | null;
      if (!target) throw new Error('Графикийн SVG олдсонгүй');
      await exportChartAsPNG(target, `mongolia-chart-${Date.now()}.png`);
      setPngStatus('done');
      toast.success('PNG татагдсан');
      setTimeout(() => setPngStatus('idle'), 2500);
    } catch (e) {
      setPngStatus('error');
      toast.error(e instanceof Error ? e.message : 'PNG татаж чадсангүй');
    }
  };

  const shareTitle = 'Mongolia OpenData — SQL query';
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(url)}`;
  const ln = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <TooltipProvider delayDuration={150}>
      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                className="icon-btn h-8 w-8 inline-flex items-center justify-center"
                aria-label="Share"
              >
                <Share2 size={14} />
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Хуваалцах</TooltipContent>
        </Tooltip>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 size={16} className="text-accent" />
              Хуваалцах
            </DialogTitle>
            <DialogDescription>
              URL, embed код, эсвэл PNG зураг гэсэн 3 аргаар хуваалцах боломжтой.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'url' | 'embed' | 'png')}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="url"><Link2 size={11} /> URL</TabsTrigger>
              <TabsTrigger value="embed"><Code size={11} /> Embed</TabsTrigger>
              <TabsTrigger value="png"><ImageIcon size={11} /> PNG</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Энэ link-ийг хуваалцахад хүлээн авагч ижил SQL query + chart-ыг харна.
              </p>
              <UrlBox value={url} onCopy={() => copy(url, 'URL')} />
              <div className="space-y-2">
                <div className="label-upper">Социал сүлжээ</div>
                <div className="flex gap-2">
                  <ShareLink href={fb} label="Facebook" color="#1877F2" />
                  <ShareLink href={tw} label="Twitter / X" color="#000000" />
                  <ShareLink href={ln} label="LinkedIn" color="#0A66C2" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-3">
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Сэтгүүлчид нийтлэлд оруулахад: HTML iframe код. WordPress, Webflow, news сайтад copy/paste.
              </p>
              <UrlBox value={embedUrl} onCopy={() => copy(embedUrl, 'Embed URL')} />
              <CodeBox value={embedCode} onCopy={() => copy(embedCode, 'Embed код')} />
              <div className="rounded-lg border border-accent/15 bg-accent-dim p-3">
                <div className="text-[11px] text-accent font-semibold mb-1">Жишээ хэрэглээ</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  Embed нь өөрөө ҮСХ-ын эх сурвалжийг харуулна.
                </div>
              </div>
            </TabsContent>

            <TabsContent value="png" className="space-y-3">
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Графикийг өндөр чанартай PNG зураг болгож татах. Twitter post, тайланд оруулахад тохиромжтой.
              </p>
              <Button
                onClick={downloadPNG}
                disabled={pngStatus === 'working'}
                className="w-full"
                size="lg"
              >
                {pngStatus === 'working' ? (
                  <Loader2 size={14} className="spin" />
                ) : pngStatus === 'done' ? (
                  <Check size={14} />
                ) : (
                  <ImageIcon size={14} />
                )}
                {pngStatus === 'working' ? 'Боловсруулж байна'
                  : pngStatus === 'done' ? 'Татсан'
                    : 'PNG татах (2x чанар)'}
              </Button>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Зөвлөмж: PNG татахын өмнө график нь дэлгэцэн дээр харагдаж байх ёстой.
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function UrlBox({ value, onCopy }: { value: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex gap-2 items-center rounded-lg border border-border bg-surface-darker p-1 pl-3">
      <input
        type="text"
        readOnly
        value={value}
        onClick={(e) => e.currentTarget.select()}
        className="flex-1 min-w-0 bg-transparent border-0 text-foreground text-xs font-mono outline-none"
      />
      <Button onClick={handle} size="sm" variant={copied ? 'default' : 'outline'}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Хуулсан' : 'Хуулах'}
      </Button>
    </div>
  );
}

function CodeBox({ value, onCopy }: { value: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative rounded-lg border border-border bg-surface-darker p-3">
      <pre className="m-0 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all max-h-24 overflow-auto">
        {value}
      </pre>
      <Button onClick={handle} size="sm" variant={copied ? 'default' : 'outline'} className="absolute top-2 right-2">
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? 'Хуулсан' : 'Хуулах'}
      </Button>
    </div>
  );
}

function ShareLink({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-[12px] font-semibold transition-opacity hover:opacity-90"
      style={{ background: color }}
    >
      {label} <ExternalLink size={11} />
    </a>
  );
}
